using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Roue.Application.Interface;
using Roue.Infrastructure.Persistence;
using Npgsql.EntityFrameworkCore.PostgreSQL;

namespace Roue.API.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public sealed class UsersAdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAuditLogger _audit;

    public UsersAdminController(AppDbContext db, UserManager<IdentityUser<Guid>> users, IAuditLogger audit)
    {
        _db = db;
        _users = users;
        _audit = audit;
    }

    public sealed record UserListItem(Guid Id, string? Email, string? DisplayName, string? PhoneNumber, bool EmailConfirmed, bool IsAdmin, bool LockedOut, DateTimeOffset? LockoutEnd, string[] Roles);
    public sealed record PagedUsersResponse(int Total, int Page, int PageSize, IReadOnlyList<UserListItem> Items);
    public sealed record ClaimDto(string Type, string Value);
    public sealed record ExternalLoginDto(string LoginProvider, string ProviderKey, string? DisplayName);
    public sealed record UserDetail(
        Guid Id,
        string? Email,
        string? UserName,
        string? DisplayName,
        string? PhoneNumber,
        bool EmailConfirmed,
        bool TwoFactorEnabled,
        bool IsAdmin,
        bool LockedOut,
        DateTimeOffset? LockoutEnd,
        int AccessFailedCount,
        bool LockoutEnabled,
        string[] Roles,
        IReadOnlyList<ClaimDto> Claims,
        IReadOnlyList<ExternalLoginDto> ExternalLogins);

    public sealed record UpdateUserRequest(string? PhoneNumber, string? DisplayName, bool? EmailConfirmed);
    public sealed record UpdateAdminRoleRequest(bool IsAdmin);
    public sealed record LockRequest(bool Lock, string? Reason);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        page = page <= 0 ? 1 : page;
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            var norm = term.ToUpperInvariant();
            query = query.Where(u =>
                (u.Email != null && EF.Functions.ILike(u.Email, $"%{term}%")) ||
                (u.UserName != null && EF.Functions.ILike(u.UserName, $"%{term}%")) ||
                (u.NormalizedEmail != null && u.NormalizedEmail.Contains(norm)));
        }

        var total = await query.CountAsync(ct);
        var users = await query
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.UserName,
                u.PhoneNumber,
                u.EmailConfirmed,
                u.LockoutEnd,
                u.LockoutEnabled
            })
            .ToListAsync(ct);

        var ids = users.Select(u => u.Id).ToList();
        var roleMap = await _db.UserRoles
            .Where(ur => ids.Contains(ur.UserId))
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
            .GroupBy(x => x.UserId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.Name ?? string.Empty).Distinct().ToArray(), ct);

        var nameClaims = await _db.UserClaims
            .Where(c => ids.Contains(c.UserId) && c.ClaimType == ClaimTypes.Name)
            .GroupBy(c => c.UserId)
            .Select(g => new { UserId = g.Key, Value = g.OrderByDescending(c => c.Id).Select(c => c.ClaimValue).FirstOrDefault() })
            .ToDictionaryAsync(x => x.UserId, x => x.Value, ct);

        var items = users.Select(u =>
        {
            roleMap.TryGetValue(u.Id, out var roles);
            var displayName = nameClaims.TryGetValue(u.Id, out var val) ? val : null;
            var lockedOut = u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow;
            var isAdmin = roles?.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)) ?? false;
            return new UserListItem(u.Id, u.Email, displayName, u.PhoneNumber, u.EmailConfirmed, isAdmin, lockedOut, u.LockoutEnd, roles ?? Array.Empty<string>());
        }).ToList();

        return Ok(new PagedUsersResponse(total, page, pageSize, items));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var roles = await _users.GetRolesAsync(user);
        var claims = await _users.GetClaimsAsync(user);
        var logins = await _users.GetLoginsAsync(user);
        var displayName = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
        var lockedOut = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;
        var isAdmin = roles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));

        var dto = new UserDetail(
            user.Id,
            user.Email,
            user.UserName,
            displayName,
            user.PhoneNumber,
            user.EmailConfirmed,
            user.TwoFactorEnabled,
            isAdmin,
            lockedOut,
            user.LockoutEnd,
            user.AccessFailedCount,
            user.LockoutEnabled,
            roles.ToArray(),
            claims.Select(c => new ClaimDto(c.Type, c.Value)).ToList(),
            logins.Select(l => new ExternalLoginDto(l.LoginProvider, l.ProviderKey, l.ProviderDisplayName)).ToList());

        return Ok(dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest body, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(body.PhoneNumber))
        {
            user.PhoneNumber = body.PhoneNumber;
        }
        else if (body.PhoneNumber == string.Empty)
        {
            user.PhoneNumber = null;
        }

        if (body.EmailConfirmed.HasValue)
        {
            user.EmailConfirmed = body.EmailConfirmed.Value;
        }

        var updateResult = await _users.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { errors = updateResult.Errors.Select(e => e.Description) });
        }

        if (body.DisplayName is not null)
        {
            var claims = await _users.GetClaimsAsync(user);
            var current = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name);
            if (current is not null)
            {
                await _users.RemoveClaimAsync(user, current);
            }
            if (!string.IsNullOrWhiteSpace(body.DisplayName))
            {
                await _users.AddClaimAsync(user, new Claim(ClaimTypes.Name, body.DisplayName.Trim()));
            }
        }

        await _audit.LogAsync("admin.user_updated", subjectType: "User", subjectId: user.Id.ToString());
        return NoContent();
    }

    [HttpPost("{id:guid}/roles")]
    public async Task<IActionResult> UpdateAdminRole(Guid id, [FromBody] UpdateAdminRoleRequest body)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var currentUserId = User?.Identity?.IsAuthenticated == true ? _users.GetUserId(User) : null;
        if (!string.IsNullOrEmpty(currentUserId) && Guid.TryParse(currentUserId, out var currentGuid) && currentGuid == id && !body.IsAdmin)
        {
            return BadRequest(new { error = "No puedes quitar tu propio rol de administrador." });
        }

        var inRole = await _users.IsInRoleAsync(user, "Admin");
        IdentityResult result;
        if (body.IsAdmin && !inRole)
        {
            result = await _users.AddToRoleAsync(user, "Admin");
            if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
            await _audit.LogAsync("admin.user_promoted", subjectType: "User", subjectId: user.Id.ToString());
        }
        else if (!body.IsAdmin && inRole)
        {
            result = await _users.RemoveFromRoleAsync(user, "Admin");
            if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
            await _audit.LogAsync("admin.user_demoted", subjectType: "User", subjectId: user.Id.ToString());
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/lock")]
    public async Task<IActionResult> Lock(Guid id, [FromBody] LockRequest body)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var currentUserId = _users.GetUserId(User);
        if (!string.IsNullOrEmpty(currentUserId) && Guid.TryParse(currentUserId, out var currentGuid) && currentGuid == id && body.Lock)
        {
            return BadRequest(new { error = "No puedes bloquear tu propia cuenta." });
        }

        if (body.Lock)
        {
            user.LockoutEnabled = true;
            var setResult = await _users.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            if (!setResult.Succeeded)
            {
                return BadRequest(new { errors = setResult.Errors.Select(e => e.Description) });
            }
            var update = await _users.UpdateAsync(user);
            if (!update.Succeeded)
            {
                return BadRequest(new { errors = update.Errors.Select(e => e.Description) });
            }
            await _audit.LogAsync("admin.user_locked", subjectType: "User", subjectId: user.Id.ToString(), description: body.Reason);
        }
        else
        {
            var setResult = await _users.SetLockoutEndDateAsync(user, null);
            if (!setResult.Succeeded)
            {
                return BadRequest(new { errors = setResult.Errors.Select(e => e.Description) });
            }
            user.LockoutEnabled = false;
            var resetResult = await _users.ResetAccessFailedCountAsync(user);
            if (!resetResult.Succeeded)
            {
                return BadRequest(new { errors = resetResult.Errors.Select(e => e.Description) });
            }
            var update = await _users.UpdateAsync(user);
            if (!update.Succeeded)
            {
                return BadRequest(new { errors = update.Errors.Select(e => e.Description) });
            }
            await _audit.LogAsync("admin.user_unlocked", subjectType: "User", subjectId: user.Id.ToString());
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/force-logout")]
    public async Task<IActionResult> ForceLogout(Guid id)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        await _users.UpdateSecurityStampAsync(user);
        await _audit.LogAsync("admin.user_forced_logout", subjectType: "User", subjectId: user.Id.ToString());
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var currentUserId = _users.GetUserId(User);
        if (!string.IsNullOrEmpty(currentUserId) && Guid.TryParse(currentUserId, out var currentGuid) && currentGuid == id)
        {
            return BadRequest(new { error = "No puedes eliminar tu propia cuenta." });
        }

        var hasOrders = await _db.Orders.AsNoTracking().AnyAsync(o => o.UserId == id, ct);
        if (hasOrders)
        {
            return Conflict(new { error = "No se puede eliminar el usuario porque tiene pedidos asociados." });
        }

        var result = await _users.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }
        await _audit.LogAsync("admin.user_deleted", subjectType: "User", subjectId: id.ToString());
        return NoContent();
    }
}

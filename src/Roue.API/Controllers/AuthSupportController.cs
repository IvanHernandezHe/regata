using System.Text;
using System.Text.Encodings.Web;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Roue.Application.Interface;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthSupportController : ControllerBase
{
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IEmailSender _email;
    private readonly IAuditLogger _audit;
    private readonly IConfiguration _cfg;

    public AuthSupportController(UserManager<IdentityUser<Guid>> users, IEmailSender email, IAuditLogger audit, IConfiguration cfg)
    {
        _users = users;
        _email = email;
        _audit = audit;
        _cfg = cfg;
    }

    public sealed record ForgotPasswordRequest(string Email);

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email)) return BadRequest(new { error = "Correo requerido" });

        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null)
        {
            // Avoid revealing whether the email exists.
            return NoContent();
        }

        var token = await _users.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var callback = BuildCallbackUrl("Auth:ResetPasswordUrl", "http://localhost:4200/auth");
        callback = AppendQuery(callback, "mode", "reset");
        callback = AppendQuery(callback, "email", req.Email);
        callback = AppendQuery(callback, "token", encodedToken);

        var html = $"<p>Recibimos una solicitud para restablecer tu contraseña en Roue.</p>" +
                   $"<p><a href=\"{HtmlEncoder.Default.Encode(callback)}\">Haz clic aquí para definir una nueva contraseña</a>.</p>" +
                   "<p>Si no fuiste tú, puedes ignorar este correo.</p>";

        await _email.SendAsync(req.Email, "Restablecer contraseña", html);
        await _audit.LogAsync("auth.forgot_password", subjectType: "User", subjectId: user.Id.ToString(), description: "Password reset email sent");
        return NoContent();
    }

    public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.NewPassword))
        {
            return BadRequest(new { error = "Datos incompletos" });
        }

        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null)
        {
            return NoContent();
        }

        string decodedToken;
        try
        {
            decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(req.Token));
        }
        catch (FormatException)
        {
            return BadRequest(new { error = "Token inválido" });
        }

        var result = await _users.ResetPasswordAsync(user, decodedToken, req.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToArray();
            return BadRequest(new { errors });
        }

        await _audit.LogAsync("auth.password_reset", subjectType: "User", subjectId: user.Id.ToString());
        return NoContent();
    }

    public sealed record SendConfirmationRequest(string? Email);

    [HttpPost("send-confirmation")]
    [AllowAnonymous]
    public async Task<IActionResult> SendConfirmation([FromBody] SendConfirmationRequest req)
    {
        IdentityUser<Guid>? user = null;
        if (User?.Identity?.IsAuthenticated == true)
        {
            user = await _users.GetUserAsync(User);
        }

        if (user is null && !string.IsNullOrWhiteSpace(req.Email))
        {
            user = await _users.FindByEmailAsync(req.Email);
        }

        if (user is null)
        {
            return NoContent();
        }
        if (await _users.IsEmailConfirmedAsync(user)) return NoContent();

        var token = await _users.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var callback = BuildCallbackUrl("Auth:ConfirmEmailUrl", "http://localhost:4200/auth");
        callback = AppendQuery(callback, "mode", "confirm");
        callback = AppendQuery(callback, "userId", user.Id.ToString());
        callback = AppendQuery(callback, "token", encodedToken);

        var html = $"<p>Confirma tu correo para completar tu registro en Roue.</p>" +
                   $"<p><a href=\"{HtmlEncoder.Default.Encode(callback)}\">Confirmar correo electrónico</a></p>";

        await _email.SendAsync(user.Email!, "Confirma tu correo", html);
        await _audit.LogAsync("auth.confirmation_sent", subjectType: "User", subjectId: user.Id.ToString());
        return NoContent();
    }

    public sealed record ConfirmEmailRequest(string UserId, string Token);

    [HttpPost("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UserId) || string.IsNullOrWhiteSpace(req.Token))
        {
            return BadRequest(new { error = "Datos incompletos" });
        }

        if (!Guid.TryParse(req.UserId, out var parsedId))
        {
            return BadRequest(new { error = "Usuario inválido" });
        }

        var user = await _users.FindByIdAsync(parsedId.ToString());
        if (user is null)
        {
            return BadRequest(new { error = "Usuario no encontrado" });
        }

        string decodedToken;
        try
        {
            decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(req.Token));
        }
        catch (FormatException)
        {
            return BadRequest(new { error = "Token inválido" });
        }

        var result = await _users.ConfirmEmailAsync(user, decodedToken);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToArray();
            return BadRequest(new { errors });
        }

        await _audit.LogAsync("auth.email_confirmed", subjectType: "User", subjectId: user.Id.ToString());
        return Ok(new { confirmed = true });
    }

    private string BuildCallbackUrl(string configKey, string fallback)
    {
        var configured = _cfg[configKey];
        if (!string.IsNullOrWhiteSpace(configured)) return configured;

        var origins = _cfg.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
        if (origins.Length > 0) return AppendPath(origins[0], "auth");
        return fallback;
    }

    private static string AppendPath(string baseUrl, string path)
    {
        if (string.IsNullOrWhiteSpace(baseUrl)) return path;
        if (string.IsNullOrWhiteSpace(path)) return baseUrl;
        return baseUrl.TrimEnd('/') + "/" + path.TrimStart('/');
    }

    private static string AppendQuery(string url, string key, string value)
    {
        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(key) || value is null) return url;
        var separator = url.Contains('?') ? '&' : '?';
        return $"{url}{separator}{Uri.EscapeDataString(key)}={Uri.EscapeDataString(value)}";
    }
}

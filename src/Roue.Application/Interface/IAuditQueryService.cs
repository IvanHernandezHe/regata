using Roue.Application.DTOs;

namespace Roue.Application.Interface;

public interface IAuditQueryService
{
    Task<PagedResultDto<AuditLogItemDto>> SearchAsync(string? action, Guid? userId, string? email, string? path, DateTime? from, DateTime? to, int page, int pageSize, CancellationToken ct = default);
    Task<AuditLogItemDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
}


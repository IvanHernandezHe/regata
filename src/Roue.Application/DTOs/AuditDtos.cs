namespace Roue.Application.DTOs;

public sealed record AuditLogItemDto(
    Guid Id,
    DateTime CreatedAtUtc,
    string Action,
    Guid? UserId,
    string? UserEmail,
    string? Path,
    string? Method,
    string? IpAddress,
    string? CorrelationId,
    string? SubjectType,
    string? SubjectId,
    string? Description,
    string? MetadataJson
);

public sealed record PagedResultDto<T>(long Total, int Page, int PageSize, IReadOnlyList<T> Items);


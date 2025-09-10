using System.Security.Claims;

namespace Regata.Application.Interface;

public interface IAuditLogger
{
    Task LogAsync(string action,
                  string? subjectType = null,
                  string? subjectId = null,
                  string? description = null,
                  object? metadata = null,
                  CancellationToken ct = default);

    Task LogAsync(string action,
                  string? subjectType,
                  string? subjectId,
                  string? description,
                  object? metadata,
                  Regata.Domain.Auditing.AuditSeverity severity,
                  CancellationToken ct = default);
}

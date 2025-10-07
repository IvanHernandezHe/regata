namespace Roue.Domain.Auditing;

public enum AuditSeverity { Info=0, Warning=1, Error=2 }

public sealed class AuditLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    // Who
    public Guid? UserId { get; private set; }
    public string? UserEmail { get; private set; }

    // Where
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public string? Path { get; private set; }
    public string? Method { get; private set; }
    public string? CorrelationId { get; private set; }

    // What
    public string Action { get; private set; } = default!; // e.g., auth.login, order.checkout
    public AuditSeverity Severity { get; private set; } = AuditSeverity.Info;
    public string? SubjectType { get; private set; } // e.g., Order, User
    public string? SubjectId { get; private set; } // e.g., orderId
    public string? Description { get; private set; }
    public string? MetadataJson { get; private set; }

    public AuditLog() { }

    public AuditLog(string action, AuditSeverity severity = AuditSeverity.Info)
    {
        Action = action; Severity = severity;
    }

    public void WithUser(Guid? userId, string? email) { UserId = userId; UserEmail = email; }
    public void WithRequest(string? ip, string? ua, string? path, string? method, string? correlationId)
    { IpAddress = ip; UserAgent = ua; Path = path; Method = method; CorrelationId = correlationId; }
    public void WithSubject(string? type, string? id) { SubjectType = type; SubjectId = id; }
    public void WithDescription(string? desc) { Description = desc; }
    public void WithMetadata(string? json) { MetadataJson = json; }
}


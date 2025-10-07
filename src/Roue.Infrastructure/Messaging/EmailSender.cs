using System.Net;
using System.Net.Mail;
using Roue.Application.Interface;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Roue.Infrastructure.Messaging;

public sealed class EmailSender : IEmailSender
{
    private readonly IConfiguration _cfg;
    private readonly ILogger<EmailSender> _logger;
    public EmailSender(IConfiguration cfg, ILogger<EmailSender> logger) { _cfg = cfg; _logger = logger; }

    public async Task SendAsync(string to, string subject, string html)
    {
        var host = _cfg["Smtp:Host"]; var portStr = _cfg["Smtp:Port"]; var user = _cfg["Smtp:User"]; var pass = _cfg["Smtp:Pass"]; var from = _cfg["Email:From"] ?? user;
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            _logger.LogInformation("[EmailSender] SMTP not configured. To: {To} | Subject: {Subject}\n{Html}", to, subject, html);
            await Task.CompletedTask; return;
        }
        var port = int.TryParse(portStr, out var p) ? p : 587;
        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
            Credentials = (string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass)) ? CredentialCache.DefaultNetworkCredentials : new NetworkCredential(user, pass)
        };
        using var msg = new MailMessage(from!, to, subject, html) { IsBodyHtml = true };
        await client.SendMailAsync(msg);
    }
}

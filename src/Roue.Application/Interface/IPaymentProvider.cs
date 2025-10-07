using Roue.Domain.Orders;

namespace Roue.Application.Interface;

public interface IPaymentProvider
{
    Task<string> CreateCheckoutAsync(Order order, string successUrl, string cancelUrl);
    Task HandleWebhookAsync(HttpRequest request, CancellationToken ct);
}

public class HttpRequest
{
}

public interface IEmailSender { Task SendAsync(string to, string subject, string html); }
public interface IWhatsAppSender { Task SendAsync(string toNumberE164, string message); }
public interface IDiscountService { Task<(decimal discount, string? code)> ApplyAsync(string? code, decimal subtotal); }
public interface IPointsCalculator { int Earned(decimal amount); }
using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Domain.Accounts;
using Roue.Infrastructure.Persistence;
using FluentValidation;
using Roue.Application.Validation;

namespace Roue.Infrastructure.Services;

public sealed class AddressService : IAddressService
{
    private readonly AppDbContext _db;
    public AddressService(AppDbContext db) { _db = db; }

    public async Task<IReadOnlyList<AddressDto>> ListAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.Addresses.AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.UpdatedAtUtc)
            .Select(a => new AddressDto(a.Id, a.Line1, a.Line2, a.City, a.State, a.PostalCode, a.Country, a.IsDefault))
            .ToListAsync(ct);
        return list;
    }

    public async Task<Guid> CreateAsync(Guid userId, UpsertAddressDto input, CancellationToken ct = default)
    {
        new UpsertAddressValidator().ValidateAndThrow(input);
        var addr = new Address(userId, input.Line1, input.Line2, input.City, input.State, input.PostalCode, input.Country ?? "MX", input.IsDefault);
        _db.Addresses.Add(addr);
        if (input.IsDefault)
        {
            var others = await _db.Addresses.Where(a => a.UserId == userId && a.Id != addr.Id && a.IsDefault).ToListAsync(ct);
            foreach (var o in others) o.SetDefault(false);
        }
        await _db.SaveChangesAsync(ct);
        return addr.Id;
    }

    public async Task UpdateAsync(Guid userId, Guid id, UpsertAddressDto input, CancellationToken ct = default)
    {
        new UpsertAddressValidator().ValidateAndThrow(input);
        var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
        if (addr is null) throw new KeyNotFoundException();
        addr.Update(input.Line1, input.Line2, input.City, input.State, input.PostalCode, input.Country ?? "MX");
        if (input.IsDefault)
        {
            addr.SetDefault(true);
            var others = await _db.Addresses.Where(a => a.UserId == userId && a.Id != addr.Id && a.IsDefault).ToListAsync(ct);
            foreach (var o in others) o.SetDefault(false);
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetDefaultAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
        if (addr is null) throw new KeyNotFoundException();
        addr.SetDefault(true);
        var others = await _db.Addresses.Where(a => a.UserId == userId && a.Id != addr.Id && a.IsDefault).ToListAsync(ct);
        foreach (var o in others) o.SetDefault(false);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
        if (addr is null) throw new KeyNotFoundException();
        _db.Addresses.Remove(addr);
        await _db.SaveChangesAsync(ct);
    }
}

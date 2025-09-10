import { Component, inject } from '@angular/core';
import { CartStore } from '../../state/cart.store';
import { CurrencyPipe, NgIf, NgFor, DatePipe } from '@angular/common';
import { OrdersService } from '../../core/orders.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, NgIf, NgFor, DatePipe],
  template: `
  <section class="container my-4">
    <h2>Checkout</h2>
    <div class="mb-3 d-flex gap-2">
      <button class="btn btn-outline-dark" (click)="quote()" [disabled]="quoting || cart.items().length===0">Calcular total</button>
      <button class="btn btn-outline-secondary" (click)="reserve()" [disabled]="cart.items().length===0">Reservar 10 min</button>
    </div>
    <div *ngIf="summary">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of summary.items">
              <td>{{ l.brand }} {{ l.modelName }} {{ l.size }}</td>
              <td>{{ l.quantity }}</td>
              <td>{{ l.unitPrice | currency:'MXN' }}</td>
              <td>{{ l.lineTotal | currency:'MXN' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="d-flex justify-content-end flex-column align-items-end gap-1">
        <div>Subtotal: {{ summary.subtotal | currency:'MXN' }}</div>
        <div *ngIf="summary.discount>0" class="text-success">Descuento: −{{ summary.discount | currency:'MXN' }}</div>
        <div class="h5">Total: {{ summary.total | currency:'MXN' }}</div>
      </div>
    </div>
    <div class="mt-3">
      <div *ngIf="reservationToken as t" class="alert alert-secondary py-2">
        Reserva activa: <code>{{ t }}</code>
        <span *ngIf="reservationExpires"> · expira: {{ reservationExpires | date:'short' }}</span>
      </div>
      <button class="btn btn-success" (click)="pay()" [disabled]="cart.items().length===0 || paying">Pagar (sandbox)</button>
    </div>
  </section>
  `
})
export class CheckoutPage {
  cart = inject(CartStore);
  #orders = inject(OrdersService);
  paying = false;
  quoting = false;
  summary: { subtotal: number; discount: number; total: number; items: any[] } | null = null;
  reservationToken: string | null = null;
  reservationExpires: string | null = null;

  pay() {
    const items = this.cart.items().map(i => ({ productId: i.productId, quantity: i.qty }));
    if (!items.length) return;
    this.paying = true;
    const discountCode = this.cart.couponCode();
    this.#orders.checkout({ items, discountCode: discountCode || undefined, reservationToken: this.reservationToken || undefined }).subscribe({
      next: (res) => {
        // Redirect to sandbox or provider checkout
        window.location.href = res.checkoutUrl;
      },
      error: () => {
        this.paying = false;
        alert('No se pudo iniciar el pago. Intenta de nuevo.');
      }
    });
  }

  quote() {
    const items = this.cart.items().map(i => ({ productId: i.productId, quantity: i.qty }));
    if (!items.length) return;
    this.quoting = true;
    const discountCode = this.cart.couponCode();
    this.#orders.quote({ items, discountCode: discountCode || undefined }).subscribe({
      next: (res) => { this.summary = { subtotal: res.subtotal, discount: res.discount, total: res.total, items: res.items as any[] }; this.quoting = false; },
      error: () => { this.quoting = false; alert('No se pudo calcular el total'); }
    });
  }

  reserve() {
    const items = this.cart.items().map(i => ({ productId: i.productId, quantity: i.qty }));
    if (!items.length) return;
    this.#orders.reserve({ items, ttlSeconds: 600 }).subscribe({
      next: (res) => { this.reservationToken = res.token; this.reservationExpires = res.expiresAtUtc; alert('Stock reservado por 10 minutos.'); },
      error: (err) => { alert(err?.error?.error || 'No se pudo reservar'); }
    });
  }

  ngOnDestroy() {
    if (this.reservationToken && !this.paying) {
      this.#orders.releaseReservation(this.reservationToken).subscribe({ next: () => {}, error: () => {} });
    }
  }
}

import { Component, inject } from '@angular/core';
import { CartStore } from '../../state/cart.store';
import { CurrencyPipe, NgIf, NgFor, DatePipe } from '@angular/common';
import { OrdersService, QuoteResponse } from '../../core/orders.service';
import { AddressesService, AddressDto } from '../../core/addresses.service';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../core/config.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, NgIf, NgFor, DatePipe, FormsModule],
  template: `
  <section class="container my-4">
    <h2>Checkout</h2>
    <!-- Address selection -->
    <div class="card p-3 mb-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="fw-semibold">Dirección de envío</div>
        <button class="btn btn-sm btn-outline-secondary" (click)="toggleAdd()">{{ showAdd ? 'Cancelar' : 'Agregar' }}</button>
      </div>
      <div *ngIf="addresses.length && !showAdd; else addForm">
        <div class="row g-2">
          <div class="col-12 col-md-6" *ngFor="let a of addresses">
            <label class="d-flex align-items-start gap-2 border rounded p-2">
              <input type="radio" name="addr" [value]="a.id" [(ngModel)]="selectedAddressId"/>
              <div class="flex-fill">
                <div>{{ a.line1 }}<span *ngIf="a.line2">, {{a.line2}}</span></div>
                <small class="text-muted">{{ a.city }}, {{ a.state }} {{ a.postalCode }} · {{ a.country }}</small>
                <div><span class="badge text-bg-secondary" *ngIf="a.isDefault">Predeterminada</span></div>
              </div>
            </label>
          </div>
        </div>
      </div>
      <ng-template #addForm>
        <form class="row g-2" (submit)="addAddress($event)">
          <div class="col-12 col-md-6"><input class="form-control" placeholder="Calle y número" [(ngModel)]="newAddr.line1" name="line1" required/></div>
          <div class="col-12 col-md-6"><input class="form-control" placeholder="Interior, referencias (opcional)" [(ngModel)]="newAddr.line2" name="line2"/></div>
          <div class="col-12 col-md-4"><input class="form-control" placeholder="Ciudad" [(ngModel)]="newAddr.city" name="city" required/></div>
          <div class="col-12 col-md-4"><input class="form-control" placeholder="Estado" [(ngModel)]="newAddr.state" name="state" required/></div>
          <div class="col-12 col-md-4"><input class="form-control" placeholder="C.P." [(ngModel)]="newAddr.postalCode" name="postal" required/></div>
          <div class="col-12"><label class="form-check"><input class="form-check-input" type="checkbox" [(ngModel)]="newAddr.isDefault" name="isDefault"/> Predeterminada</label></div>
          <div class="col-12"><button class="btn btn-dark" type="submit">Guardar dirección</button></div>
        </form>
      </ng-template>
    </div>
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
              <td>
                <div class="fw-semibold">{{ l.productName }}</div>
                <div class="text-muted small">SKU {{ l.productSku }}</div>
              </td>
              <td>{{ l.quantity }}</td>
              <td>{{ l.unitPrice | currency:summary.currency }}</td>
              <td>{{ l.lineTotal | currency:summary.currency }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="d-flex justify-content-end flex-column align-items-end gap-1">
        <div>Subtotal: {{ summary.subtotal | currency:summary.currency }}</div>
        <div *ngIf="summary.discount>0" class="text-success">Descuento: −{{ summary.discount | currency:summary.currency }}</div>
        <div>Envío: {{ summary.shipping | currency:summary.currency }}</div>
        <div class="h5">Total: {{ summary.total | currency:summary.currency }}</div>
      </div>
    </div>
    <div class="mt-3">
      <div *ngIf="reservationToken as t" class="alert alert-secondary py-2">
        Reserva activa: <code>{{ t }}</code>
        <span *ngIf="reservationExpires"> · expira: {{ reservationExpires | date:'short' }}</span>
      </div>
      <button class="btn btn-success" (click)="pay()" [disabled]="cart.items().length===0 || paying">{{ payLabel }}</button>
    </div>
  </section>
  `
})
export class CheckoutPage {
  cart = inject(CartStore);
  #orders = inject(OrdersService);
  #addresses = inject(AddressesService);
  #cfg = inject(ConfigService);
  paying = false;
  quoting = false;
  payLabel = 'Pagar (sandbox)';
  summary: QuoteResponse | null = null;
  reservationToken: string | null = null;
  reservationExpires: string | null = null;
  addresses: AddressDto[] = [];
  selectedAddressId: string | null = null;
  showAdd = false;
  newAddr: { line1: string; line2?: string | null; city: string; state: string; postalCode: string; isDefault: boolean } = { line1: '', line2: '', city: '', state: '', postalCode: '', isDefault: true };

  pay() {
    const items = this.cart.items().map(i => ({ productId: i.productId, quantity: i.qty }));
    if (!items.length) return;
    this.paying = true;
    const discountCode = this.cart.couponCode();
    this.#orders.checkout({ items, discountCode: discountCode || undefined, reservationToken: this.reservationToken || undefined, addressId: this.selectedAddressId || undefined }).subscribe({
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
      next: (res) => { this.summary = res; this.quoting = false; },
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

  ngOnInit() {
    this.#addresses.list().subscribe({ next: (l) => { this.addresses = l; this.selectedAddressId = (l.find(x => x.isDefault)?.id) || (l[0]?.id || null); }, error: () => {} });
    this.#cfg.get().subscribe({ next: (c) => { this.payLabel = (c.payments?.provider === 'Stripe') ? 'Pagar' : 'Pagar (sandbox)'; }, error: () => {} });
  }

  toggleAdd() { this.showAdd = !this.showAdd; }
  addAddress(e: Event) {
    e.preventDefault();
    if (!this.newAddr.line1 || !this.newAddr.city || !this.newAddr.state || !this.newAddr.postalCode) return;
    this.#addresses.create({ line1: this.newAddr.line1, line2: this.newAddr.line2, city: this.newAddr.city, state: this.newAddr.state, postalCode: this.newAddr.postalCode, isDefault: this.newAddr.isDefault }).subscribe({
      next: () => { this.showAdd = false; this.#addresses.list().subscribe({ next: (l) => { this.addresses = l; this.selectedAddressId = (l.find(x => x.isDefault)?.id) || (l[0]?.id || null); } }); },
      error: () => { alert('No se pudo guardar'); }
    });
  }
}

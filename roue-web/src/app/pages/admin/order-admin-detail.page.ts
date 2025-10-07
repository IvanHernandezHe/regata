import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminOrdersService, AdminOrderDetail } from '../../core/admin-orders.service';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, FormsModule],
  template: `
  <section class="container my-4" *ngIf="o as order; else loading">
    <h2>Pedido {{ order.id }}</h2>
    <div class="row g-3">
      <div class="col-12 col-lg-8">
        <div class="card p-3">
          <h5 class="card-title">Artículos</h5>
          <div class="table-responsive">
            <table class="table align-middle">
              <thead><tr><th>Producto</th><th>SKU</th><th style="width:180px">Cant</th><th>Precio</th><th>Importe</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let i of order.items">
                  <td>{{ i.productName }} · {{ i.size }}</td>
                  <td>{{ i.productSku }}</td>
                  <td>
                    <div class="input-group input-group-sm" style="max-width: 160px;">
                      <button class="btn btn-outline-secondary" (click)="dec(i.productId, i.quantity)">−</button>
                      <input class="form-control" type="number" [value]="i.quantity" (change)="setQty(i.productId, $any($event.target).value)"/>
                      <button class="btn btn-outline-secondary" (click)="inc(i.productId, i.quantity)">+</button>
                    </div>
                  </td>
                  <td>{{ i.unitPrice | currency:'MXN' }}</td>
                  <td>{{ (i.unitPrice * i.quantity) | currency:'MXN' }}</td>
                  <td class="text-end"><button class="btn btn-sm btn-outline-danger" (click)="remove(i.productId)">Quitar</button></td>
                </tr>
              </tbody>
            </table>
            <form class="row g-2" (submit)="addItem($event)">
              <div class="col-12 col-md-7"><input class="form-control" placeholder="ProductId (GUID)" [(ngModel)]="addProductId" name="productId" required/></div>
              <div class="col-6 col-md-3"><input class="form-control" type="number" [(ngModel)]="addQty" name="qty" min="1" required/></div>
              <div class="col-6 col-md-2 d-grid"><button class="btn btn-outline-dark" type="submit">Agregar</button></div>
            </form>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card p-3 mb-3">
          <div class="fw-semibold">Cliente</div>
          <div class="text-muted small">{{ order.userEmail }}</div>
          <div class="mt-2"><strong>Total:</strong> {{ order.total | currency:'MXN' }}</div>
          <div>Subtotal: {{ order.subtotal | currency:'MXN' }}</div>
          <div *ngIf="order.discountAmount>0" class="text-success">Descuento: −{{ order.discountAmount | currency:'MXN' }}</div>
          <div>Envío: {{ order.shippingCost | currency:'MXN' }}</div>
        </div>
        <div class="card p-3 mb-3">
          <div class="fw-semibold">Pago</div>
          <div class="mb-1">Proveedor: <span class="badge text-bg-info text-dark">{{ order.paymentProvider }}</span></div>
          <div class="mb-1">Estado: <span class="badge text-bg-secondary">{{ order.paymentStatus }}</span></div>
          <div class="mb-1" *ngIf="order.paymentReference">Referencia: <code>{{ order.paymentReference }}</code></div>
        </div>
        <div class="card p-3 mb-3" *ngIf="order.ship">
          <div class="fw-semibold">Envío</div>
          <div>{{ order.ship.shipLine1 }}</div>
          <div *ngIf="order.ship.shipLine2">{{ order.ship.shipLine2 }}</div>
          <div class="text-muted small">{{ order.ship.shipCity }}, {{ order.ship.shipState }} {{ order.ship.shipPostalCode }} · {{ order.ship.shipCountry }}</div>
        </div>
        <div class="card p-3">
          <div class="mb-2">
            <label class="form-label">Estado</label>
            <select class="form-select" [(ngModel)]="status">
              <option>Created</option>
              <option>Paid</option>
              <option>Preparing</option>
              <option>Shipped</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div class="mb-2">
            <label class="form-label">Pago</label>
            <select class="form-select" [(ngModel)]="paymentStatus">
              <option>Pending</option>
              <option>Succeeded</option>
              <option>Failed</option>
              <option>Refunded</option>
            </select>
          </div>
          <div class="d-grid gap-2">
            <button class="btn btn-dark" (click)="save()">Guardar</button>
            <button class="btn btn-outline-danger" (click)="deleteOrder()">Eliminar pedido</button>
          </div>
        </div>

        <div class="card p-3 mt-3">
          <h6 class="card-title">Envío</h6>
          <div class="mb-2">
            <label class="form-label">Paquetería</label>
            <input class="form-control" [(ngModel)]="carrier" placeholder="DHL, FedEx, Estafeta" />
          </div>
          <div class="mb-2">
            <label class="form-label">Guía</label>
            <input class="form-control" [(ngModel)]="trackingCode" placeholder="Código de rastreo" />
          </div>
          <div class="mb-2">
            <label class="form-label">Fecha de envío</label>
            <input class="form-control" type="datetime-local" [(ngModel)]="shippedAtLocal" />
          </div>
          <button class="btn btn-outline-dark" (click)="saveShipment()">Guardar envío</button>
        </div>
      </div>
    </div>
  </section>
  <ng-template #loading>
    <div class="container my-4">Cargando…</div>
  </ng-template>
  `
})
export class OrderAdminDetailPage implements OnInit {
  #route = inject(ActivatedRoute);
  #api = inject(AdminOrdersService);
  o: AdminOrderDetail | null = null;
  status = 'Created';
  paymentStatus = 'Pending';
  carrier = '';
  trackingCode = '';
  shippedAtLocal = '';
  addProductId = '';
  addQty = 1;
  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id')!;
    this.#api.get(id).subscribe({ next: (x) => { this.o = x; this.status = String(x.status); this.paymentStatus = String(x.paymentStatus); this.carrier = x.ship?.trackingCarrier || ''; this.trackingCode = x.ship?.trackingCode || ''; this.shippedAtLocal = x.ship?.shippedAtUtc ? x.ship.shippedAtUtc.substring(0,16) : ''; }, error: () => this.o = null });
  }
  save() {
    if (!this.o) return;
    this.#api.setStatus(this.o.id, this.status).subscribe({ next: () => {}, error: () => {} });
    this.#api.setPaymentStatus(this.o.id, this.paymentStatus).subscribe({ next: () => {}, error: () => {} });
  }
  saveShipment() {
    if (!this.o) return;
    const shippedAtUtc = this.shippedAtLocal ? new Date(this.shippedAtLocal).toISOString() : null;
    this.#api.setShipment(this.o.id, { carrier: this.carrier || undefined, trackingCode: this.trackingCode || undefined, shippedAtUtc: shippedAtUtc || undefined }).subscribe({ next: () => {}, error: () => {} });
  }
  addItem(e: Event) {
    e.preventDefault();
    if (!this.o) return;
    const id = this.o.id; const pid = (this.addProductId || '').trim(); const qty = Math.max(1, Number(this.addQty || 1));
    if (!pid) return;
    this.#api.addOrUpdateItem(id, pid, qty).subscribe({ next: (x) => { this.o = x; this.addProductId=''; this.addQty=1; }, error: (err) => alert(err?.error?.error || 'No se pudo agregar') });
  }
  setQty(pid: string, value: any) {
    if (!this.o) return; const q = Math.max(0, Number(value || 0));
    this.#api.setItemQty(this.o.id, pid, q).subscribe({ next: (x) => this.o = x, error: (err) => alert(err?.error?.error || 'No se pudo actualizar') });
  }
  inc(pid: string, curr: number) { this.setQty(pid, Number(curr||0) + 1); }
  dec(pid: string, curr: number) { this.setQty(pid, Math.max(0, Number(curr||0) - 1)); }
  remove(pid: string) { this.setQty(pid, 0); }
  deleteOrder() {
    if (!this.o) return; if (!confirm('¿Eliminar este pedido?')) return;
    this.#api.delete(this.o.id).subscribe({ next: () => history.back(), error: (err) => alert(err?.error?.error || 'No se pudo eliminar') });
  }
}

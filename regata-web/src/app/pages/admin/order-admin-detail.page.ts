import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminOrdersService, AdminOrderDetail } from '../../core/admin-orders.service';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, FormsModule],
  template: `
  <section class="container my-4" *ngIf="o as order; else loading">
    <h2>Pedido {{ order.id }}</h2>
    <div class="row g-3">
      <div class="col-12 col-lg-8">
        <div class="card p-3">
          <h5 class="card-title">Artículos</h5>
          <div class="table-responsive">
            <table class="table align-middle">
              <thead><tr><th>Producto</th><th>SKU</th><th>Cant</th><th>Precio</th><th>Importe</th></tr></thead>
              <tbody>
                <tr *ngFor="let i of order.items">
                  <td>{{ i.productName }} · {{ i.size }}</td>
                  <td>{{ i.productSku }}</td>
                  <td>{{ i.quantity }}</td>
                  <td>{{ i.unitPrice | currency:'MXN' }}</td>
                  <td>{{ (i.unitPrice * i.quantity) | currency:'MXN' }}</td>
                </tr>
              </tbody>
            </table>
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
          <button class="btn btn-dark" (click)="save()">Guardar</button>
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
  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id')!;
    this.#api.get(id).subscribe({ next: (x) => { this.o = x; this.status = String(x.status); this.paymentStatus = String(x.paymentStatus); }, error: () => this.o = null });
  }
  save() {
    if (!this.o) return;
    this.#api.setStatus(this.o.id, this.status).subscribe({ next: () => {}, error: () => {} });
    this.#api.setPaymentStatus(this.o.id, this.paymentStatus).subscribe({ next: () => {}, error: () => {} });
  }
}


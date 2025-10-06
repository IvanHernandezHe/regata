import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdersService, OrderDetail } from '../../core/orders.service';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe],
  template: `
  <section class="container my-4" *ngIf="order as detail; else loading">
    <h2>Pedido {{ detail.id }}</h2>
    <div class="mb-2 text-muted">Fecha: {{ detail.createdAtUtc | date:'medium' }}</div>
    <div class="row g-3">
      <div class="col-12 col-lg-8">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Producto</th><th>SKU</th><th>Cant</th><th>Precio</th><th>Importe</th></tr></thead>
            <tbody>
              <tr *ngFor="let i of detail.items">
                <td>{{ i.productName }} · {{ i.size }}</td>
                <td>{{ i.productSku }}</td>
                <td>{{ i.quantity }}</td>
                <td>{{ i.unitPrice | currency:detail.currency }}</td>
                <td>{{ (i.unitPrice * i.quantity) | currency:detail.currency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card p-3">
          <div class="mb-1">Estado: <span class="badge text-bg-light">{{ detail.status }}</span></div>
          <div class="mb-1">Pago: <span class="badge text-bg-secondary">{{ detail.paymentStatus }}</span></div>
          <div class="mb-1">Método: <span class="badge text-bg-info text-dark">{{ detail.paymentProvider }}</span></div>
          <div class="mb-1" *ngIf="detail.paymentReference">Referencia: <code>{{ detail.paymentReference }}</code></div>
          <div class="mb-1">Subtotal: {{ detail.subtotal | currency:detail.currency }}</div>
          <div class="mb-1" *ngIf="detail.discountAmount>0">Descuento: −{{ detail.discountAmount | currency:detail.currency }}</div>
          <div class="mb-1">Envío: {{ detail.shippingCost | currency:detail.currency }}</div>
          <div class="h5">Total: {{ detail.total | currency:detail.currency }}</div>
        </div>
        <div class="card p-3 mt-3">
          <div class="fw-semibold mb-1">Dirección de envío</div>
          <ng-container *ngIf="detail.shipping.line1; else noShipping">
            <div>{{ detail.shipping.line1 }}</div>
            <div *ngIf="detail.shipping.line2">{{ detail.shipping.line2 }}</div>
            <div class="text-muted small">{{ detail.shipping.city }}, {{ detail.shipping.state }} {{ detail.shipping.postalCode }}</div>
            <div class="text-muted small">{{ detail.shipping.country }}</div>
          </ng-container>
          <ng-template #noShipping>
            <div class="text-muted small">Sin dirección registrada.</div>
          </ng-template>
        </div>
        <div class="card p-3 mt-3">
          <div class="fw-semibold mb-1">Seguimiento</div>
          <ng-container *ngIf="detail.shipping.trackingCode; else noTracking">
            <div class="mb-1">Paquetería: <strong>{{ detail.shipping.trackingCarrier || '—' }}</strong></div>
            <div class="mb-1">Guía: <code>{{ detail.shipping.trackingCode }}</code></div>
            <div class="text-muted small" *ngIf="detail.shipping.shippedAtUtc">Enviado el {{ detail.shipping.shippedAtUtc | date:'medium' }}</div>
          </ng-container>
          <ng-template #noTracking>
            <div class="text-muted small">Aún no hay datos de envío disponibles.</div>
          </ng-template>
        </div>
      </div>
    </div>
  </section>
  <ng-template #loading>
    <div class="container my-4">Cargando…</div>
  </ng-template>
  `
})
export class OrderDetailPage implements OnInit {
  #route = inject(ActivatedRoute);
  #orders = inject(OrdersService);
  order: OrderDetail | null = null;
  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id')!;
    this.#orders.getById(id).subscribe({ next: (x) => this.order = x, error: () => this.order = null });
  }
}

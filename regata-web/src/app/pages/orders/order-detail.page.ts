import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../core/orders.service';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe],
  template: `
  <section class="container my-4" *ngIf="o as order; else loading">
    <h2>Pedido {{ order.id }}</h2>
    <div class="mb-2 text-muted">Fecha: {{ order.createdAtUtc | date:'medium' }}</div>
    <div class="row g-3">
      <div class="col-12 col-lg-8">
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
      <div class="col-12 col-lg-4">
        <div class="card p-3">
          <div class="mb-1">Estado: <span class="badge text-bg-light">{{ order.status }}</span></div>
          <div class="mb-1">Pago: <span class="badge text-bg-secondary">{{ order.paymentStatus }}</span></div>
          <div class="mb-1">Subtotal: {{ order.subtotal | currency:'MXN' }}</div>
          <div class="mb-1" *ngIf="order.discountAmount>0">Descuento: −{{ order.discountAmount | currency:'MXN' }}</div>
          <div class="mb-1">Envío: {{ order.shippingCost | currency:'MXN' }}</div>
          <div class="h5">Total: {{ order.total | currency:'MXN' }}</div>
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
  o: any = null;
  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id')!;
    this.#orders.getById(id).subscribe({ next: (x) => this.o = x, error: () => this.o = null });
  }
}


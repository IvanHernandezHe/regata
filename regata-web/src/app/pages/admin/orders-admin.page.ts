import { Component, OnInit, inject } from '@angular/core';
import { AdminOrdersService, AdminOrderSummary } from '../../core/admin-orders.service';
import { NgFor, NgIf, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, CurrencyPipe, RouterLink],
  template: `
  <section class="container my-4">
    <h2>Pedidos (Admin)</h2>
    <div class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Folio</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Pago</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let o of items">
            <td class="small">{{ o.id }}</td>
            <td>{{ o.userEmail || 'N/A' }}</td>
            <td>{{ o.createdAtUtc | date:'short' }}</td>
            <td>{{ o.total | currency:'MXN' }}</td>
            <td><span class="badge text-bg-secondary">{{ o.paymentStatus }}</span></td>
            <td><span class="badge text-bg-light">{{ o.status }}</span></td>
            <td class="text-end"><a class="btn btn-sm btn-outline-dark" [routerLink]="['/admin/pedidos', o.id]">Ver</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  `
})
export class OrdersAdminPage implements OnInit {
  #api = inject(AdminOrdersService);
  items: AdminOrderSummary[] = [];
  ngOnInit(): void { this.#api.list().subscribe({ next: (r) => this.items = r.items, error: () => this.items = [] }); }
}


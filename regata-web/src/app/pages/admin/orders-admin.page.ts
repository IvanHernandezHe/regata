import { Component, OnInit, inject } from '@angular/core';
import { AdminOrdersService, AdminOrderSummary } from '../../core/admin-orders.service';
import { NgFor, DatePipe, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgFor, DatePipe, CurrencyPipe, RouterLink, FormsModule],
  template: `
  <section class="container my-4">
    <h2>Pedidos (Admin)</h2>
    <div class="d-flex align-items-center gap-2 mb-3">
      <input class="form-control" style="max-width: 320px;" placeholder="Email del cliente" [(ngModel)]="newEmail"/>
      <button class="btn btn-dark" (click)="create()" [disabled]="creating || !newEmail">Nuevo</button>
    </div>
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
  #router = inject(Router);
  items: AdminOrderSummary[] = [];
  newEmail = '';
  creating = false;
  ngOnInit(): void { this.#api.list().subscribe({ next: (r) => this.items = r.items, error: () => this.items = [] }); }
  create() {
    const email = (this.newEmail || '').trim(); if (!email) return;
    this.creating = true;
    this.#api.create({ userEmail: email }).subscribe({
      next: (o) => { this.creating = false; this.newEmail=''; this.#router.navigate(['/admin/pedidos', (o as any).id]); },
      error: (err) => { this.creating = false; alert(err?.error?.error || 'No se pudo crear el pedido'); }
    });
  }
}

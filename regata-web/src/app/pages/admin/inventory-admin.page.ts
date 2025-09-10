import { Component, OnInit, inject } from '@angular/core';
import { AdminInventoryService, InventoryRow, TxnRow } from '../../core/admin-inventory.service';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe, DatePipe, FormsModule],
  template: `
  <section class="container my-4">
    <h2>Inventario (Admin)</h2>
    <div class="row g-2 mb-3">
      <div class="col-12 col-md-8">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>SKU</th><th>Producto</th><th>OnHand</th><th>Reservado</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of rows">
                <td>{{ r.sku }}</td>
                <td>{{ r.brand }} {{ r.modelName }} {{ r.size }}</td>
                <td>{{ r.onHand }}</td>
                <td>{{ r.reserved }}</td>
                <td><button class="btn btn-sm btn-outline-secondary" (click)="select(r)">Ver movimientos</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card p-3">
          <h5 class="card-title">Ajustar inventario</h5>
          <div class="mb-2 small text-muted">Producto: <span *ngIf="selected">{{ selected?.sku }}</span><span *ngIf="!selected">(selecciona de la lista)</span></div>
          <input class="form-control mb-2" type="number" placeholder="Delta (ej. 5 o -3)" [(ngModel)]="delta" [disabled]="!selected"/>
          <input class="form-control mb-2" placeholder="Motivo" [(ngModel)]="reason" [disabled]="!selected"/>
          <button class="btn btn-dark" (click)="adjust()" [disabled]="!selected || !delta">Aplicar</button>
        </div>
        <div class="mt-3" *ngIf="txns.length">
          <h6>Movimientos</h6>
          <div class="table-responsive" style="max-height: 260px;">
            <table class="table table-sm">
              <thead><tr><th>Fecha</th><th>Cant</th><th>Tipo</th><th>Ref</th></tr></thead>
              <tbody>
                <tr *ngFor="let t of txns">
                  <td>{{ t.createdAtUtc | date:'short' }}</td>
                  <td>{{ t.quantity }}</td>
                  <td>{{ t.type }}</td>
                  <td>{{ t.reference }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
  `
})
export class InventoryAdminPage implements OnInit {
  #api = inject(AdminInventoryService);
  rows: InventoryRow[] = [];
  txns: TxnRow[] = [];
  selected: InventoryRow | null = null;
  delta: number | null = null;
  reason = '';
  ngOnInit(): void { this.reload(); }
  reload() { this.#api.list().subscribe({ next: (r) => this.rows = r, error: () => this.rows = [] }); }
  select(r: InventoryRow) { this.selected = r; this.#api.transactions(r.id, 1, 50).subscribe({ next: (t) => this.txns = t.items, error: () => this.txns = [] }); }
  adjust() { if (!this.selected || this.delta === null) return; this.#api.adjust(this.selected.id, this.delta, this.reason).subscribe({ next: () => { this.delta = null; this.reason = ''; this.reload(); if (this.selected) this.select(this.selected); }, error: () => {} }); }
}

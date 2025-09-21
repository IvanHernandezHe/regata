import { Component, OnInit, inject } from '@angular/core';
import { AdminInventoryService, InventoryRow, TxnRow } from '../../core/admin-inventory.service';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Product } from '../../core/models/product.model';
import { AdminProductsService } from '../../core/admin-products.service';

@Component({
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
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
          <div class="mb-2 small text-muted">Producto: <span *ngIf="selected">{{ selected.sku }}</span><span *ngIf="!selected">(selecciona de la lista)</span></div>
          <input class="form-control mb-2" type="number" placeholder="Delta (ej. 5 o -3)" [(ngModel)]="delta" [disabled]="!selected"/>
          <input class="form-control mb-2" placeholder="Motivo" [(ngModel)]="reason" [disabled]="!selected"/>
          <button class="btn btn-dark" (click)="adjust()" [disabled]="!selected || !delta">Aplicar</button>
        </div>
        <div class="card p-3 mt-3" *ngIf="product">
          <h5 class="card-title">Especificaciones</h5>
          <div class="small text-muted mb-2">{{ product!.brand }} {{ product!.modelName }} · {{ product!.category || '—' }}</div>
          <ng-container *ngIf="product!.tire; else rimFormTpl">
            <div class="row g-2">
              <div class="col-12 col-sm-6"><input class="form-control" placeholder="Tipo" [(ngModel)]="tireForm.type" name="tType"></div>
              <div class="col-12 col-sm-6"><input class="form-control" placeholder="Rango carga" [(ngModel)]="tireForm.loadIndex" name="tLoad"></div>
              <div class="col-12 col-sm-6"><input class="form-control" placeholder="Rango velocidad" [(ngModel)]="tireForm.speedRating" name="tSpeed"></div>
              <div class="col-12"><button class="btn btn-outline-dark" (click)="saveTire()">Guardar llanta</button></div>
            </div>
          </ng-container>
          <ng-template #rimFormTpl>
            <div class="row g-2">
              <div class="col-6"><input class="form-control" type="number" step="0.1" placeholder="Diámetro (in)" [(ngModel)]="rimForm.diameterIn" name="rDia"></div>
              <div class="col-6"><input class="form-control" type="number" step="0.1" placeholder="Ancho (in)" [(ngModel)]="rimForm.widthIn" name="rWidth"></div>
              <div class="col-6"><input class="form-control" placeholder="Patrón (5x114.3)" [(ngModel)]="rimForm.boltPattern" name="rPattern"></div>
              <div class="col-6"><input class="form-control" type="number" placeholder="Offset (mm)" [(ngModel)]="rimForm.offsetMm" name="rOffset"></div>
              <div class="col-6"><input class="form-control" type="number" step="0.1" placeholder="Centro (mm)" [(ngModel)]="rimForm.centerBoreMm" name="rCb"></div>
              <div class="col-6"><input class="form-control" placeholder="Material" [(ngModel)]="rimForm.material" name="rMat"></div>
              <div class="col-12"><input class="form-control" placeholder="Acabado" [(ngModel)]="rimForm.finish" name="rFin"></div>
              <div class="col-12"><button class="btn btn-outline-dark" (click)="saveRim()">Guardar rines</button></div>
            </div>
          </ng-template>
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
  #prodApi = inject(ApiService);
  #admProd = inject(AdminProductsService);
  rows: InventoryRow[] = [];
  txns: TxnRow[] = [];
  selected: InventoryRow | null = null;
  delta: number | null = null;
  reason = '';
  product: Product | null = null;
  tireForm: any = { type: '', loadIndex: '', speedRating: '' };
  rimForm: any = { diameterIn: null, widthIn: null, boltPattern: '', offsetMm: null, centerBoreMm: null, material: '', finish: '' };
  ngOnInit(): void { this.reload(); }
  reload() { this.#api.list().subscribe({ next: (r) => this.rows = r, error: () => this.rows = [] }); }
  select(r: InventoryRow) {
    this.selected = r;
    this.#api.transactions(r.id, 1, 50).subscribe({ next: (t) => this.txns = t.items, error: () => this.txns = [] });
    this.#prodApi.getProduct(r.id).subscribe({ next: (p) => { this.product = p; this.tireForm = { ...(p.tire || { type: '', loadIndex: '', speedRating: '' }) }; this.rimForm = { ...(p.rim || { diameterIn: null, widthIn: null, boltPattern: '', offsetMm: null, centerBoreMm: null, material: '', finish: '' }) }; }, error: () => this.product = null });
  }
  adjust() { if (!this.selected || this.delta === null) return; this.#api.adjust(this.selected.id, this.delta, this.reason).subscribe({ next: () => { this.delta = null; this.reason = ''; this.reload(); if (this.selected) this.select(this.selected); }, error: () => {} }); }
  saveTire() { if (!this.selected) return; this.#admProd.upsertTire(this.selected.id, this.tireForm).subscribe({ next: () => this.select(this.selected!), error: () => {} }); }
  saveRim() { if (!this.selected) return; this.#admProd.upsertRim(this.selected.id, this.rimForm).subscribe({ next: () => this.select(this.selected!), error: () => {} }); }
}

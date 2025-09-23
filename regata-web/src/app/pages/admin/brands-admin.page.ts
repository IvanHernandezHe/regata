import { Component, OnInit, inject } from '@angular/core';
import { AdminBrandsService, AdminBrand } from '../../core/admin-brands.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
  <section class="container my-4">
    <h2>Marcas</h2>
    <div class="row g-3">
      <div class="col-12 col-md-6">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Nombre</th><th>Logo</th><th>Activa</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let b of list">
                <td>{{b.name}}</td>
                <td><img *ngIf="b.logoUrl" [src]="b.logoUrl!" alt="logo" width="48" height="24"></td>
                <td><span class="badge" [class.text-bg-success]="b.active" [class.text-bg-secondary]="!b.active">{{ b.active ? 'Sí' : 'No' }}</span></td>
                <td><button class="btn btn-sm btn-outline-secondary" (click)="edit(b)">Editar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card p-3">
          <h5>{{ form.id ? 'Editar marca' : 'Nueva marca' }}</h5>
          <input class="form-control mb-2" placeholder="Nombre" [(ngModel)]="form.name" name="name"/>
          <input class="form-control mb-2" placeholder="Logo URL" [(ngModel)]="form.logoUrl" name="logoUrl"/>
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="bActive" [(ngModel)]="form.active" name="active">
            <label class="form-check-label" for="bActive">Activa</label>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-dark" (click)="save()" [disabled]="!form.name">Guardar</button>
            <button class="btn btn-outline-secondary" (click)="reset()">Limpiar</button>
          </div>
        </div>
      </div>
    </div>
  </section>
  `
})
export class BrandsAdminPage implements OnInit {
  #api = inject(AdminBrandsService);
  list: AdminBrand[] = [];
  form: Partial<AdminBrand> = { active: true };
  ngOnInit(): void { this.reload(); }
  reload() { this.#api.list().subscribe({ next: l => this.list = l, error: () => this.list = [] }); }
  edit(b: AdminBrand) { this.form = { ...b }; }
  reset() { this.form = { active: true }; }
  save() { this.#api.upsert(this.form as any).subscribe({ next: () => { this.reset(); this.reload(); }, error: () => {} }); }
}

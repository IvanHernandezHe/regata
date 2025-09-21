import { Component, OnInit, inject } from '@angular/core';
import { AdminCategoriesService, AdminCategory } from '../../core/admin-categories.service';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgFor, FormsModule],
  template: `
  <section class="container my-4">
    <h2>Categorías</h2>
    <div class="row g-3">
      <div class="col-12 col-md-6">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Nombre</th><th>Slug</th><th>Activa</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let c of list">
                <td>{{c.name}}</td>
                <td><code>{{c.slug}}</code></td>
                <td><span class="badge" [class.text-bg-success]="c.active" [class.text-bg-secondary]="!c.active">{{ c.active ? 'Sí' : 'No' }}</span></td>
                <td><button class="btn btn-sm btn-outline-secondary" (click)="edit(c)">Editar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card p-3">
          <h5>{{ form.id ? 'Editar categoría' : 'Nueva categoría' }}</h5>
          <input class="form-control mb-2" placeholder="Nombre" [(ngModel)]="form.name" name="name"/>
          <input class="form-control mb-2" placeholder="Slug (rines, llantas)" [(ngModel)]="form.slug" name="slug"/>
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="cActive" [(ngModel)]="form.active" name="active">
            <label class="form-check-label" for="cActive">Activa</label>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-dark" (click)="save()" [disabled]="!form.name || !form.slug">Guardar</button>
            <button class="btn btn-outline-secondary" (click)="reset()">Limpiar</button>
          </div>
        </div>
      </div>
    </div>
  </section>
  `
})
export class CategoriesAdminPage implements OnInit {
  #api = inject(AdminCategoriesService);
  list: AdminCategory[] = [];
  form: Partial<AdminCategory> = { active: true } as any;
  ngOnInit(): void { this.reload(); }
  reload() { this.#api.list().subscribe({ next: l => this.list = l, error: () => this.list = [] }); }
  edit(c: AdminCategory) { this.form = { ...c }; }
  reset() { this.form = { active: true } as any; }
  save() { this.#api.upsert(this.form as any).subscribe({ next: () => { this.reset(); this.reload(); }, error: () => {} }); }
}

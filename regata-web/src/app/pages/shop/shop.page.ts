import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { NgFor } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CartStore } from '../../state/cart.store';

@Component({
  standalone: true,
  imports: [NgFor, ProductCardComponent],
  template: `
  <section class="container my-4">
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2 mb-3">
      <h2 class="m-0">Tienda</h2>
      <div class="d-flex align-items-center gap-2 w-100 w-lg-auto">
        <input #q class="form-control" [value]="currentQuery" placeholder="Buscar marca, modelo o SKU" (input)="onSearch(q.value)"/>
        <button class="btn btn-outline-secondary" (click)="onSearch('')">Limpiar</button>
      </div>
    </div>
    <div class="d-flex align-items-center gap-2 mb-3">
      <label class="text-muted">Categoría</label>
      <select class="form-select w-auto" (change)="onCategory($any($event.target).value)" [value]="selectedCategory">
        <option value="">Todas</option>
        <option *ngFor="let c of categories" [value]="c">{{c}}</option>
      </select>
    </div>
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-lg-4" *ngFor="let p of products; trackBy: trackById">
        <app-product-card [product]="p"></app-product-card>
      </div>
    </div>
  </section>
  `
})
export class ShopPage {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private cart = inject(CartStore);
  products: Product[] = [];
  currentQuery = '';
  categories: string[] = [];
  selectedCategory = '';
  add(p: Product) { this.cart.add(p); }
  onSearch(q: string) { const t = (q || '').trim(); this.currentQuery = t; this.load(); }
  onCategory(c: string) { this.selectedCategory = c || ''; this.load(); }
  trackById(_: number, p: Product) { return p.id; }
  private load() {
    this.api.getProducts(this.currentQuery || undefined, this.selectedCategory || undefined)
      .subscribe(list => { this.products = list; this.categories = Array.from(new Set(list.map(x => x.category).filter(Boolean) as string[])).sort(); });
  }

  constructor() {
    const qp = this.route.snapshot.queryParamMap;
    const q = qp.get('q'); if (q) this.currentQuery = q;
    const cat = qp.get('category'); if (cat) this.selectedCategory = cat;
    this.load();
  }
}

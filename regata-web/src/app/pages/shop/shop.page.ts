import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { NgFor, AsyncPipe } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CartStore } from '../../state/cart.store';

@Component({
  standalone: true,
  imports: [NgFor, AsyncPipe, ProductCardComponent],
  template: `
  <section class="container my-4">
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2 mb-3">
      <h2 class="m-0">Tienda</h2>
      <div class="d-flex align-items-center gap-2 w-100 w-lg-auto">
        <input #q class="form-control" [value]="currentQuery" placeholder="Buscar marca, modelo o SKU" (input)="onSearch(q.value)"/>
        <button class="btn btn-outline-secondary" (click)="onSearch('')">Limpiar</button>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-lg-4" *ngFor="let p of products$ | async; trackBy: trackById">
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
  products$ = this.api.getProducts();
  currentQuery = '';
  add(p: Product) { this.cart.add(p); }
  onSearch(q: string) { this.products$ = this.api.getProducts(q?.trim() || undefined); }
  trackById(_: number, p: Product) { return p.id; }

  constructor() {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.currentQuery = q;
      this.onSearch(q);
    }
  }
}

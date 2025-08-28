import { Component, inject } from '@angular/core';
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
    <h2 class="mb-3">Tienda</h2>
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-lg-4" *ngFor="let p of products$ | async">
        <app-product-card [product]="p"></app-product-card>
      </div>
    </div>
  </section>
  `
})
export class ShopPage {
  private api = inject(ApiService);
  private cart = inject(CartStore);
  products$ = this.api.getProducts();
  add(p: Product) { this.cart.add(p); }
}

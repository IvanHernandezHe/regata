import { Component, Input, inject } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { CurrencyPipe } from '@angular/common';
import { CartStore } from '../../../state/cart.store';

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  template: `
  <div class="card h-100">
    <img src="/assets/tyre.png" class="card-img-top p-4" alt="llanta">
    <div class="card-body d-flex flex-column">
      <h5 class="card-title">{{product.brand}} {{product.modelName}}</h5>
      <p class="card-text text-muted">{{product.size}} · SKU {{product.sku}}</p>
      <div class="mt-auto d-flex justify-content-between align-items-center">
        <strong>{{ product.price | currency:'MXN' }}</strong>
        <button class="btn btn-dark" (click)="addToCart()">Agregar</button>
      </div>
    </div>
  </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  #cart = inject(CartStore);

  addToCart() {
    this.#cart.add(this.product);
  }
}

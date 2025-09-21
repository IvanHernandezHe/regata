import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { CurrencyPipe, NgIf, NgClass } from '@angular/common';
import { CartStore } from '../../../state/cart.store';
import { AuthStore } from '../../../state/auth.store';
import { WishlistStore } from '../../../state/wishlist.store';
import { ToastService } from '../../../core/toast.service';

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, NgIf, NgClass],
  template: `
  <div class="card h-100 position-relative">
    <span *ngIf="product.category" class="badge rounded-pill text-bg-light position-absolute top-0 start-0 m-2 border">{{ product.category }}</span>
    <a [routerLink]="['/product', product.id]">
      <img src="/assets/pzero-1_80.jpg" class="card-img-top p-4" alt="llanta">
    </a>
    <div class="card-body d-flex flex-column">
      <h5 class="card-title">
        <a class="text-decoration-none" [routerLink]="['/product', product.id]">
          {{product.brand}} {{product.modelName}}
        </a>
      </h5>
      <p class="card-text text-muted m-0">{{product.size}} · SKU {{product.sku}}</p>
      <span *ngIf="product.stock !== undefined" class="badge mt-1" [ngClass]="stockClass(product.stock || 0)">{{ stockLabel(product.stock || 0) }}</span>
      <div class="mt-auto d-flex justify-content-between align-items-center">
        <strong>{{ product.price | currency:'MXN' }}</strong>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" *ngIf="auth.isAuthenticated()" (click)="saveForLater()">Guardar</button>
          <button class="btn btn-dark" (click)="addToCart()">Agregar</button>
        </div>
      </div>
    </div>
  </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  #cart = inject(CartStore);
  auth = inject(AuthStore);
  #wishlist = inject(WishlistStore);
  #toast = inject(ToastService);

  addToCart() {
    this.#cart.add(this.product);
  }
  saveForLater() {
    this.#wishlist.add(this.product.id);
  }

  stockClass(stock: number) {
    if (stock <= 5) return 'bg-danger';
    if (stock <= 20) return 'bg-warning text-dark';
    return 'bg-success';
  }
  stockLabel(stock: number) {
    if (stock <= 5) return `Quedan ${stock}`;
    if (stock <= 20) return `Stock bajo: ${stock}`;
    return `Stock: ${stock}`;
  }
}

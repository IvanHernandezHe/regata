import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { CurrencyPipe, NgIf, NgClass } from '@angular/common';
import { CartStore } from '../../../state/cart.store';
import { AuthStore } from '../../../state/auth.store';
import { WishlistStore } from '../../../state/wishlist.store';
import { ToastService } from '../../../core/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, NgIf, NgClass, LucideAngularModule],
  styles: [`
    .media { position: relative; overflow: hidden; background: #fff; }
    /* uniform square ratio for all cards */
    .media::before { content: ''; display: block; aspect-ratio: 1 / 1; }
    .media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 1rem; }
    .brand-model { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em; }
    .price { font-size: 1.1rem; }
    .category-badge { position: absolute; top: .5rem; left: .5rem; }
    :host-context([data-bs-theme='dark']) .media { background: #0f0f0f; }
  `],
  template: `
  <div class="card h-100 position-relative">
    <span *ngIf="product?.category" class="badge rounded-pill text-bg-light position-absolute category-badge border">{{ product!.category }}</span>
    <a [routerLink]="['/product', product!.id]" class="media d-block">
      <img [src]="imgSrc()" alt="{{product!.brand}} {{product!.modelName}}" />
    </a>
    <div class="card-body d-flex flex-column gap-1">
      <h5 class="card-title brand-model mb-0">
        <a class="text-decoration-none" [routerLink]="['/product', product!.id]">
          {{product!.brand}} {{product!.modelName}}
        </a>
      </h5>
      <div class="text-muted small">{{product!.size}} · SKU {{product!.sku}}</div>
      <span *ngIf="product?.stock !== undefined" class="badge mt-1 align-self-start" [ngClass]="stockClass(product!.stock || 0)">{{ stockLabel(product!.stock || 0) }}</span>
      <div class="mt-auto d-flex justify-content-between align-items-center pt-2">
        <strong class="price">{{ product!.price | currency:'MXN' }}</strong>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" type="button" (click)="saveForLater()" [title]="auth.isAuthenticated() ? 'Agregar a favoritos' : 'Inicia sesión para guardar'" aria-label="Agregar a favoritos">
            <lucide-icon name="heart" size="16" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
            <span class="d-none d-sm-inline">Guardar</span>
          </button>
          <button class="btn btn-warning btn-sm fw-semibold d-inline-flex align-items-center gap-2" type="button" (click)="addToCart()">
            <lucide-icon name="shopping-cart" size="16" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
            <span>Agregar</span>
          </button>
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
  #router = inject(Router);

  addToCart() {
    this.#cart.add(this.product);
  }
  saveForLater() {
    if (!this.auth.isAuthenticated()) {
      this.#toast.info('Inicia sesión para guardar en favoritos');
      this.#router.navigate(['/auth'], { queryParams: { returnUrl: '/shop' } });
      return;
    }
    this.#wishlist.add(this.product.id);
    this.#toast.success('Guardado en favoritos');
  }

  imgSrc(): string {
    const imgs = this.product?.images;
    return (imgs && imgs.length ? imgs[0] : '/assets/pzero-1_80.jpg');
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

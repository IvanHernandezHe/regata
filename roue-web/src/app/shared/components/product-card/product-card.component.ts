import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
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
    .media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 1rem; transition: opacity .25s ease; }
    .media img.loading { opacity: 0; }
    .media .img-loader { position: absolute; inset: 0; margin: .75rem; border-radius: 1rem; background: linear-gradient(115deg, rgba(226,232,240,.6) 0%, rgba(226,232,240,.2) 40%, rgba(15,23,42,.08) 70%); background-repeat: no-repeat; animation: shimmer 1.2s ease-in-out infinite; }
    .brand-model { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em; }
    .price { font-size: 1.1rem; }
    .category-badge { position: absolute; top: .5rem; left: .5rem; }
    :host-context([data-bs-theme='dark']) .media { background: #0f0f0f; }
    /* Responsive actions: buttons fill and wrap nicely on small screens */
    .actions { display: flex; gap: .5rem; }
    .actions .btn { flex: 1 1 0; justify-content: center; text-align: center; }
    @media (min-width: 576px) {
      .actions { flex-wrap: nowrap; }
    }
    /* Minimalist hover/focus effects (no 3D lift) */
    .card { transition: border-color .15s ease, box-shadow .15s ease; }
    .card:hover { box-shadow: none; border-color: color-mix(in srgb, var(--jdm-red) 25%, #dcdcdc); }
    .actions .btn { transition: background-color .12s ease, border-color .12s ease, color .12s ease; }
    .actions .btn:focus-visible { outline: none; box-shadow: 0 0 0 .2rem color-mix(in srgb, var(--jdm-red) 25%, transparent); }
    /* Favorite button: subtle tinted hover */
    .btn-fav { background: #fff; color: #555; border-color: rgba(0,0,0,.15); }
    .btn-fav:hover, .btn-fav:focus { color: var(--jdm-red); border-color: var(--jdm-red); background: color-mix(in srgb, var(--jdm-red) 8%, #fff); }
    .btn-fav:active { background: color-mix(in srgb, var(--jdm-red) 14%, #fff); }
    @keyframes shimmer { 0% { background-position: -180% 0; } 100% { background-position: 180% 0; } }
    .media .img-loader { background-size: 200% 100%; }
    :host-context([data-bs-theme='dark']) .media .img-loader { background: linear-gradient(115deg, rgba(30,41,59,.7) 0%, rgba(30,41,59,.45) 40%, rgba(100,116,139,.25) 70%); background-size: 200% 100%; }
  `],
  template: `
  <div class="card h-100 position-relative">
    <span *ngIf="product?.category" class="badge rounded-pill text-bg-light position-absolute category-badge border">{{ product!.category }}</span>
    <a [routerLink]="['/product', product!.id]" class="media d-block" (mouseenter)="startHover()" (mouseleave)="stopHover()" (focus)="startHover()" (blur)="stopHover()">
      <img [src]="currentImage" [class.loading]="imageLoading" (load)="onImageLoad()" [attr.decoding]="'async'" loading="lazy" alt="{{product!.brand}} {{product!.modelName}}" />
      <div class="img-loader" *ngIf="imageLoading"></div>
    </a>
    <div class="card-body d-flex flex-column gap-1">
      <h5 class="card-title brand-model mb-0">
        <a class="text-decoration-none" [routerLink]="['/product', product!.id]">
          {{product!.brand}} {{product!.modelName}}
        </a>
      </h5>
      <div class="text-muted small">{{product!.size}} · SKU {{product!.sku}}</div>
      <span *ngIf="product?.stock !== undefined" class="badge mt-1 align-self-start" [ngClass]="stockClass(product!.stock || 0)">{{ stockLabel(product!.stock || 0) }}</span>
      <div class="mt-auto pt-2">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong class="price">{{ product!.price | currency:'MXN' }}</strong>
        </div>
        <div class="actions">
          <button class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2 btn-fav" type="button" (click)="saveForLater()" [title]="auth.isAuthenticated() ? 'Agregar a favoritos' : 'Inicia sesión para guardar'" aria-label="Agregar a favoritos">
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
export class ProductCardComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) product!: Product;
  #cart = inject(CartStore);
  auth = inject(AuthStore);
  #wishlist = inject(WishlistStore);
  #toast = inject(ToastService);
  #router = inject(Router);
  private readonly fallbackImage = '/assets/pzero-1_80.jpg';
  private hoverTimer: any = null;
  private loadedImages = new Set<string>();
  imageIndex = 0;
  currentImage = this.fallbackImage;
  imageLoading = true;

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

  ngOnChanges(_: SimpleChanges): void {
    this.loadedImages.clear();
    this.clearHoverTimer();
    this.setImage(0);
  }

  ngOnDestroy(): void {
    this.clearHoverTimer();
  }

  startHover() {
    const imgs = this.gallery();
    if (imgs.length <= 1) return;
    this.clearHoverTimer();
    const next = (this.imageIndex + 1) % imgs.length;
    this.setImage(next);
    this.hoverTimer = setInterval(() => this.advanceImage(), 2200);
  }

  stopHover() {
    const imgs = this.gallery();
    if (imgs.length <= 1) return;
    this.clearHoverTimer();
    this.setImage(0);
  }

  onImageLoad() {
    this.loadedImages.add(this.currentImage);
    this.imageLoading = false;
  }

  private advanceImage() {
    const imgs = this.gallery();
    if (imgs.length <= 1) return;
    const next = (this.imageIndex + 1) % imgs.length;
    this.setImage(next);
  }

  private setImage(index: number) {
    const imgs = this.gallery();
    const clamped = (index >= 0 && index < imgs.length) ? index : 0;
    this.imageIndex = clamped;
    const src = imgs[clamped] ?? this.fallbackImage;
    this.currentImage = src;
    this.imageLoading = !this.loadedImages.has(src);
  }

  private gallery(): string[] {
    const arr = (this.product?.images ?? []).filter((src): src is string => !!src);
    return arr.length ? arr : [this.fallbackImage];
  }

  private clearHoverTimer() {
    if (this.hoverTimer) {
      clearInterval(this.hoverTimer);
      this.hoverTimer = null;
    }
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

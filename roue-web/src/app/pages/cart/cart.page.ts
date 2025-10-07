import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WishlistService, WishItem } from '../../core/wishlist.service';
import { AuthStore } from '../../state/auth.store';
import { ToastService } from '../../core/toast.service';
import { CartStore } from '../../state/cart.store';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';

@Component({
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, RouterLink, FormsModule],
  template: `
  <section class="container my-4">
    <h2>Carrito</h2>
    <!-- Coupon -->
    <div class="row g-2 align-items-center mb-3">
      <div class="col-12 col-md-6 d-flex gap-2">
        <input class="form-control" placeholder="Cupón de descuento" [(ngModel)]="coupon" name="coupon"/>
        <button class="btn btn-outline-dark" (click)="applyCoupon()">Aplicar</button>
        <button class="btn btn-outline-secondary" *ngIf="cart.coupon()" (click)="removeCoupon()">Quitar</button>
      </div>
      <div class="col-12 col-md-6 text-md-end" *ngIf="cart.coupon() as c">
        <small class="text-muted">Cupón aplicado: <strong>{{ c.code }}</strong></small>
      </div>
    </div>
    <table class="table align-middle" *ngIf="cart.items().length; else empty">
      <thead><tr><th>Producto</th><th style="width: 200px;">Cantidad</th><th>Importe</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let i of cart.items()">
          <td>
            {{ i.name }}
            <small class="text-muted d-block">SKU {{ i.sku }}</small>
            <small class="text-muted" *ngIf="i.stock !== undefined">Quedan {{ i.stock }}</small>
          </td>
          <td>
            <div class="btn-group" role="group" aria-label="cantidad">
              <button class="btn btn-outline-secondary" (click)="dec(i.productId)">−</button>
              <button class="btn btn-light" disabled>{{ i.qty }}</button>
              <button class="btn btn-outline-secondary" (click)="inc(i.productId)" [disabled]="i.stock && i.qty >= i.stock">+</button>
            </div>
          </td>
          <td>{{ (i.price * i.qty) | currency:'MXN' }}</td>
          <td><button class="btn btn-sm btn-outline-danger" (click)="remove(i.productId)">Quitar</button></td>
        </tr>
      </tbody>
    </table>
    <ng-template #empty>
      <div class="alert alert-info">Tu carrito está vacío.</div>
    </ng-template>

    <div class="d-flex justify-content-between align-items-center mt-3 gap-2">
      <div>
        <div><strong>Subtotal: {{ cart.subtotal() | currency:'MXN' }}</strong></div>
        <div *ngIf="cart.estimateDiscount() > 0" class="text-success">Descuento estimado: −{{ cart.estimateDiscount() | currency:'MXN' }}</div>
        <div>Total estimado: <strong>{{ (cart.subtotal() - cart.estimateDiscount()) | currency:'MXN' }}</strong></div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-danger" (click)="clearConfirm()" [disabled]="cart.items().length===0">Vaciar</button>
        <a class="btn btn-dark" routerLink="/checkout" [class.disabled]="cart.items().length===0">Ir a pagar</a>
      </div>
    </div>
  </section>

  <!-- Saved for later -->
  <section class="container mb-5" *ngIf="auth.isAuthenticated()">
    <h3 class="h5">Guardados para después</h3>
    <div *ngIf="saved.length; else noneSaved">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Producto</th><th>Precio</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let w of saved">
              <td>{{ w.productName }} <small class="text-muted d-block">SKU {{ w.productSku }}</small></td>
              <td>{{ w.price | currency:'MXN' }}</td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-dark me-1" (click)="moveSavedToCart(w)">Mover al carrito</button>
                <button class="btn btn-sm btn-outline-secondary" (click)="removeSaved(w)">Quitar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <ng-template #noneSaved><div class="text-muted">No hay artículos guardados.</div></ng-template>
  </section>
  `
})
export class CartPage implements OnInit {
  cart = inject(CartStore);
  auth = inject(AuthStore);
  #wishlist = inject(WishlistService);
  #toast = inject(ToastService);
  #cartApi = inject(CartService);
  coupon = '';
  saved: WishItem[] = [];
  remove(id: string) { this.cart.remove(id); }
  inc(id: string) { this.cart.increment(id); }
  dec(id: string) { this.cart.decrement(id); }
  clearConfirm() {
    if (confirm('¿Vaciar carrito? Esta acción no se puede deshacer.')) {
      const snapshot = this.cart.items();
      this.cart.clear();
      this.#toast.showWithAction('Carrito vaciado', 'Deshacer', () => this.restore(snapshot));
    }
  }
  applyCoupon() { this.cart.applyCoupon(this.coupon); }
  removeCoupon() { this.cart.clearCoupon(); }
  ngOnInit() {
    if (this.auth.isAuthenticated()) this.loadSaved();
    // Try hydrate from server if it has content (does not override local non-empty carts)
    this.#cartApi.get().subscribe({
      next: (res) => {
        const local = this.cart.items();
        if (res.items?.length && (local.length === 0 || this.cart.isServerSynced())) {
          this.cart.replaceFromServer(res);
        }
      },
      error: () => {}
    });
  }
  loadSaved() { this.#wishlist.list().subscribe({ next: (l) => (this.saved = l), error: () => (this.saved = []) }); }
  moveSavedToCart(w: WishItem) { this.#wishlist.moveToCart(w.productId, 1).subscribe({ next: () => { this.loadSaved(); this.cart.increment(w.productId, 1); }, error: () => {} }); }
  removeSaved(w: WishItem) { this.#wishlist.remove(w.productId).subscribe({ next: () => this.loadSaved(), error: () => {} }); }

  private restore(items: ReturnType<CartStore['items']>) { this.cart.restoreSnapshot(items as any); }
}

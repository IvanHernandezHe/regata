import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { WishlistStore } from '../../state/wishlist.store';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../state/cart.store';

@Component({
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, RouterLink],
  template: `
  <section class="container my-4">
    <h2>Guardados para después</h2>
    <div *ngIf="store.items() as list; else loading">
      <div *ngIf="list.length; else empty">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Producto</th><th>Precio</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let w of list">
                <td>{{ w.productName }} <small class="text-muted d-block">SKU {{ w.productSku }}</small></td>
                <td>{{ w.price | currency:'MXN' }}</td>
                <td class="text-nowrap">
                  <button class="btn btn-sm btn-outline-dark me-1" (click)="move(w.productId)">Mover al carrito</button>
                  <button class="btn btn-sm btn-outline-secondary" (click)="remove(w.productId)">Quitar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <ng-template #empty>
        <div class="alert alert-info">Aún no tienes artículos guardados. <a routerLink="/shop">Ir a la tienda</a></div>
      </ng-template>
    </div>
    <ng-template #loading>
      <p class="text-muted">Cargando…</p>
    </ng-template>
  </section>
  `
})
export class WishlistPage implements OnInit {
  store = inject(WishlistStore);
  cart = inject(CartStore);
  ngOnInit(): void { this.store.load(); }
  move(productId: string) { this.store.moveToCart(productId, 1); }
  remove(productId: string) { this.store.remove(productId); }
}

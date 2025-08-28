import { Component, inject } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, RouterLink],
  template: `
  <section class="container my-4">
    <h2>Carrito</h2>
    <table class="table align-middle" *ngIf="cart.items().length; else empty">
      <thead><tr><th>Producto</th><th style="width: 200px;">Cantidad</th><th>Importe</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let i of cart.items()">
          <td>{{ i.name }} <small class="text-muted d-block">SKU {{ i.sku }}</small></td>
          <td>
            <div class="btn-group" role="group" aria-label="cantidad">
              <button class="btn btn-outline-secondary" (click)="dec(i.productId)">−</button>
              <button class="btn btn-light" disabled>{{ i.qty }}</button>
              <button class="btn btn-outline-secondary" (click)="inc(i.productId)">+</button>
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

    <div class="d-flex justify-content-between mt-3">
      <strong>Total: {{ cart.subtotal() | currency:'MXN' }}</strong>
      <a class="btn btn-dark" routerLink="/checkout" [class.disabled]="cart.items().length===0">Ir a pagar</a>
    </div>
  </section>
  `
})
export class CartPage {
  cart = inject(CartStore);
  remove(id: string) { this.cart.remove(id); }
  inc(id: string) { this.cart.increment(id); }
  dec(id: string) { this.cart.decrement(id); }
}

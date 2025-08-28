import { Component } from '@angular/core';
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
      <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let i of cart.items()">
          <td>{{ i.name }}</td>
          <td>{{ i.qty }}</td>
          <td>{{ i.price | currency:'MXN' }}</td>
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
  cart = new CartStore();
  remove(id: string) { this.cart.remove(id); }
}
import { Component } from '@angular/core';
import { CartStore } from '../../state/cart.store';
import { CurrencyPipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [CurrencyPipe],
  template: `
  <section class="container my-4">
    <h2>Checkout</h2>
    <p>Total a pagar: <strong>{{ cart.subtotal() | currency:'MXN' }}</strong></p>
    <button class="btn btn-success" (click)="pay()">Pagar (sandbox)</button>
  </section>
  `
})
export class CheckoutPage {
  cart = new CartStore();
  pay() {
    // Próximo paso: llamar a POST /api/checkout y redirigir a checkoutUrl
    alert('TODO: integrar Stripe/Mercado Pago');
  }
}
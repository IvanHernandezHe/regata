import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../../state/cart.store';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [RouterLink, NgIf],
  template: `
  <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
    <div class="container">
      <a class="navbar-brand fw-bold" routerLink="/">Regata</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navRegata">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navRegata">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" routerLink="/shop">Tienda</a></li>
        </ul>
        <a class="btn btn-outline-dark position-relative" routerLink="/cart">
          Carrito
          <span *ngIf="cart.count() > 0"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {{ cart.count() }}
          </span>
        </a>
      </div>
    </div>
  </nav>
  `
})
export class NavbarComponent {
  cart = inject(CartStore);
}

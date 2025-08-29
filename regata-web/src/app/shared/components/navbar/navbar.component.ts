import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartStore } from '../../../state/cart.store';
import { LucideAngularModule } from 'lucide-angular';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIf, LucideAngularModule],
  template: `
  <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
    <div class="container">
      <a class="navbar-brand fw-bold" routerLink="/">Regata</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navRegata">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navRegata">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/shop">Tienda</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/blog">Blog</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/nosotros">Nosotros</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/servicios">Servicios</a></li>
        </ul>
        <div class="d-flex align-items-center gap-2">
          <a class="btn btn-outline-secondary d-inline-flex align-items-center gap-2" routerLink="/perfil" aria-label="Perfil">
            <lucide-icon name="user" size="18"></lucide-icon>
            <span class="d-none d-sm-inline">Perfil</span>
          </a>
          <a class="btn btn-outline-dark position-relative d-inline-flex align-items-center gap-2" routerLink="/cart">
            <lucide-icon name="shopping-cart" size="18"></lucide-icon>
            <span class="d-none d-sm-inline">Carrito</span>
            <span *ngIf="cart.count() > 0"
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {{ cart.count() }}
            </span>
          </a>
        </div>
      </div>
    </div>
  </nav>
  `
})
export class NavbarComponent {
  cart = inject(CartStore);
}

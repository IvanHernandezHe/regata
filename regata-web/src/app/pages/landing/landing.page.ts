import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, AsyncPipe, SlicePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, AsyncPipe, SlicePipe, CurrencyPipe, ProductCardComponent],
  styles: [`
    .hero {
      position: relative;
      background: radial-gradient(1200px 600px at 20% -20%, #ff6b6b33, transparent),
                  radial-gradient(1200px 600px at 120% 0%, #845ef733, transparent),
                  linear-gradient(180deg, #111 0%, #1a1a1a 100%);
      color: #fff;
    }
    .hero-overlay {
      backdrop-filter: blur(2px);
    }
    .feature {
      border-radius: .75rem;
      border: 1px solid rgba(0,0,0,.08);
      background: #fff;
    }
    .category-tile {
      border-radius: .75rem;
      overflow: hidden;
      position: relative;
      background: #f8f9fa;
      min-height: 160px;
    }
    .category-tile a { position: absolute; inset: 0; }
    .category-tile h5 { position: absolute; left: 1rem; bottom: 1rem; margin: 0; }
    .trust-logos img { max-height: 28px; opacity: .9; }
  `],
  template: `
  <!-- Hero -->
  <header class="hero py-5 py-lg-6 mb-4">
    <div class="container hero-overlay">
      <div class="row align-items-center g-4">
        <div class="col-lg-7 text-center text-lg-start">
          <h1 class="display-5 fw-bold mb-2">Llantas a domicilio, fácil y rápido</h1>
          <p class="lead mb-4">Compra en línea, agenda instalación y acumula recompensas en cada pedido.</p>
          <div class="d-flex gap-2 justify-content-center justify-content-lg-start">
            <a class="btn btn-danger btn-lg px-4" routerLink="/shop">Comprar ahora</a>
            <a class="btn btn-outline-light btn-lg px-4" routerLink="/cart">Ver carrito</a>
          </div>
        </div>
        <div class="col-lg-5 text-center">
          <img src="/assets/tyre.png" alt="llanta" class="img-fluid border rounded-3 bg-body"/>
        </div>
      </div>
    </div>
  </header>

  <!-- Value props -->
  <section class="container mb-4">
    <div class="row g-3 text-center">
      <div class="col-12 col-md-4">
        <div class="feature p-4 h-100">
          <div class="fw-bold">4x3 en marcas selectas</div>
          <small class="text-muted">Promociones por tiempo limitado</small>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="feature p-4 h-100">
          <div class="fw-bold">Instalación a domicilio</div>
          <small class="text-muted">Agenda en tu horario</small>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="feature p-4 h-100">
          <div class="fw-bold">Recompensas en cada compra</div>
          <small class="text-muted">Acumula y canjea puntos</small>
        </div>
      </div>
    </div>
  </section>

  <!-- Featured products -->
  <section class="container mb-5">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="h4 m-0">Destacados</h2>
      <a class="btn btn-sm btn-outline-dark" routerLink="/shop">Ver todo</a>
    </div>
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-lg-4" *ngFor="let p of (products$ | async) | slice:0:6">
        <app-product-card [product]="p"></app-product-card>
      </div>
      <div class="col-12" *ngIf="(products$ | async)?.length === 0">
        <div class="alert alert-info">Aún no hay productos disponibles.</div>
      </div>
    </div>
  </section>

  <!-- Categories / quick links -->
  <section class="container mb-5">
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div class="category-tile p-3 border">
          <h5>Autos</h5>
          <a routerLink="/shop" aria-label="Llantas para autos"></a>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="category-tile p-3 border">
          <h5>SUV</h5>
          <a routerLink="/shop" aria-label="Llantas para SUV"></a>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="category-tile p-3 border">
          <h5>Camioneta</h5>
          <a routerLink="/shop" aria-label="Llantas para camioneta"></a>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="category-tile p-3 border">
          <h5>Performance</h5>
          <a routerLink="/shop" aria-label="Llantas performance"></a>
        </div>
      </div>
    </div>
  </section>

  <!-- Trust bar -->
  <section class="container mb-5 trust-logos text-center text-muted">
    <div class="d-flex flex-wrap justify-content-center gap-4">
      <img src="https://dummyimage.com/120x28/ddd/999&text=Visa" alt="Visa"/>
      <img src="https://dummyimage.com/120x28/ddd/999&text=Mastercard" alt="Mastercard"/>
      <img src="https://dummyimage.com/120x28/ddd/999&text=Oxxo" alt="Oxxo"/>
      <img src="https://dummyimage.com/120x28/ddd/999&text=Stripe" alt="Stripe"/>
    </div>
  </section>
  `
})
export class LandingPage {
  private api = inject(ApiService);
  products$ = this.api.getProducts();
}

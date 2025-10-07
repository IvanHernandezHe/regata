import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, AsyncPipe, SlicePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/models/product.model';
import { Brand } from '../../core/models/brand.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, AsyncPipe, SlicePipe, ProductCardComponent, FormsModule, LucideAngularModule],
  styles: [`
    /* Hero */
    .hero {
      position: relative;
      background: linear-gradient(180deg, #f8f9fa, #ffffff);
    }
    .hero-img {
      width: 100%;
      max-width: 520px;
      height: auto;
      object-fit: cover;
    }
    .search-panel {
      background: #fff;
      border: 1px solid rgba(0,0,0,.08);
      border-radius: .75rem;
      padding: 1rem;
      box-shadow: 0 4px 16px rgba(0,0,0,.04);
    }
    .pill {
      border-radius: .75rem;
      background: #fff;
      border: 1px solid rgba(0,0,0,.08);
      padding: .85rem 1rem;
      text-align: center;
      font-weight: 600;
    }
    .pill small { display: block; font-weight: 400; color: #6c757d; }
    .section-title { font-weight: 700; }

    /* Simple image carousel (no text, auto-slide) */
    /* Responsive height: smaller on mobile to keep panoramic proportion */
    .simple-carousel {
      position: relative; overflow: hidden; border-radius: 0; height: 40vh; max-height: 420px;
      contain: layout paint; isolation: isolate; overscroll-behavior: contain; /* evita desbordes visuales */
      overflow-x: clip; /* recorte duro en navegadores modernos */
      overflow-clip-margin: content-box;
    }
    .simple-track {
      display: flex; width: 100%; height: 100%; transform: translate3d(0,0,0);
      transition: transform 600ms ease; will-change: transform; backface-visibility: hidden;
      margin: 0; padding: 0; gap: 0;
    }
    .simple-item { flex: 0 0 100%; height: 100%; backface-visibility: hidden; }
    .simple-item img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; transform: translateZ(0); clip-path: inset(0); }
    .simple-progress { position: absolute; left: 8px; right: 8px; bottom: 8px; display: flex; gap: 6px; z-index: 2; }
    .simple-progress .bar { flex: 1; height: 3px; background: rgba(255,255,255,.35); border-radius: 999px; overflow: hidden; }
    .simple-progress .fill { display: block; height: 100%; background: #fff; width: 0%; transition: width 120ms linear; }
    .simple-carousel[data-paused="true"] .simple-progress .fill { background: rgba(255,255,255,.7); }
    .simple-carousel[data-paused="true"] { cursor: pointer; }
    @media (min-width: 576px) { .simple-carousel { height: 50vh; max-height: 520px; } }
    @media (min-width: 768px) { .simple-carousel { height: 60vh; max-height: 600px; } }
    @media (min-width: 992px) { .simple-carousel { height: 75vh; max-height: 720px; } }
    /* Removed keyframes-based scroll to avoid left-edge flicker on loop */

    /* Generic boxes */
    .feature { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; }
    .category-tile { border-radius: .75rem; overflow: hidden; position: relative; background: #f8f9fa; min-height: 160px; }
    .category-tile a { position: absolute; inset: 0; }
    .category-tile h5 { position: absolute; left: 1rem; bottom: 1rem; margin: 0; }
    .trust-logos img { max-height: 28px; opacity: .9; }

    .service-card { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; padding: 1rem; height: 100%; }
    /* Brand logos: colored, uniform size, justified; links with subtle hover */
    .brand-logos a { display: inline-flex; align-items: center; justify-content: center; width: 120px; height: 42px; border-radius: .5rem; border: 1px solid rgba(0,0,0,.06); background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,.06); transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
    .brand-logos a:hover, .brand-logos a:focus-visible { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.12); border-color: color-mix(in srgb, var(--jdm-red) 35%, #000 0%); outline: none; }
    .brand-logos img {
      height: 42px;
      width: 120px;
      object-fit: contain;
      filter: none;
      opacity: 1;
      display: block;
    }
    .brand-logos img:hover { filter: none; opacity: 1; }
    .cashback { border-radius: .75rem; background: linear-gradient(135deg, #111 0%, #1e1e1e 60%, #2a2a2a 100%); color: #fff; overflow: hidden; }
    .coupon-card { border-radius: .75rem; border: 2px dashed #e0e0e0; background: #fff; }
    .info-split { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; }

    /* Floating FABs */
    .floating-fabs { position: fixed; right: 16px; bottom: 16px; z-index: 1050; display: flex; flex-direction: column; gap: 10px; }
    .fab { width: clamp(44px, 9vw, 56px); height: clamp(44px, 9vw, 56px); border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,.22); color: #fff; text-decoration: none; border: none; position: relative; }
    .fab svg { width: 60%; height: 60%; display: block; }
    .fab-help { background: var(--jdm-red); }
    .fab-call { background: #0d6efd; }
    .fab-wa { background: #25D366; }
    .fab:hover { filter: brightness(1.05); transform: translateY(-1px); }
    .fab:active { transform: translateY(0); }
    /* Hover label */
    .fab::after {
      content: attr(data-label);
      position: absolute; right: calc(100% + 8px); top: 50%; transform: translateY(6px); opacity: 0;
      background: rgba(0,0,0,.85); color: #fff; font-size: .78rem; padding: .28rem .5rem; border-radius: .5rem;
      white-space: nowrap; pointer-events: none; transition: opacity .15s ease, transform .15s ease;
    }
    .fab:hover::after, .fab:focus-visible::after { opacity: 1; transform: translateY(-50%); }

    /* Responsive tweaks */
    @media (min-width: 992px) {
      .search-panel { padding: 1.25rem 1.5rem; }
    }

    /* Dark theme adaptations */
    :host-context([data-bs-theme="dark"]) .hero { background: linear-gradient(180deg, #141414, #0e0e0e); }
    :host-context([data-bs-theme="dark"]) .search-panel { background: #111; border-color: #2a2a2a; box-shadow: 0 8px 28px rgba(0,0,0,.5); }
    :host-context([data-bs-theme="dark"]) .pill { background: #121212; border-color: #2a2a2a; color: #e6e6e6; }
    :host-context([data-bs-theme="dark"]) .feature { background: #111; border-color: #2a2a2a; }
    :host-context([data-bs-theme="dark"]) .category-tile { background: #141414; border-color: #2a2a2a; }
    :host-context([data-bs-theme="dark"]) .service-card { background: #111; border-color: #2a2a2a; }
    :host-context([data-bs-theme="dark"]) .coupon-card { background: #111; border-color: #2a2a2a; }
    :host-context([data-bs-theme="dark"]) .info-split { background: #111; border-color: #2a2a2a; }
    :host-context([data-bs-theme="dark"]) .simple-progress .bar { background: rgba(0,0,0,.35); }
    :host-context([data-bs-theme="dark"]) .simple-progress .fill { background: rgba(255,255,255,.9); }
  `],
  template: `
  <!-- Image carousel just below navbar -->
  <section class="container-fluid p-0 m-0">
    <div class="simple-carousel" [attr.data-paused]="paused" (pointerenter)="pause()" (pointerleave)="resume()" (pointerdown)="pause()" (pointerup)="resume()" (pointercancel)="resume()">
      <div class="simple-track" [style.transform]="'translate3d(-' + (currentSlide * 100) + '%,0,0)'"><!--
        -->
        <div class="simple-item" *ngFor="let s of slides; trackBy: trackByIndex">
          <img [src]="s.src" [alt]="s.alt">
        </div>
      </div>
      <div class="simple-progress" aria-hidden="true">
        <div class="bar" *ngFor="let s of slides; let i = index">
          <span class="fill" [style.width]="barWidth(i)"></span>
        </div>
      </div>
    </div>
  </section>

  <!-- Hero with search panel -->
  <header class="hero py-4 py-lg-5 mb-4">
    <div class="container">
      <div class="row align-items-center g-4">
        <!-- Left: Title + search -->
        <div class="col-12 col-lg-7">
          <h1 class="display-6 fw-bold mb-3 drift-in">Encuentra tu llanta ideal</h1>
          <p class="text-muted mb-3">Busca por palabra clave o filtra por marca, año y precio.</p>

          <div class="search-panel">
            <div class="row g-2">
              <div class="col-12">
                <input #kw class="form-control form-control-lg" placeholder="Buscar (marca, modelo o SKU)"/>
              </div>
              <div class="col-6 col-md-4">
                <select class="form-select" [(ngModel)]="filters.brand">
                  <option [ngValue]="undefined" selected>Marca</option>
                  <option *ngFor="let b of brands" [value]="b">{{b}}</option>
                </select>
              </div>
              <div class="col-6 col-md-4">
                <select class="form-select" [(ngModel)]="filters.year">
                  <option [ngValue]="undefined" selected>Año</option>
                  <option *ngFor="let y of years" [value]="y">{{y}}</option>
                </select>
              </div>
              <div class="col-12 col-md-4">
                <select class="form-select" [(ngModel)]="filters.price">
                  <option [ngValue]="undefined" selected>Precio</option>
                  <option value="-5000">Hasta $5,000</option>
                  <option value="5000-10000">$5,000–$10,000</option>
                  <option value="10000+">$10,000 o más</option>
                </select>
              </div>
              <div class="col-12 d-grid">
                <button class="btn btn-jdm btn-lg" (click)="submitSearch(kw.value)">Buscar</button>
              </div>
            </div>
          </div>

          <div class="row g-2 mt-3">
            <div class="col-4">
              <div class="pill sticker-red">20%<small>OFF</small></div>
            </div>
            <div class="col-4">
              <div class="pill sticker">Envío<small>Gratis</small></div>
            </div>
            <div class="col-4">
              <div class="pill sticker">6 MSI<small>Financiamiento</small></div>
            </div>
          </div>
        </div>

        <!-- Right: hero image -->
        <div class="col-12 col-lg-5 text-center d-flex flex-column gap-3">
          <img src="/assets/pzero-1_80.jpg" alt="llanta" class="hero-img border rounded-3 bg-body align-self-center"/>
        </div>
      </div>
    </div>
  </header>

  

  <!-- Value props (secondary strip) -->
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

  <!-- Popular tires -->
  <section class="container mb-5">
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2 mb-3">
      <h2 class="h4 m-0 section-title">Llantas populares</h2>
      <div class="d-flex align-items-center gap-2 w-100 w-lg-auto">
        <input #q class="form-control" placeholder="Buscar marca, modelo o SKU" (input)="onSearch(q.value)"/>
        <button class="btn btn-outline-secondary" (click)="onSearch('')">Limpiar</button>
        <a class="btn btn-sm btn-outline-dark" routerLink="/shop">Ver todo</a>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-lg-4" *ngFor="let p of (products$ | async) | slice:0:6; trackBy: trackById">
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

  <!-- Services -->
  <section class="container mb-5">
    <h2 class="h4 mb-3">Servicios adicionales</h2>
    <div class="row g-3">
      <div class="col-12 col-md-6 col-lg-3">
        <div class="service-card">
          <div class="fw-bold">Balanceo</div>
          <small class="text-muted">Incluido en la instalación</small>
        </div>
      </div>
      <div class="col-12 col-md-6 col-lg-3">
        <div class="service-card">
          <div class="fw-bold">Alineación</div>
          <small class="text-muted">Opcional al finalizar compra</small>
        </div>
      </div>
      <div class="col-12 col-md-6 col-lg-3">
        <div class="service-card">
          <div class="fw-bold">Rotación</div>
          <small class="text-muted">Mejor desempeño y vida útil</small>
        </div>
      </div>
      <div class="col-12 col-md-6 col-lg-3">
        <div class="service-card">
          <div class="fw-bold">Garantía por escrito</div>
          <small class="text-muted">Cobertura ante defectos de fabricación</small>
        </div>
      </div>
    </div>
  </section>

  <!-- Cashback + payments -->
  <section class="container mb-5">
    <div class="row g-3 align-items-stretch">
      <div class="col-12 col-lg-7">
        <div class="cashback p-4 h-100 d-flex flex-column flex-lg-row align-items-center gap-3">
          <img src="https://dummyimage.com/96x96/333/ffffff&text=$" alt="Cashback" class="rounded bg-body" style="width:96px;height:96px;object-fit:cover;"/>
          <div class="flex-fill">
            <div class="h4 m-0">Obtén 5% de cashback</div>
            <p class="m-0 text-white-50">Regístrate y recibe saldo para tu próxima compra.</p>
          </div>
          <a routerLink="/perfil" class="btn btn-light text-dark fw-semibold">Crear cuenta</a>
        </div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="feature p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h3 class="h5 m-0">Métodos de pago</h3>
          </div>
          <div class="d-flex flex-wrap gap-3 align-items-center">
            <img src="https://dummyimage.com/80x32/ddd/999&text=Visa" alt="Visa"/>
            <img src="https://dummyimage.com/80x32/ddd/999&text=Mastercard" alt="Mastercard"/>
            <img src="https://dummyimage.com/80x32/ddd/999&text=AMEX" alt="AMEX"/>
            <img src="https://dummyimage.com/80x32/ddd/999&text=OXXO" alt="OXXO"/>
            <img src="https://dummyimage.com/80x32/ddd/999&text=Transfer" alt="Transferencia"/>
          </div>
          <small class="text-muted d-block mt-2">Pagos seguros con encriptación.</small>
        </div>
      </div>
    </div>
  </section>

  <!-- Tire search by size/model -->
  <section class="container mb-5">
    <div class="info-split p-3 p-lg-4">
      <div class="row g-4 align-items-center">
        <div class="col-12 col-lg-6">
          <h2 class="h5 mb-3">¿No sabes qué llanta elegir?</h2>
          <p class="text-muted">Busca por medida tal como aparece en tu llanta: ancho / perfil R rin.</p>
          <div class="row g-2">
            <div class="col-4">
              <select class="form-select" [(ngModel)]="size.width">
                <option [ngValue]="undefined" disabled selected>Ancho</option>
                <option *ngFor="let w of widths" [value]="w">{{w}}</option>
              </select>
            </div>
            <div class="col-4">
              <select class="form-select" [(ngModel)]="size.aspect">
                <option [ngValue]="undefined" disabled selected>Perfil</option>
                <option *ngFor="let a of aspects" [value]="a">{{a}}</option>
              </select>
            </div>
            <div class="col-4">
              <select class="form-select" [(ngModel)]="size.rim">
                <option [ngValue]="undefined" disabled selected>Rin</option>
                <option *ngFor="let r of rims" [value]="r">{{r}}</option>
              </select>
            </div>
            <div class="col-12 d-flex gap-2">
              <button class="btn btn-dark" (click)="onSizeSearch()" [disabled]="!size.width || !size.aspect || !size.rim">Buscar {{size.width}}/{{size.aspect}}R{{size.rim}}</button>
              <button class="btn btn-outline-secondary" (click)="resetSize()">Limpiar</button>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <h2 class="h5 mb-3">¿Ya sabes lo que buscas?</h2>
          <div class="d-flex align-items-center gap-2">
            <input #search2 class="form-control" placeholder="Modelo, marca o SKU"/>
            <button class="btn btn-outline-dark" (click)="goToShop(search2.value)">Buscar</button>
          </div>
          <small class="text-muted">Ejemplo: P-Zero, 205/55R16 o 123456</small>
        </div>
      </div>
    </div>
  </section>

  <!-- Brands -->
  <section class="container mb-5 brand-logos" aria-labelledby="brands-title">
    <h2 id="brands-title" class="h4 mb-3">Marcas</h2>
    <ng-container *ngIf="brandLogos.length; else brandLogosEmpty">
      <div class="d-flex flex-wrap gap-4 align-items-center justify-content-center justify-content-lg-between">
        <a
          *ngFor="let brand of brandLogos; trackBy: trackBrandId"
          [routerLink]="['/shop']"
          [queryParams]="{ brand: brand.name }"
          class="text-decoration-none"
          [attr.aria-label]="'Ver llantas de ' + brand.name"
          title="Ver en tienda"
        >
          <img
            [src]="brand.logoUrl || fallbackBrandLogo"
            [attr.alt]="brand.name"
            [attr.title]="brand.name"
            loading="lazy"
            (error)="onBrandImageError($event)"
          />
        </a>
      </div>
    </ng-container>
    <ng-template #brandLogosEmpty>
      <div class="text-muted small">Agrega marcas en el panel de administración para mostrarlas aquí.</div>
    </ng-template>
  </section>

  <!-- Coupons / promos -->
  <section class="container mb-5">
    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <div class="coupon-card p-4 h-100 d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-3">
          <div class="flex-fill">
            <div class="h5 m-0">Cupones promocionales</div>
            <small class="text-muted">Aplica tu cupón al pagar. Ej.: ROUE10</small>
          </div>
          <div class="d-flex gap-2 w-100 w-lg-auto">
            <input #coupon class="form-control" placeholder="Código"/>
            <button class="btn btn-dark" (click)="applyCoupon(coupon.value)">Aplicar</button>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="feature p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h3 class="h5 m-0">Promociones vigentes</h3>
            <a class="btn btn-sm btn-outline-dark" routerLink="/shop">Ver más</a>
          </div>
          <ul class="m-0 ps-3">
            <li>4x3 en líneas seleccionadas</li>
            <li>MSI en compras mayores a $5,000</li>
            <li>Envío e instalación a domicilio</li>
          </ul>
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

  <!-- Contact / social strip -->
  <section class="container mb-5">
    <div class="feature p-3 p-lg-4 d-flex flex-column flex-lg-row align-items-center justify-content-between gap-3">
      <div class="d-flex align-items-center gap-4">
        <div>
          <div class="fw-bold">Atención al cliente</div>
          <small class="text-muted">Lun–Sáb 9:00–19:00</small>
        </div>
        <div>
          <div class="fw-bold">Tel:</div>
          <a [href]="'tel:' + supportPhone" class="text-decoration-none">{{ supportPhoneDisplay }}</a>
        </div>
        <div>
          <div class="fw-bold">Correo:</div>
          <a href="mailto:hola@roue.mx" class="text-decoration-none">hola@roue.mx</a>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3">
        <a href="https://facebook.com/roue" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">Facebook</a>
        <a href="https://instagram.com/roue" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">Instagram</a>
        <a href="https://t.me/roue" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">Telegram</a>
      </div>
    </div>
  </section>

  <!-- Floating action buttons -->
  <div class="floating-fabs" aria-label="Acciones rápidas">
    <a class="fab fab-help" routerLink="/ayuda" aria-label="Emergencia o ayuda" data-label="Emergencia">
      <!-- Wheel/tire icon with double rim and five spokes -->
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="5.5" stroke="currentColor" stroke-width="2"/>
        <g fill="currentColor">
          <path d="M10.856 6.62 L12 12 L13.144 6.62 Z"/>
          <path d="M16.763 9.25 L12 12 L17.47 11.425 Z"/>
          <path d="M16.087 15.68 L12 12 L14.237 17.025 Z"/>
          <path d="M9.763 17.025 L12 12 L7.913 15.68 Z"/>
          <path d="M6.53 11.425 L12 12 L7.237 9.25 Z"/>
        </g>
        <circle cx="12" cy="12" r="1.7" fill="currentColor"/>
      </svg>
    </a>
    <a class="fab fab-call" [href]="'tel:' + supportPhone" aria-label="Llámanos" data-label="Llámanos">
      <lucide-icon name="phone" size="22" [strokeWidth]="2.4" aria-hidden="true"></lucide-icon>
    </a>
    <a class="fab fab-wa" [href]="waLink" target="_blank" rel="noopener" aria-label="WhatsApp" data-label="WhatsApp">
      <!-- Official-style WhatsApp glyph -->
      <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20.52 3.48A11.31 11.31 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.02.52 3.97 1.5 5.7L0 24l6.46-1.68A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52ZM12 21.6c-1.9 0-3.75-.51-5.37-1.49l-.38-.22-3.76.98.99-3.77-.24-.39A9.59 9.59 0 1 1 21.6 12 9.6 9.6 0 0 1 12 21.6Zm5.06-6.95c-.28-.14-1.66-.83-1.92-.93-.26-.1-.45-.14-.63.14-.18.28-.74.93-.9 1.12-.16.19-.34.22-.62.07-.28-.14-1.2-.44-2.28-1.4-.84-.75-1.4-1.67-1.57-1.96-.17-.29-.02-.44.12-.59.12-.12.28-.34.42-.5.14-.16.2-.28.28-.47.1-.19.05-.35-.02-.5-.07-.15-.66-1.57-.9-2.14-.24-.56-.48-.49-.65-.49-.17 0-.36-.02-.55-.02-.2 0-.5.07-.78.36-.27.28-1.01.98-1.01 2.41 0 1.42 1.03 2.78 1.17 2.97.14.19 2.02 3.12 4.89 4.39.68.3 1.2.47 1.61.61.68.22 1.29.18 1.77.11.54-.08 1.66-.69 1.9-1.35.23-.66.23-1.23.16-1.35-.07-.12-.26-.2-.54-.34Z"/>
      </svg>
    </a>
  </div>
  `
})
export class LandingPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  products$ = this.api.getProducts();
  readonly waNumber = '5215555555555';
  readonly waLink = `https://wa.me/${this.waNumber}?text=${encodeURIComponent('Hola, quiero una cotización de llantas')}`;
  readonly supportPhone = '5555555555';
  readonly supportPhoneDisplay = '(55) 5555 5555';
  brandLogos: Brand[] = [];
  readonly fallbackBrandLogo = '/assets/brand/roue-mark2.svg';

  // Carousel state
  slides = [
    { src: '/assets/main-header/slider1.jpg', alt: 'Promoción 1' },
    { src: '/assets/main-header/slider2.jpg', alt: 'Promoción 2' },
    { src: '/assets/main-header/slider3.jpg', alt: 'Promoción 3' },
    { src: '/assets/main-header/slider4.jpg', alt: 'Promoción 4' },
  ];
  currentSlide = 0;
  progressPct = 0; // 0..100
  readonly slideDurationMs = 5000;
  #timer: any = null;
  paused = false;

  constructor() {
    this.#startTimer(true);
  }

  ngOnInit(): void {
    this.api.getBrands().subscribe({
      next: brands => {
        this.brandLogos = brands;
        this.brands = brands.map(b => b.name);
      },
      error: () => {
        this.brandLogos = [];
        this.brands = [];
      }
    });
  }

  ngOnDestroy(): void { this.#stopTimer(); }

  #startTimer(reset: boolean) {
    this.#stopTimer();
    const step = 100; // ms
    if (reset) this.progressPct = 0;
    this.#timer = setInterval(() => {
      this.progressPct += (step / this.slideDurationMs) * 100;
      if (this.progressPct >= 100) {
        this.nextSlide();
      }
    }, step);
  }

  #stopTimer() { if (this.#timer) { clearInterval(this.#timer); this.#timer = null; } }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.progressPct = 0;
  }

  barWidth(i: number): string {
    if (i < this.currentSlide) return '100%';
    if (i > this.currentSlide) return '0%';
    return `${Math.min(100, Math.max(0, this.progressPct))}%`;
  }
  trackByIndex(i: number) { return i; }

  // Pause/Resume controls
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.#stopTimer();
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.#startTimer(false);
  }
  // tap-to-toggle could be implemented if desired, but pointerdown/up gives press-to-pause UX

  widths = [165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315];
  aspects = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
  rims = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  size: { width?: number; aspect?: number; rim?: number } = {};

  // Landing hero filters (for UX; concatenated into a query string)
  brands: string[] = [];
  years = Array.from({ length: 26 }, (_, i) => 2000 + i);
  filters: { brand?: string; year?: number; price?: string } = {};

  onSearch(q: string) {
    const t = (q || '').trim();
    this.products$ = this.api.getProducts(t || undefined);
  }

  trackById(_: number, p: Product) { return p.id; }
  trackBrandId(_: number, brand: Brand) { return brand.id; }

  onBrandImageError(evt: Event) {
    const target = evt.target as HTMLImageElement | null;
    if (!target) return;
    if (target.src !== this.fallbackBrandLogo) {
      target.src = this.fallbackBrandLogo;
      return;
    }
  }

  onSizeSearch() {
    if (!this.size.width || !this.size.aspect || !this.size.rim) return;
    const q = `${this.size.width}/${this.size.aspect}R${this.size.rim}`;
    this.goToShop(q);
  }

  resetSize() { this.size = {}; }

  onBrandQuick(brand: string) {
    const b = (brand || '').trim();
    if (!b) return;
    this.filters.brand = b;
    this.router.navigate(['/shop'], { queryParams: { brand: b } });
  }

  goToShop(q?: string) {
    const params: any = {};
    const t = (q || '').trim();
    if (t) params.q = t;
    if (this.filters.brand) params.brand = this.filters.brand;
    this.router.navigate(['/shop'], { queryParams: params });
  }

  submitSearch(keyword: string) {
    const parts = [(keyword || '').trim()]
      .concat(this.filters.brand ? [this.filters.brand] : [])
      .concat(this.filters.year ? [String(this.filters.year)] : [])
      .concat(this.filters.price ? [this.filters.price] : [])
      .filter(Boolean) as string[];
    const q = parts.join(' ');
    this.goToShop(q);
  }

  applyCoupon(code: string) {
    const t = (code || '').trim();
    if (!t) return;
    alert(`Cupón "${t}" se aplicará en el checkout.`);
  }
}

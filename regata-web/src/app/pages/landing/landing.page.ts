import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, AsyncPipe, SlicePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, AsyncPipe, SlicePipe, ProductCardComponent, FormsModule],
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

    /* Promo carousel (CSS-only auto-scroll) */
    .promo-carousel { overflow: hidden; border-radius: .75rem; }
    .promo-track { display: flex; width: max-content; animation: promo-scroll 24s linear infinite; }
    .promo-item { position: relative; min-width: 100%; }
    .promo-item img { width: 100%; height: 320px; object-fit: cover; display: block; }
    .promo-caption { position: absolute; inset: auto 0 0 0; padding: 1rem 1.25rem; color: #fff; background: linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,0)); }
    @keyframes promo-scroll {
      0% { transform: translateX(0); }
      33% { transform: translateX(0); }
      40% { transform: translateX(-100%); }
      73% { transform: translateX(-100%); }
      80% { transform: translateX(-200%); }
      100% { transform: translateX(-200%); }
    }

    /* Generic boxes */
    .feature { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; }
    .category-tile { border-radius: .75rem; overflow: hidden; position: relative; background: #f8f9fa; min-height: 160px; }
    .category-tile a { position: absolute; inset: 0; }
    .category-tile h5 { position: absolute; left: 1rem; bottom: 1rem; margin: 0; }
    .trust-logos img { max-height: 28px; opacity: .9; }

    .service-card { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; padding: 1rem; height: 100%; }
    .brand-logos img { max-height: 38px; filter: grayscale(1) contrast(.9); opacity: .85; }
    .brand-logos img:hover { filter: none; opacity: 1; }
    .cashback { border-radius: .75rem; background: linear-gradient(135deg, #111 0%, #1e1e1e 60%, #2a2a2a 100%); color: #fff; overflow: hidden; }
    .coupon-card { border-radius: .75rem; border: 2px dashed #e0e0e0; background: #fff; }
    .info-split { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; }

    /* Floating WhatsApp */
    .floating-wa { position: fixed; right: 16px; bottom: 16px; z-index: 1050; }
    .floating-wa .btn-wa {
      display: inline-flex; align-items: center; gap: .5rem;
      background: #25D366; border: none; color: #fff; padding: .75rem 1rem;
      border-radius: 999px; box-shadow: 0 6px 18px rgba(0,0,0,.2); text-decoration: none; font-weight: 600;
    }
    .floating-wa svg { flex: 0 0 auto; }

    /* Responsive tweaks */
    @media (min-width: 992px) {
      .search-panel { padding: 1.25rem 1.5rem; }
    }
  `],
  template: `
  <!-- Hero with search panel -->
  <header class="hero py-4 py-lg-5 mb-4">
    <div class="container">
      <div class="row align-items-center g-4">
        <!-- Left: Title + search -->
        <div class="col-12 col-lg-7">
          <h1 class="display-6 fw-bold mb-3">Encuentra tu llanta ideal</h1>
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
                <button class="btn btn-dark btn-lg" (click)="submitSearch(kw.value)">Buscar</button>
              </div>
            </div>
          </div>

          <div class="row g-2 mt-3">
            <div class="col-4">
              <div class="pill">20%<small>OFF</small></div>
            </div>
            <div class="col-4">
              <div class="pill">Envío<small>Gratis</small></div>
            </div>
            <div class="col-4">
              <div class="pill">6 MSI<small>Financiamiento</small></div>
            </div>
          </div>
        </div>

        <!-- Right: hero image -->
        <div class="col-12 col-lg-5 text-center">
          <img src="/assets/pzero-1_80.jpg" alt="llanta" class="hero-img border rounded-3 bg-body"/>
        </div>
      </div>
    </div>
  </header>

  <!-- Promo carousel -->
  <section class="container mb-4">
    <div class="promo-carousel border">
      <div class="promo-track">
        <div class="promo-item">
          <img src="https://dummyimage.com/1200x320/222/ffffff&text=4x3+en+marcas+selectas" alt="Promoción 4x3 en marcas selectas"/>
          <div class="promo-caption">
            <div class="h5 m-0">4x3 en marcas selectas</div>
            <small>Aprovecha hasta agotar existencias</small>
          </div>
        </div>
        <div class="promo-item">
          <img src="https://dummyimage.com/1200x320/1a1a1a/ffffff&text=Cashback+en+tu+primera+compra" alt="Cashback en tu primera compra"/>
          <div class="promo-caption">
            <div class="h5 m-0">Cashback en tu primera compra</div>
            <small>Regístrate y recibe saldo</small>
          </div>
        </div>
        <div class="promo-item">
          <img src="https://dummyimage.com/1200x320/2a2a2a/ffffff&text=Instalaci%C3%B3n+a+domicilio" alt="Instalación a domicilio"/>
          <div class="promo-caption">
            <div class="h5 m-0">Instalación a domicilio</div>
            <small>Agenda en el horario que prefieras</small>
          </div>
        </div>
      </div>
    </div>
  </section>

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
  <section class="container mb-5 brand-logos">
    <h2 class="h4 mb-3">Marcas</h2>
    <div class="d-flex flex-wrap gap-4 align-items-center">
      <img src="https://dummyimage.com/120x38/ddd/999&text=Pirelli" alt="Pirelli"/>
      <img src="https://dummyimage.com/120x38/ddd/999&text=Michelin" alt="Michelin"/>
      <img src="https://dummyimage.com/120x38/ddd/999&text=Bridgestone" alt="Bridgestone"/>
      <img src="https://dummyimage.com/120x38/ddd/999&text=Goodyear" alt="Goodyear"/>
      <img src="https://dummyimage.com/120x38/ddd/999&text=Continental" alt="Continental"/>
      <img src="https://dummyimage.com/120x38/ddd/999&text=Dunlop" alt="Dunlop"/>
    </div>
  </section>

  <!-- Coupons / promos -->
  <section class="container mb-5">
    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <div class="coupon-card p-4 h-100 d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-3">
          <div class="flex-fill">
            <div class="h5 m-0">Cupones promocionales</div>
            <small class="text-muted">Aplica tu cupón al pagar. Ej.: REGATA10</small>
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
          <a href="tel:5555555555" class="text-decoration-none">(55) 5555 5555</a>
        </div>
        <div>
          <div class="fw-bold">Correo:</div>
          <a href="mailto:hola@regata.mx" class="text-decoration-none">hola@regata.mx</a>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3">
        <a href="https://facebook.com/regata" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">Facebook</a>
        <a href="https://instagram.com/regata" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">Instagram</a>
        <a href="https://t.me/regata" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">Telegram</a>
      </div>
    </div>
  </section>

  <!-- Floating WhatsApp button -->
  <div class="floating-wa">
    <a class="btn-wa" [href]="waLink" target="_blank" rel="noopener" aria-label="WhatsApp">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.52 3.48C18.38 1.34 15.77.2 12.99.2 6.53.2 1.3 5.43 1.3 11.89c0 2.1.55 4.1 1.61 5.89L.2 23.8l6.2-2.65c1.71.93 3.64 1.42 5.61 1.42 6.46 0 11.69-5.23 11.69-11.69 0-2.78-1.14-5.39-3.28-7.53Zm-7.53 18.1c-1.77 0-3.5-.48-5.01-1.39l-.36-.21-3.68 1.57 1.57-3.68-.22-.36a9.52 9.52 0 0 1-1.39-5c0-5.29 4.3-9.59 9.59-9.59 2.56 0 4.96.99 6.76 2.79 1.8 1.8 2.79 4.2 2.79 6.76 0 5.29-4.3 9.59-9.59 9.59Zm5.27-7.21c-.29-.15-1.72-.85-1.99-.95-.27-.1-.47-.15-.67.15-.2.29-.77.95-.94 1.14-.17.2-.35.22-.64.07-.29-.15-1.23-.45-2.34-1.43-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.45.13-.6.13-.13.29-.35.44-.52.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.18-.24-.58-.49-.5-.67-.5-.17 0-.37-.02-.57-.02-.2 0-.52.07-.8.37-.27.29-1.04 1-1.04 2.45 0 1.44 1.06 2.83 1.21 3.02.15.2 2.08 3.17 5.03 4.45.7.3 1.24.48 1.66.62.7.22 1.33.19 1.83.12.56-.08 1.72-.7 1.97-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.2-.56-.35Z" fill="currentColor"/>
      </svg>
      Whatsapp
    </a>
  </div>
  `
})
export class LandingPage {
  private api = inject(ApiService);
  private router = inject(Router);
  products$ = this.api.getProducts();
  readonly waNumber = '5215555555555';
  readonly waLink = `https://wa.me/${this.waNumber}?text=${encodeURIComponent('Hola, quiero una cotización de llantas')}`;

  widths = [165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315];
  aspects = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
  rims = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  size: { width?: number; aspect?: number; rim?: number } = {};

  // Landing hero filters (for UX; concatenated into a query string)
  brands = ['Pirelli', 'Michelin', 'Bridgestone', 'Goodyear', 'Continental'];
  years = Array.from({ length: 26 }, (_, i) => 2000 + i);
  filters: { brand?: string; year?: number; price?: string } = {};

  onSearch(q: string) {
    this.products$ = this.api.getProducts(q?.trim() || undefined);
  }

  trackById(_: number, p: Product) { return p.id; }

  onSizeSearch() {
    if (!this.size.width || !this.size.aspect || !this.size.rim) return;
    const q = `${this.size.width}/${this.size.aspect}R${this.size.rim}`;
    this.goToShop(q);
  }

  resetSize() { this.size = {}; }

  goToShop(q?: string) {
    if (q && q.trim().length) {
      this.router.navigate(['/shop'], { queryParams: { q } });
    } else {
      this.router.navigate(['/shop']);
    }
  }

  submitSearch(keyword: string) {
    const parts = [keyword?.trim()]
      .concat(this.filters.brand ? [this.filters.brand] : [])
      .concat(this.filters.year ? [String(this.filters.year)] : [])
      .concat(this.filters.price ? [this.filters.price] : [])
      .filter(Boolean) as string[];
    const q = parts.join(' ');
    this.goToShop(q);
  }

  applyCoupon(code: string) {
    if (!code?.trim()) return;
    alert(`Cupón "${code.trim()}" se aplicará en el checkout.`);
  }
}

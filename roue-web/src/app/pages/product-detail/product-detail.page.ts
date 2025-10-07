import { Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, CurrencyPipe, NgFor } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../../core/models/product.model';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../state/cart.store';
import { AuthStore } from '../../state/auth.store';
import { WishlistStore } from '../../state/wishlist.store';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, RouterLink, LucideAngularModule],
  styles: [`
    :host { --viewer-h: clamp(360px, 52vh, 560px); }
    /* Breadcrumbs */
    .crumb { font-size: .9rem; color: #6c757d; }
    .crumb a { color: inherit; text-decoration: none; font-weight: 600; }
    .crumb a:hover { color: var(--jdm-red); text-decoration: underline; }
    .crumb .sep { margin: 0 .5rem; color: #c0c0c0; }
    /* Media group: rail + viewer */
    .media-wrap { display: flex; align-items: stretch; gap: .4rem; }
    .rail { display: none; }
    @media (min-width: 768px) { .rail { display: flex; flex-direction: column; gap: .25rem; width: 80px; } }
    /* Thumbnails */
    .thumb { width: 72px; height: 72px; object-fit: cover; border-radius: .5rem; cursor: pointer; border: 2px solid transparent; background: #fff; transition: transform .12s ease, border-color .12s ease; }
    .thumb.active { border-color: var(--jdm-red); box-shadow: 0 0 0 2px rgba(0,0,0,.1) inset; border-width: 3px; }
    .thumb:hover { transform: translateY(-1px); }
    .thumbs { display: flex; gap: .25rem; overflow-x: auto; padding-bottom: .25rem; }
    @media (max-width: 767.98px) { .thumb { width: 56px; height: 56px; } }

    /* Carousel viewer (self-contained, compatible with global overlays) */
    .simple-carousel { position: relative; overflow: hidden; border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; height: var(--viewer-h); }
    /* Remove global overlay for product viewer */
    .simple-carousel.plain::after { display: none !important; background: none !important; content: none !important; }
    .simple-track { display: flex; width: 100%; height: 100%; transition: transform 600ms ease; will-change: transform; }
    .simple-item { flex: 0 0 100%; height: 100%; }
    .simple-item img { width: 100%; height: 100%; display: block; object-fit: contain; background: #fff; }
    .simple-progress { position: absolute; left: 8px; right: 8px; bottom: 8px; display: flex; gap: 6px; z-index: 2; }
    .simple-progress .bar { flex: 1; height: 3px; background: rgba(0,0,0,.12); border-radius: 999px; overflow: hidden; }
    .simple-progress .fill { display: block; height: 100%; background: var(--jdm-red); width: 0%; transition: width 100ms linear; }
    @media (max-width: 767.98px) {
      .simple-carousel { height: auto; }
      .simple-item img { height: auto; }
    }

    /* Specs card matching general look */
    .specs { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; }
    .specs .table { margin: 0; --bs-table-color: inherit; font-size: .95rem; border-collapse: separate; border-spacing: 0; }
    .specs .table th { width: 34%; color: #6c757d; font-weight: 600; background: rgba(0,0,0,.02); }
    .specs .table > :not(caption) > * > * { padding: .65rem .75rem; }
    .specs .table tr td, .specs .table tr th { border-top: 1px solid rgba(0,0,0,.06); }
    .specs .table tr:first-child td, .specs .table tr:first-child th { border-top: none; }
    /* Neutralize Bootstrap striped accent to use our own backgrounds */
    .specs .table.table-striped > tbody > tr:nth-of-type(odd) > * { --bs-table-accent-bg: transparent; }
    .specs .table tbody tr:nth-child(odd) td { background: #fafafa; }
    .specs .table tbody tr:nth-child(even) td { background: #ffffff; }

    /* Dark theme adjustments */
    :host-context([data-bs-theme="dark"]) .specs { background: #0f0f0f; border-color: #2a2a2a; }
    :host-context([data-bs-theme="dark"]) .specs .table th { color: #b3bac5; background: #161616; }
    :host-context([data-bs-theme="dark"]) .specs .table td { color: #e6e6e6; }
    :host-context([data-bs-theme="dark"]) .specs .table tr td, :host-context([data-bs-theme="dark"]) .specs .table tr th { border-color: #222; }
    :host-context([data-bs-theme="dark"]) .specs .table tbody tr:nth-child(odd) td { background: #121212; }
    :host-context([data-bs-theme="dark"]) .specs .table tbody tr:nth-child(even) td { background: #0e0e0e; }

    .qty { width: 100px; }
    .product-title { font-family: var(--font-display); letter-spacing: .02em; }
    .btn-ico { display: inline-flex; align-items: center; gap: .5rem; }
    .btn-ico lucide-icon { flex: 0 0 auto; }
  `],
  template: `
  <section class="container my-4" *ngIf="product; else loading">
    <nav class="crumb mb-3" aria-label="breadcrumbs">
      <a routerLink="/">Inicio</a>
      <span class="sep">›</span>
      <a routerLink="/shop">Llanta</a>
      <span class="sep">›</span>
      <span>{{ title() }}</span>
    </nav>
    <div class="row g-4 align-items-start">
      <!-- Media group: rail + viewer (same column to remove extra gutter) -->
      <div class="col-12 col-md-8">
        <div class="media-wrap">
          <div class="rail" aria-label="Miniaturas">
            <img *ngFor="let src of images(); let i = index" [src]="src" class="thumb" [class.active]="i===idx()" (click)="select(i)" (mouseenter)="preview(i)" (mouseleave)="endPreview()" [attr.aria-selected]="i===idx()" alt="Vista {{i+1}}"/>
          </div>
          <div class="flex-fill">
            <div #viewerEl class="simple-carousel plain" [attr.data-paused]="paused() ? 'true' : null" (pointerenter)="pause()" (pointerleave)="resume()" aria-roledescription="Carrusel" aria-label="Imágenes del producto">
              <div class="simple-track" [style.transform]="trackTransform()">
                <div class="simple-item" *ngFor="let src of images(); let i = index">
                  <img [src]="src" [alt]="title() + ' imagen ' + (i+1)" (load)="imageLoaded()"/>
                </div>
              </div>
              <div class="simple-progress">
                <span class="bar" *ngFor="let s of images(); let i = index"><i class="fill" [style.width.%]="progress(i)"></i></span>
              </div>
            </div>
            <!-- Thumbs (mobile) -->
            <div class="thumbs d-md-none mt-2" aria-label="Miniaturas móviles">
              <img *ngFor="let src of images(); let i = index" [src]="src" class="thumb" [class.active]="i===idx()" (click)="select(i)" (mouseenter)="preview(i)" (mouseleave)="endPreview()" alt="Vista {{i+1}}"/>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: info / price / actions -->
      <div #panelEl class="col-12 col-md-4 col-lg-4">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h2 class="mb-0 product-title">{{ title() }}</h2>
          <picture>
            <source [attr.srcset]="product.brandLogoUrl || '/assets/brand/roue-mark2.svg'" type="image/svg+xml" />
            <img src="/favicon.ico" width="100" height="48" alt="marca" />
          </picture>
        </div>
        <div class="text-muted small">SKU {{ product!.sku }}</div>
        <hr/>
        <div class="d-flex align-items-center gap-3 mb-2">
          <h3 class="m-0 text-primary">{{ product!.price | currency:'MXN' }}</h3>
          <span class="badge bg-warning text-dark" *ngIf="savingsPct()>0">¡Ahorre {{ savingsPct() }}%!</span>
        </div>
        <div class="text-muted mb-3">IVA Incluido</div>
        <div class="d-flex align-items-center gap-2 flex-wrap mb-3">
          <div class="d-flex align-items-center gap-2">
            <label class="text-muted">Cantidad</label>
            <div class="input-group qty">
              <button class="btn btn-outline-secondary" type="button" (click)="dec()">−</button>
              <input class="form-control text-center" [value]="qty()" readonly />
              <button class="btn btn-outline-secondary" type="button" (click)="inc()" [disabled]="product!.stock && qty()>=product!.stock!">+</button>
            </div>
          </div>
          <div class="text-muted" *ngIf="product!.stock!==undefined">En Stock: {{ product!.stock }}</div>
        </div>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button class="btn btn-warning fw-bold btn-ico" (click)="addToCart()">
            <lucide-icon name="shopping-cart" size="18" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
            <span>Añadir al carrito</span>
          </button>
          <button class="btn btn-primary btn-ico" (click)="buyNow()">
            <lucide-icon name="credit-card" size="18" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
            <span>Comprar ahora</span>
          </button>
          <button class="btn btn-outline-secondary btn-ico" *ngIf="auth.isAuthenticated()" (click)="saveForLater()">
            <lucide-icon name="heart" size="18" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
            <span>Guardar</span>
          </button>
        </div>

        <div #specsEl class="specs mt-3">
          <table class="table table-sm table-striped align-middle">
            <tbody>
              <tr><th class="w-25">Marca</th><td class="text-uppercase">{{ product!.brand }}</td></tr>
              <tr><th>Modelo</th><td>{{ product!.modelName }}</td></tr>
              <tr><th>Tamaño</th><td>{{ product!.size }}</td></tr>
              <tr><th>Categoría</th><td>{{ product!.category || '—' }}</td></tr>
              <tr *ngIf="product!.tire"><th>Tipo</th><td>{{ product!.tire.type || '—' }}</td></tr>
              <tr *ngIf="product!.tire"><th>Rango carga</th><td>{{ product!.tire.loadIndex || '—' }}</td></tr>
              <tr *ngIf="product!.tire"><th>Rango Velocidad</th><td>{{ product!.tire.speedRating || '—' }}</td></tr>
              <ng-container *ngIf="product!.rim">
                <tr><th>Diámetro</th><td>{{ product!.rim.diameterIn || '—' }} in</td></tr>
                <tr><th>Ancho</th><td>{{ product!.rim.widthIn || '—' }} in</td></tr>
                <tr><th>Patrón</th><td>{{ product!.rim.boltPattern || '—' }}</td></tr>
                <tr><th>Offset</th><td>{{ product!.rim.offsetMm || '—' }} mm</td></tr>
                <tr><th>Centro</th><td>{{ product!.rim.centerBoreMm || '—' }} mm</td></tr>
                <tr><th>Material</th><td>{{ product!.rim.material || '—' }}</td></tr>
                <tr><th>Acabado</th><td>{{ product!.rim.finish || '—' }}</td></tr>
              </ng-container>
              <tr><th>Ancho</th><td>{{ parsed().width || '—' }}</td></tr>
              <tr><th>Alto</th><td>{{ parsed().aspect || '—' }}</td></tr>
              <tr><th>Rin</th><td>{{ parsed().rim || '—' }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>

  <ng-template #loading>
    <div class="container my-4"><div class="alert alert-info">Cargando producto…</div></div>
  </ng-template>
  `
})
export class ProductDetailPage implements OnInit, OnDestroy, AfterViewInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cart = inject(CartStore);
  private host = inject(ElementRef<HTMLElement>);
  auth = inject(AuthStore);
  private wishlist = inject(WishlistStore);
  product?: Product;
  idx = signal(0);
  qty = signal(1);
  images = signal<string[]>(['/assets/pzero-1_80.jpg','/assets/pzero-1_80.jpg','/assets/pzero-1_80.jpg']);
  title = computed(() => this.product ? `${this.product.brand} ${this.product.modelName} ${this.product.size}` : '');
  // autoplay
  readonly autoMs = 5500;
  private t: any = null;
  private tick: any = null;
  paused = signal(false);
  private autoDisabled = false;
  elapsed = signal(0);
  trackTransform = () => `translate3d(-${this.idx()*100}%,0,0)`;
  // When autoplay is disabled and this is the active slide, keep bar full
  // (visual cue of selection)
  // Override progress method to account for disabled state
  // Note: keeping compatibility with existing bindings
  progress = (i: number) => {
    if (i === this.idx() && this.autoDisabled) return 100;
    return i === this.idx() ? Math.min(100, Math.round(this.elapsed() / this.autoMs * 100)) : 0;
  };

  @ViewChild('viewerEl') viewerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('specsEl') specsRef?: ElementRef<HTMLDivElement>;
  @ViewChild('panelEl') panelRef?: ElementRef<HTMLDivElement>;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getProduct(id).subscribe(p => {
      this.product = p;
      if (p.images && p.images.length) this.images.set(p.images);
      setTimeout(() => this.equalizeHeights(), 0);
    });
    this.startAutoplay();
  }
  ngAfterViewInit() { setTimeout(() => this.equalizeHeights(), 0); }
  ngOnDestroy() { this.stopAutoplay(); }

  select(i: number) {
    if (i>=0 && i < this.images().length) {
      this.idx.set(i);
      this.disableAutoplay();
      this.elapsed.set(this.autoMs); // fill progress bar fully
    }
  }
  preview(i: number) {
    if (i>=0 && i < this.images().length) {
      this.idx.set(i);
      this.paused.set(true); // pause while hovering thumbnails
      this.elapsed.set(this.autoMs); // fill bar fully on hover
    }
  }
  endPreview() { if (!this.autoDisabled) this.paused.set(false); }
  inc() { this.qty.set(Math.min((this.product?.stock ?? Number.MAX_SAFE_INTEGER), this.qty()+1)); }
  dec() { this.qty.set(Math.max(1, this.qty()-1)); }
  addToCart() { if (this.product) this.cart.add(this.product, this.qty()); }
  buyNow() { this.addToCart(); window.location.href = '/checkout'; }
  saveForLater() { if (this.product) this.wishlist.add(this.product.id); }

  parsed() {
    const size = this.product?.size || '';
    const m = size.match(/(\d{3})\/(\d{2})\s*R?(\d{2})/i);
    if (!m) return { width: null, aspect: null, rim: null } as any;
    return { width: Number(m[1]), aspect: Number(m[2]), rim: Number(m[3]) } as any;
  }
  productType(): string | null { return this.product?.tire?.type ?? null; }
  loadIndex(): string | null { return this.product?.tire?.loadIndex ?? null; }
  speedRating(): string | null { return this.product?.tire?.speedRating ?? null; }
  savingsPct() { return 0; }

  // autoplay helpers
  pause() { this.paused.set(true); }
  resume() { if (!this.autoDisabled) this.paused.set(false); }
  private startAutoplay() {
    this.stopAutoplay();
    this.tick = setInterval(() => {
      if (!this.paused()) {
        const next = this.elapsed() + 120;
        if (next >= this.autoMs) { this.nextSlide(); this.elapsed.set(0); }
        else this.elapsed.set(next);
      }
    }, 120);
  }
  private stopAutoplay() { if (this.tick) { clearInterval(this.tick); this.tick = null; } }
  private nextSlide() { const n = (this.idx() + 1) % Math.max(1, this.images().length); this.idx.set(n); }
  private disableAutoplay() { this.autoDisabled = true; this.paused.set(true); this.stopAutoplay(); }
  private enableAutoplay() { this.autoDisabled = false; this.elapsed.set(0); this.paused.set(false); this.startAutoplay(); }

  // equal heights (desktop only)
  @HostListener('window:resize') onResize() { this.equalizeHeights(); }
  imageLoaded() { this.equalizeHeights(); }
  private equalizeHeights() {
    const viewer = this.viewerRef?.nativeElement; const panel = this.panelRef?.nativeElement;
    if (!viewer || !panel) return;
    if (window.innerWidth < 768) { viewer.style.height = 'auto'; return; }
    const h = panel.offsetHeight || 0;
    if (h > 0) viewer.style.height = h + 'px';
  }

  // Click en documento para restablecer autoplay si fue deshabilitado manualmente
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    // Si el click no proviene de una miniatura, reactivar autoplay
    if (this.autoDisabled && !target.closest('.thumb')) {
      this.enableAutoplay();
    }
  }
}

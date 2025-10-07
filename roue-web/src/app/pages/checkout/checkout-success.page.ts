import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { OrdersService, OrderDetail } from '../../core/orders.service';
import { CartStore } from '../../state/cart.store';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, RouterLink],
  styles: [`
    :host { display: block; }
    .hero { position: relative; overflow: hidden; color: #fff; border-radius: clamp(1.5rem, 6vw, 2.5rem); padding: clamp(3rem, 8vw, 4.5rem) 0; background: radial-gradient(140% 140% at 15% 10%, rgba(217, 66, 66, 0.9), rgba(17, 24, 39, 0.95)); box-shadow: 0 28px 48px rgba(15, 23, 42, 0.35); }
    .hero::after { content: ''; position: absolute; inset: -10%; background: radial-gradient(circle at 20% 20%, rgba(255,255,255,.22), transparent 40%), radial-gradient(circle at 80% 10%, rgba(216, 180, 254, .25), transparent 45%), radial-gradient(circle at 50% 80%, rgba(45, 212, 191, .24), transparent 40%); opacity: .45; }
    .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .confetti span { position: absolute; width: 8px; height: 16px; border-radius: 3px; opacity: .8; animation: fall var(--dur) linear infinite; mix-blend-mode: screen; }
    .confetti span:nth-child(odd) { background: rgba(255,255,255,.8); }
    .confetti span:nth-child(even) { background: rgba(251, 191, 36, 0.9); }
    .confetti span:nth-child(3n) { background: rgba(59, 130, 246, 0.85); }
    @keyframes fall { 0% { transform: translate3d(var(--x,0), -120%, 0) rotate(0deg); opacity: .85; } 60% { opacity: .9; } 100% { transform: translate3d(calc(var(--x,0) + 15px), 120%, 0) rotate(160deg); opacity: 0; } }
    .hero-content { position: relative; z-index: 1; }
    .hero .badge { background: rgba(255, 255, 255, 0.18); border: 1px solid rgba(255, 255, 255, 0.35); letter-spacing: .12em; }
    .cta-group { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; }
    .summary-card { border-radius: 1.5rem; border: 1px solid rgba(15,23,42,.08); box-shadow: 0 18px 42px rgba(15,23,42,.12); }
    .items-card { border-radius: 1.5rem; border: 1px solid rgba(148,163,184,.18); }
    .items-card table { margin: 0; }
    .items-card thead { background: rgba(15, 23, 42, .03); }
    .next-steps { border-radius: 1.25rem; background: rgba(15,23,42,.04); border: 1px dashed rgba(148,163,184,.45); }
    :host-context([data-bs-theme='dark']) .summary-card { background: rgba(15,23,42,.65); border-color: rgba(255,255,255,.08); box-shadow: 0 25px 52px rgba(0,0,0,.55); }
    :host-context([data-bs-theme='dark']) .items-card { background: rgba(15,23,42,.55); border-color: rgba(255,255,255,.08); }
    :host-context([data-bs-theme='dark']) .items-card thead { background: rgba(255,255,255,.04); }
    :host-context([data-bs-theme='dark']) .next-steps { background: rgba(15,23,42,.55); border-color: rgba(148,163,184,.35); }
  `],
  template: `
  <section class="container my-4 checkout-success">
    <div class="hero mb-4">
      <div class="confetti" aria-hidden="true">
        <span *ngFor="let _ of confetti; let i = index" [style.left.%]="(i * 7) % 100" [style.--x]="(i % 2 === 0 ? -20 : 10) + 'px'" [style.--dur]="(5 + (i % 5)) + 's'"></span>
      </div>
      <div class="hero-content text-center container">
        <span class="badge text-uppercase mb-3">Pago confirmado</span>
        <h1 class="display-5 fw-bold mb-3">¡Felicidades, tu pedido está en marcha!</h1>
        <p class="lead mb-4">Tu orden{{ orderId() ? ' #' + orderId() : '' }} ha sido recibida y te enviamos un correo con toda la información. Nuestro equipo ya prepara el envío.</p>
        <div class="cta-group">
          <a class="btn btn-light btn-lg" [routerLink]="orderId() ? ['/orders', orderId()] : ['/perfil']">Ver pedido</a>
          <a class="btn btn-outline-light btn-lg" routerLink="/shop">Seguir comprando</a>
        </div>
      </div>
    </div>

    <ng-container *ngIf="!loading(); else loadingTpl">
      <div *ngIf="order(); else errorTpl">
        <div class="row g-4">
          <div class="col-12 col-xl-8">
            <div class="items-card card">
              <div class="card-header border-0 pb-0">
                <h2 class="h5 m-0">Resumen de artículos</h2>
                <p class="text-muted small mb-0">Estos productos quedan apartados para ti durante el proceso de envío.</p>
              </div>
              <div class="card-body pt-3">
                <div class="table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr><th>Producto</th><th class="text-center" style="width:120px;">Cantidad</th><th class="text-end" style="width:140px;">Precio</th><th class="text-end" style="width:140px;">Importe</th></tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of order()!.items">
                        <td>
                          <div class="fw-semibold">{{ item.productName }}</div>
                          <div class="text-muted small">SKU {{ item.productSku }}</div>
                        </td>
                        <td class="text-center">{{ item.quantity }}</td>
                        <td class="text-end">{{ item.unitPrice | currency:order()!.currency }}</td>
                        <td class="text-end">{{ item.lineTotal | currency:order()!.currency }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-xl-4 d-flex flex-column gap-3">
            <div class="summary-card card">
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Número de pedido</span><span class="fw-semibold">{{ order()!.id }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Fecha</span><span>{{ order()!.createdAtUtc | date:'medium' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Estado</span>
                  <span class="badge text-bg-success" *ngIf="order()!.paymentStatus === 'Succeeded'; else pending">
                    Pagado
                  </span>
                  <ng-template #pending><span class="badge text-bg-warning text-dark">{{ order()!.paymentStatus }}</span></ng-template>
                </div>
                <hr />
                <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span>{{ order()!.subtotal | currency:order()!.currency }}</span></div>
                <div class="d-flex justify-content-between mb-2" *ngIf="order()!.discountAmount>0"><span>Descuento</span><span class="text-success">−{{ order()!.discountAmount | currency:order()!.currency }}</span></div>
                <div class="d-flex justify-content-between mb-2"><span>Envío</span><span>{{ order()!.shippingCost | currency:order()!.currency }}</span></div>
                <div class="d-flex justify-content-between fw-bold pt-2 border-top"><span>Total pagado</span><span>{{ order()!.total | currency:order()!.currency }}</span></div>
              </div>
            </div>
            <div class="card p-3">
              <div class="fw-semibold mb-1">Dirección de envío</div>
              <ng-container *ngIf="order()!.shipping.line1; else noShipping">
                <div>{{ order()!.shipping.line1 }}</div>
                <div *ngIf="order()!.shipping.line2">{{ order()!.shipping.line2 }}</div>
                <div class="text-muted small">{{ order()!.shipping.city }}, {{ order()!.shipping.state }} {{ order()!.shipping.postalCode }}</div>
                <div class="text-muted small">{{ order()!.shipping.country }}</div>
              </ng-container>
              <ng-template #noShipping><div class="text-muted small">Guardaremos la dirección cuando completes tu perfil.</div></ng-template>
            </div>
            <div class="card p-3" *ngIf="order()!.shipping.trackingCode || order()!.shipping.trackingCarrier || order()!.shipping.shippedAtUtc; else trackingPlaceholder">
              <div class="fw-semibold mb-1">Seguimiento</div>
              <div class="mb-1">Paquetería: <strong>{{ order()!.shipping.trackingCarrier || '—' }}</strong></div>
              <div class="mb-1" *ngIf="order()!.shipping.trackingCode">Guía: <code>{{ order()!.shipping.trackingCode }}</code></div>
              <div class="text-muted small" *ngIf="order()!.shipping.shippedAtUtc">Enviado el {{ order()!.shipping.shippedAtUtc | date:'medium' }}</div>
            </div>
            <ng-template #trackingPlaceholder>
              <div class="card p-3">
                <div class="fw-semibold mb-1">Seguimiento</div>
                <div class="text-muted small">Te avisaremos cuando tengamos la guía de envío.</div>
              </div>
            </ng-template>
            <div class="next-steps p-3">
              <h3 class="h6 fw-semibold">Próximos pasos</h3>
              <ul class="list-unstyled text-muted small mb-0">
                <li>• Recibirás un correo con la confirmación y factura.</li>
                <li>• Te avisaremos cuando el pedido salga a ruta.</li>
                <li>• Puedes administrar tus direcciones desde el perfil.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  </section>

  <ng-template #loadingTpl>
    <div class="alert alert-info">Cargando detalles de tu pedido…</div>
  </ng-template>
  <ng-template #errorTpl>
    <div class="alert alert-warning">
      {{ error() || 'No pudimos recuperar el pedido. Revisa tu historial en el perfil.' }}
    </div>
    <a class="btn btn-outline-dark" routerLink="/perfil">Ver mis pedidos</a>
  </ng-template>
  `
})
export class CheckoutSuccessPage implements OnInit {
  #route = inject(ActivatedRoute);
  #orders = inject(OrdersService);
  #cart = inject(CartStore);

  order = signal<OrderDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  orderId = computed(() => this.order()?.id ?? this.#route.snapshot.queryParamMap.get('orderId'));
  confetti = Array.from({ length: 18 });

  ngOnInit() {
    this.#route.queryParamMap.subscribe(params => {
      const id = params.get('orderId');
      if (!id) {
        this.loading.set(false);
        this.error.set('No encontramos el número de pedido.');
        return;
      }
      this.fetchOrder(id);
    });
  }

  private fetchOrder(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.order.set(null);
    this.#orders.getById(id).subscribe({
      next: (res) => {
        this.order.set(res);
        this.loading.set(false);
        // Refresh cart snapshot so the UI refleja carrito vacío después de la compra
        try { this.#cart.reload(); } catch { }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Ocurrió un error al obtener el pedido.');
      }
    });
  }
}

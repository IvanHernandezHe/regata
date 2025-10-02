import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { AuthStore } from '../../../state/auth.store';
import { ActivatedRoute, Router } from '@angular/router';
import { CartStore } from '../../../state/cart.store';
import { CartService } from '../../../core/cart.service';

@Component({
  standalone: true,
  selector: 'app-auth-widget',
  imports: [FormsModule, NgIf],
  styles: [`
    .auth-card { border-radius: 1.25rem; border: 1px solid rgba(15,23,42,.08); box-shadow: 0 18px 36px rgba(15,23,42,.08); backdrop-filter: blur(12px); }
    .mode-tabs { display: inline-flex; border-radius: 999px; background: rgba(15,23,42,.06); padding: .35rem; }
    .mode-btn { border: 0; background: transparent; padding: .45rem 1.4rem; border-radius: 999px; font-weight: 600; color: #64748b; transition: all .18s ease; }
    .mode-btn.active { background: #111827; color: #fff; box-shadow: 0 6px 16px rgba(15,23,42,.25); }
    .form-floating > label { color: #6b7280; }
    .form-floating > .form-control { border-radius: .85rem; background: rgba(248,249,252,.84); border: 1px solid rgba(15,23,42,.08); }
    .form-floating > .form-control:focus { background: #fff; border-color: rgba(59,130,246,.35); box-shadow: none; }
    .input-affix { position: absolute; top: 50%; right: .9rem; transform: translateY(-50%); border: none; background: transparent; color: #6b7280; }
    .input-affix:hover { color: #111827; }
    .meta-row { display: flex; flex-direction: column; gap: .4rem; }
    .access-link { background: transparent; border: none; padding: 0; color: var(--jdm-red); font-weight: 600; }
    .divider { display: flex; align-items: center; gap: .75rem; color: #94a3b8; font-size: .85rem; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(148, 163, 184, .35); }
    .social-btn { border-radius: .9rem; border: 1px solid rgba(15,23,42,.12); background: #fff; padding: .65rem 1rem; font-weight: 600; display: inline-flex; justify-content: center; align-items: center; gap: .6rem; color: #111827; }
    .social-btn:disabled { opacity: .6; }
    .status { min-height: 1.5rem; }
    .status[aria-live] { font-size: .9rem; }
    .logged-card { border-radius: 1rem; background: rgba(15,23,42,.04); border: 1px solid rgba(15,23,42,.08); }
    :host-context([data-bs-theme="dark"]) .auth-card { background: rgba(17,24,39,.78); border-color: rgba(255,255,255,.08); box-shadow: 0 18px 38px rgba(0,0,0,.45); }
    :host-context([data-bs-theme="dark"]) .mode-btn { color: #cbd5f5; }
    :host-context([data-bs-theme="dark"]) .mode-btn.active { background: #fff; color: #0f172a; }
    :host-context([data-bs-theme="dark"]) .form-floating > .form-control { background: rgba(15,23,42,.55); border-color: rgba(148,163,184,.25); color: #f8fafc; }
    :host-context([data-bs-theme="dark"]) .form-floating > .form-control:focus { background: rgba(15,23,42,.85); border-color: rgba(59,130,246,.55); }
    :host-context([data-bs-theme="dark"]) .social-btn { background: rgba(15,23,42,.65); color: #e2e8f0; border-color: rgba(148,163,184,.25); }
  `],
  template: `
  <div class="auth-card p-4 p-lg-5">
    <ng-container *ngIf="!(auth.isAuthenticated()); else logged">
      <div class="d-flex flex-column gap-4">
        <div class="text-center">
          <div class="mode-tabs" role="tablist" aria-label="Seleccionar acción">
            <button type="button" class="mode-btn" [class.active]="mode==='login'" role="tab" [attr.aria-selected]="mode==='login'" (click)="switchMode('login')">Iniciar sesión</button>
            <button type="button" class="mode-btn" [class.active]="mode==='register'" role="tab" [attr.aria-selected]="mode==='register'" (click)="switchMode('register')">Crear cuenta</button>
          </div>
          <p class="text-muted mt-3 mb-0" *ngIf="mode==='login'">Accede para sincronizar tu carrito y ver tus pedidos.</p>
          <p class="text-muted mt-3 mb-0" *ngIf="mode==='register'">Crea tu cuenta para guardar direcciones y recibir recompensas.</p>
        </div>

        <form (submit)="onSubmit($event)" class="d-grid gap-3" novalidate>
          <div class="form-floating">
            <input class="form-control" type="email" id="authEmail" placeholder="correo@ejemplo.com" [(ngModel)]="email" name="email" required [disabled]="loading" autocomplete="email" aria-required="true" />
            <label for="authEmail">Correo electrónico</label>
          </div>
          <div class="form-floating position-relative">
            <input class="form-control" [type]="passwordVisible ? 'text' : 'password'" id="authPassword" placeholder="Tu contraseña" [(ngModel)]="password" name="password" minlength="6" required [disabled]="loading" autocomplete="current-password" aria-required="true" />
            <label for="authPassword">Contraseña</label>
            <button type="button" class="input-affix" (click)="togglePasswordVisibility()" [attr.aria-label]="passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <span class="small">{{ passwordVisible ? 'Ocultar' : 'Ver' }}</span>
            </button>
          </div>
          <div class="meta-row">
            <button class="access-link align-self-start" type="button" (click)="openRecovery()">¿Olvidaste tu contraseña?</button>
          </div>
          <button class="btn btn-dark btn-lg w-100" type="submit" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span>{{ mode==='login' ? 'Entrar' : 'Registrarme' }}</span>
          </button>
          <div class="status text-danger" aria-live="polite">{{ error }}</div>
        </form>

        <div class="divider text-center">o continúa con</div>

        <div class="d-flex flex-column flex-sm-row gap-2">
          <button class="social-btn w-100" type="button" (click)="social('Google')" [disabled]="loading">
            <span class="small">Google</span>
          </button>
          <button class="social-btn w-100" type="button" (click)="social('Facebook')" [disabled]="loading">
            <span class="small">Facebook</span>
          </button>
        </div>
      </div>
    </ng-container>
    <ng-template #logged>
      <div class="logged-card p-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <div class="fw-semibold text-body">Hola, {{ auth.user()?.email }}</div>
          <small class="text-muted">Tu sesión está activa en este dispositivo.</small>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-dark" type="button" (click)="goProfile()">Ir a mi perfil</button>
          <button class="btn btn-dark" type="button" (click)="logout()" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </ng-template>
  </div>
  `
})
export class AuthWidgetComponent implements OnInit {
  auth = inject(AuthStore);
  #api = inject(AuthService);
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #cart = inject(CartStore);
  #cartApi = inject(CartService);
  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  loading = false;
  error = '';
  returnUrl: string | null = null;
  passwordVisible = false;

  ngOnInit() {
    this.#api.session().subscribe({ error: () => {} });
    const qp = this.#route.snapshot.queryParamMap;
    if (qp.get('login') === '1') this.mode = 'login';
    if (qp.get('register') === '1') this.mode = 'register';
    this.returnUrl = qp.get('returnUrl');
    this.#route.queryParamMap.subscribe(m => {
      if (m.get('login') === '1') this.mode = 'login';
      if (m.get('register') === '1') this.mode = 'register';
      this.returnUrl = m.get('returnUrl');
    });
  }

  switchMode(target: 'login' | 'register') {
    if (this.loading) return;
    this.mode = target;
    this.error = '';
  }

  togglePasswordVisibility() { this.passwordVisible = !this.passwordVisible; }

  onSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.loading = true;
    const { email, password } = this;
    const done = () => (this.loading = false);
    if (this.mode === 'login') {
      this.#api.login(email, password).subscribe({ next: () => this.#afterAuthWithCart(done), error: (err) => { this.error = this.#msg(err); done(); } });
    } else {
      this.#api.register(email, password).subscribe({
        next: () => this.#api.login(email, password).subscribe({ next: () => this.#afterAuthWithCart(done), error: (err) => { this.error = this.#msg(err); done(); } }),
        error: (err) => { this.error = this.#msg(err); done(); }
      });
    }
  }

  logout() {
    this.loading = true;
    this.#api.logout().subscribe({ next: () => (this.loading = false), error: () => (this.loading = false) });
  }

  goProfile() { this.#router.navigate(['/perfil']); }

  openRecovery() { this.#router.navigate(['/ayuda'], { queryParams: { topic: 'recuperar-cuenta' } }); }

  #msg(err: any): string {
    if (err?.error?.errors) {
      return Object.values(err.error.errors).flat().join(' ');
    }
    if (typeof err?.error === 'string') return err.error;
    return 'Ocurrió un error. Verifica tus datos.';
    }

  #afterAuthWithCart(done: () => void) {
    // merge local cart to server, then replace local with server snapshot
    const items = this.#cart.items().map(i => ({ productId: i.productId, qty: i.qty }));
    this.#cartApi.merge(items).subscribe({
      next: (res) => {
        this.#cart.replaceFromServer(res);
        this.#finishAuth(done);
      },
      error: () => this.#finishAuth(done)
    });
  }

  #finishAuth(done: () => void) {
    done();
    const url = this.returnUrl && this.returnUrl.startsWith('/') ? this.returnUrl : '/perfil';
    this.#router.navigateByUrl(url);
  }

  social(provider: 'Google'|'Facebook') {
    const returnUrl = window.location.origin + (this.returnUrl || '/perfil');
    window.location.href = `/api/auth/external/${provider}?returnUrl=${encodeURIComponent(returnUrl)}`;
  }
}

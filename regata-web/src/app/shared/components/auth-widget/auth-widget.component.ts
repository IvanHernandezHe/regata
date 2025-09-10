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
    .card { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); }
    .tabs button { border: none; background: transparent; padding: .5rem 1rem; font-weight: 600; }
    .tabs .active { color: var(--jdm-red); border-bottom: 2px solid var(--jdm-red); }
  `],
  template: `
  <div class="card p-3">
    <ng-container *ngIf="!(auth.isAuthenticated()); else logged">
      <div class="tabs d-flex gap-2 mb-2">
        <button [class.active]="mode==='login'" (click)="mode='login'">Iniciar sesión</button>
        <button [class.active]="mode==='register'" (click)="mode='register'">Crear cuenta</button>
      </div>
      <form (submit)="onSubmit($event)" class="d-grid gap-2">
        <input class="form-control" type="email" placeholder="Email" [(ngModel)]="email" name="email" required />
        <input class="form-control" type="password" placeholder="Contraseña" [(ngModel)]="password" name="password" minlength="6" required />
        <button class="btn btn-dark" type="submit" [disabled]="loading">
          {{ mode==='login' ? 'Entrar' : 'Registrarme' }}
        </button>
        <div class="text-danger small" *ngIf="error">{{error}}</div>
      </form>
      <div class="text-center my-2 text-muted">o</div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-dark w-100" (click)="social('Google')" [disabled]="loading">Google</button>
        <button class="btn btn-outline-dark w-100" (click)="social('Facebook')" [disabled]="loading">Facebook</button>
      </div>
    </ng-container>
    <ng-template #logged>
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-semibold">Hola, {{ auth.user()?.email }}</div>
          <small class="text-muted">Sesión iniciada</small>
        </div>
        <button class="btn btn-outline-secondary" (click)="logout()" [disabled]="loading">Cerrar sesión</button>
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
        this.#cart.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty })));
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

import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { AuthStore } from '../../../state/auth.store';
import { ActivatedRoute, Router } from '@angular/router';
import { CartStore } from '../../../state/cart.store';
import { CartService } from '../../../core/cart.service';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'confirm';

@Component({
  standalone: true,
  selector: 'app-auth-widget',
  imports: [FormsModule, NgIf, NgClass],
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
    .status { min-height: 1.5rem; font-size: .9rem; }
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
    <div class="status mb-3" *ngIf="status" [ngClass]="statusCss" aria-live="polite">{{ status }}</div>
    <ng-container *ngIf="!(auth.isAuthenticated()); else logged">
      <div class="d-flex flex-column gap-4">
        <div class="text-center" *ngIf="mode==='login' || mode==='register'">
          <div class="mode-tabs" role="tablist" aria-label="Seleccionar acción">
            <button type="button" class="mode-btn" [class.active]="mode==='login'" role="tab" [attr.aria-selected]="mode==='login'" (click)="setMode('login')">Iniciar sesión</button>
            <button type="button" class="mode-btn" [class.active]="mode==='register'" role="tab" [attr.aria-selected]="mode==='register'" (click)="setMode('register')">Crear cuenta</button>
          </div>
          <p class="text-muted mt-3 mb-0" *ngIf="mode==='login'">Accede para sincronizar tu carrito y ver tus pedidos.</p>
          <p class="text-muted mt-3 mb-0" *ngIf="mode==='register'">Crea tu cuenta para guardar direcciones y recibir recompensas.</p>
        </div>

        <form *ngIf="mode==='login' || mode==='register'" (submit)="onSubmit($event)" class="d-grid gap-3" novalidate>
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
            <button class="access-link align-self-start" type="button" (click)="setMode('forgot')">¿Olvidaste tu contraseña?</button>
          </div>
          <button class="btn btn-dark btn-lg w-100" type="submit" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span>{{ mode==='login' ? 'Entrar' : 'Registrarme' }}</span>
          </button>
          <div class="status text-danger" aria-live="polite">{{ error }}</div>
        </form>

        <form *ngIf="mode==='forgot'" (submit)="sendForgot($event)" class="d-grid gap-3" novalidate>
          <div>
            <h3 class="h5 mb-0">Recuperar acceso</h3>
            <p class="text-muted small">Enviaremos un enlace para restablecer tu contraseña.</p>
          </div>
          <div class="form-floating">
            <input class="form-control" type="email" id="forgotEmail" placeholder="correo@ejemplo.com" [(ngModel)]="email" name="forgotEmail" required [disabled]="forgotBusy" autocomplete="email" />
            <label for="forgotEmail">Correo electrónico</label>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-dark flex-grow-1" type="submit" [disabled]="forgotBusy">
              <span *ngIf="forgotBusy" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Enviar instrucciones
            </button>
            <button class="btn btn-outline-secondary" type="button" (click)="setMode('login')" [disabled]="forgotBusy">Cancelar</button>
          </div>
        </form>

        <form *ngIf="mode==='reset'" (submit)="submitReset($event)" class="d-grid gap-3" novalidate>
          <div>
            <h3 class="h5 mb-0">Define una nueva contraseña</h3>
            <p class="text-muted small">Ingresa y confirma tu nueva contraseña para {{ email || 'tu cuenta' }}.</p>
          </div>
          <div class="form-floating">
            <input class="form-control" type="password" id="resetPassword" placeholder="Nueva contraseña" [(ngModel)]="resetPassword" name="resetPassword" required minlength="6" [disabled]="resetBusy" autocomplete="new-password" />
            <label for="resetPassword">Nueva contraseña</label>
          </div>
          <div class="form-floating">
            <input class="form-control" type="password" id="resetConfirm" placeholder="Confirmar contraseña" [(ngModel)]="resetConfirm" name="resetConfirm" required minlength="6" [disabled]="resetBusy" autocomplete="new-password" />
            <label for="resetConfirm">Confirmar contraseña</label>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-dark flex-grow-1" type="submit" [disabled]="resetBusy">
              <span *ngIf="resetBusy" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Restablecer contraseña
            </button>
            <button class="btn btn-outline-secondary" type="button" (click)="setMode('login')" [disabled]="resetBusy">Cancelar</button>
          </div>
          <div class="status text-danger" aria-live="polite">{{ error }}</div>
        </form>

        <div *ngIf="mode==='confirm'" class="text-center d-grid gap-3">
          <h3 class="h5 mb-0">Confirmación de correo</h3>
          <p class="text-muted">Si no ves cambios inmediatos, intenta iniciar sesión nuevamente.</p>
          <button class="btn btn-dark" type="button" (click)="setMode('login')">Ir a iniciar sesión</button>
        </div>

        <div class="divider text-center" *ngIf="mode==='login' || mode==='register'">o continúa con</div>

        <div class="d-flex flex-column flex-sm-row gap-2" *ngIf="mode==='login' || mode==='register'">
          <button class="social-btn w-100" type="button" (click)="social('Google')" [disabled]="loading">
            <span class="small">Google</span>
          </button>
          <button class="social-btn w-100" type="button" (click)="social('Facebook')" [disabled]="loading">
            <span class="small">Facebook</span>
          </button>
        </div>

        <div class="text-center" *ngIf="mode==='forgot' || mode==='reset' || mode==='confirm'">
          <button class="access-link" type="button" (click)="setMode('login')">Volver a iniciar sesión</button>
        </div>
      </div>
    </ng-container>
    <ng-template #logged>
      <div class="logged-card p-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <div class="fw-semibold text-body">Hola, {{ auth.user()?.email }}</div>
          <small class="text-muted">Tu sesión está activa en este dispositivo.</small>
          <div class="mt-2" *ngIf="auth.user()?.emailConfirmed === false">
            <span class="badge text-bg-warning text-dark me-2">Correo sin confirmar</span>
            <button class="btn btn-sm btn-outline-dark" type="button" (click)="resendConfirmation()" [disabled]="resendBusy">
              <span *ngIf="resendBusy" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Reenviar confirmación
            </button>
          </div>
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

  mode: AuthMode = 'login';
  email = '';
  password = '';
  passwordVisible = false;
  loading = false;
  error = '';
  status = '';
  statusKind: 'info' | 'success' | 'error' = 'info';
  returnUrl: string | null = null;

  forgotBusy = false;
  resetBusy = false;
  resendBusy = false;
  confirming = false;
  confirmHandled = false;

  resetToken = '';
  resetPassword = '';
  resetConfirm = '';

  ngOnInit() {
    this.#api.session().subscribe({ error: () => {} });

    this.#route.queryParamMap.subscribe(params => {
      this.returnUrl = params.get('returnUrl');

      const explicitMode = params.get('mode') as AuthMode | null;
      const loginFlag = params.get('login') === '1';
      const registerFlag = params.get('register') === '1';

      let desired: AuthMode = this.mode;
      if (loginFlag) desired = 'login';
      else if (registerFlag) desired = 'register';
      else if (explicitMode) desired = explicitMode;

      if (desired === 'reset') {
        this.email = params.get('email') ?? this.email;
        this.resetToken = params.get('token') ?? this.resetToken;
      }

      this.setMode(desired, false);

      if (!this.confirmHandled && desired === 'confirm') {
        const userId = params.get('userId') ?? '';
        const token = params.get('token') ?? '';
        this.confirmHandled = true;
        this.handleEmailConfirmation(userId, token);
      }
    });
  }

  get statusCss(): string {
    if (this.statusKind === 'error') return 'text-danger';
    if (this.statusKind === 'success') return 'text-success';
    return 'text-muted';
  }

  setMode(mode: AuthMode, clearMessages = true) {
    this.mode = mode;
    if (clearMessages) {
      this.error = '';
      this.status = '';
    }
    if (mode === 'login') {
      this.password = '';
    }
    if (mode === 'reset' && !this.resetToken) {
      this.status = 'El enlace de restablecimiento no es válido. Solicita uno nuevo.';
      this.statusKind = 'error';
      this.mode = 'forgot';
    }
  }

  togglePasswordVisibility() { this.passwordVisible = !this.passwordVisible; }

  onSubmit(e: Event) {
    e.preventDefault();
    if (this.mode !== 'login' && this.mode !== 'register') return;
    this.error = '';
    this.loading = true;
    const { email, password } = this;
    const done = () => (this.loading = false);
    if (this.mode === 'login') {
      this.#api.login(email, password).subscribe({ next: () => this.#afterAuthWithCart(done), error: (err) => { this.error = this.#msg(err); done(); } });
    } else {
      this.#api.register(email, password).subscribe({
        next: () => {
          this.#api.sendConfirmation(email).subscribe({ error: () => {} });
          this.#api.login(email, password).subscribe({ next: () => this.#afterAuthWithCart(done), error: (err) => { this.error = this.#msg(err); done(); } });
        },
        error: (err) => { this.error = this.#msg(err); done(); }
      });
    }
  }

  sendForgot(e: Event) {
    e.preventDefault();
    if (!this.email) {
      this.statusKind = 'error';
      this.status = 'Ingresa tu correo.';
      return;
    }
    this.error = '';
    this.status = '';
    this.forgotBusy = true;
    this.#api.forgotPassword(this.email).subscribe({
      next: () => {
        this.forgotBusy = false;
        this.statusKind = 'success';
        this.status = 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.';
        this.setMode('login', false);
      },
      error: (err) => {
        this.forgotBusy = false;
        this.statusKind = 'error';
        this.status = this.#msg(err);
      }
    });
  }

  submitReset(e: Event) {
    e.preventDefault();
    if (!this.email || !this.resetToken) {
      this.error = 'El enlace de restablecimiento no es válido.';
      return;
    }
    if (this.resetPassword !== this.resetConfirm) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }
    this.error = '';
    this.resetBusy = true;
    this.#api.resetPassword(this.email, this.resetToken, this.resetPassword).subscribe({
      next: () => {
        this.resetBusy = false;
        this.resetPassword = '';
        this.resetConfirm = '';
        this.password = '';
        this.statusKind = 'success';
        this.status = 'Tu contraseña se actualizó correctamente. Inicia sesión con tus nuevos datos.';
        this.setMode('login', false);
      },
      error: (err) => {
        this.resetBusy = false;
        this.error = this.#msg(err);
      }
    });
  }

  handleEmailConfirmation(userId: string, token: string) {
    if (!userId || !token) {
      this.statusKind = 'error';
      this.status = 'El enlace de confirmación no es válido.';
      return;
    }
    this.confirming = true;
    this.statusKind = 'info';
    this.status = 'Confirmando tu correo…';
    this.#api.confirmEmail(userId, token).subscribe({
      next: () => {
        this.confirming = false;
        this.statusKind = 'success';
        this.status = 'Correo confirmado. Ya puedes iniciar sesión.';
        this.auth.markEmailConfirmed();
        this.setMode('login', false);
      },
      error: (err) => {
        this.confirming = false;
        this.statusKind = 'error';
        this.status = this.#msg(err);
        this.setMode('login', false);
      }
    });
  }

  resendConfirmation() {
    const email = this.auth.user()?.email;
    if (!email || this.resendBusy) return;
    this.resendBusy = true;
    this.#api.sendConfirmation(email).subscribe({
      next: () => {
        this.resendBusy = false;
        this.statusKind = 'success';
        this.status = 'Te enviamos un nuevo correo para confirmar tu cuenta.';
      },
      error: (err) => {
        this.resendBusy = false;
        this.statusKind = 'error';
        this.status = this.#msg(err);
      }
    });
  }

  logout() {
    this.loading = true;
    this.#api.logout().subscribe({ next: () => (this.loading = false), error: () => (this.loading = false) });
  }

  goProfile() { this.#router.navigate(['/perfil']); }

  #msg(err: any): string {
    if (err?.error?.errors) {
      return (Object.values(err.error.errors) as any[]).flat().join(' ');
    }
    if (typeof err?.error === 'string') return err.error;
    return 'Ocurrió un error. Verifica tus datos.';
  }

  #afterAuthWithCart(done: () => void) {
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

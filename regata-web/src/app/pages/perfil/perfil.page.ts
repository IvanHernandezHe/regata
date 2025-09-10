import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { AccountService, AccountMe } from '../../core/account.service';
import { OrdersService, OrderSummary } from '../../core/orders.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, CurrencyPipe, DatePipe],
  styles: [`
    .card { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); }
    .tabs { border-bottom: 1px solid rgba(0,0,0,.08); }
    .tab-btn { border: none; background: transparent; padding: .75rem 1rem; font-weight: 600; }
    .tab-btn.active { color: var(--jdm-red); border-bottom: 2px solid var(--jdm-red); }
  `],
  template: `
  <section class="container my-4">
    <h2 class="mb-3">Tu cuenta</h2>
    <div class="card p-0 overflow-hidden" *ngIf="me; else loading">
      <div class="p-3 border-bottom bg-body-tertiary">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-semibold">{{ me.displayName || 'Usuario' }}</div>
            <small class="text-muted">{{ me.email }}</small>
          </div>
          <button class="btn btn-outline-danger btn-sm" (click)="logout()">Cerrar sesión</button>
        </div>
      </div>
      <div class="tabs px-3 d-flex gap-2">
        <button class="tab-btn" [class.active]="tab==='perfil'" (click)="tab='perfil'">Perfil</button>
        <button class="tab-btn" [class.active]="tab==='seguridad'" (click)="tab='seguridad'">Seguridad</button>
        <button class="tab-btn" [class.active]="tab==='pedidos'" (click)="tab='pedidos'">Pedidos</button>
      </div>

      <div class="p-3" *ngIf="tab==='perfil'">
        <form class="row g-3" (submit)="saveProfile($event)">
          <div class="col-12 col-md-6">
            <label class="form-label">Nombre</label>
            <input class="form-control" [(ngModel)]="profile.displayName" name="displayName" placeholder="Tu nombre"/>
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Teléfono</label>
            <input class="form-control" [(ngModel)]="profile.phoneNumber" name="phoneNumber" placeholder="10 dígitos"/>
          </div>
          <div class="col-12">
            <button class="btn btn-dark" type="submit" [disabled]="saving">Guardar cambios</button>
            <span class="text-success ms-2" *ngIf="saved">Guardado</span>
            <span class="text-danger ms-2" *ngIf="error">{{error}}</span>
          </div>
        </form>
      </div>

      <div class="p-3" *ngIf="tab==='seguridad'">
        <form class="row g-3" (submit)="changePassword($event)">
          <div class="col-12 col-md-4">
            <label class="form-label">Actual</label>
            <input class="form-control" type="password" [(ngModel)]="security.currentPassword" name="currentPassword" required minlength="6"/>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">Nueva</label>
            <input class="form-control" type="password" [(ngModel)]="security.newPassword" name="newPassword" required minlength="6"/>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">Confirmar</label>
            <input class="form-control" type="password" [(ngModel)]="security.confirm" name="confirm" required minlength="6"/>
          </div>
          <div class="col-12">
            <button class="btn btn-dark" type="submit" [disabled]="changing">Actualizar contraseña</button>
            <span class="text-success ms-2" *ngIf="changed">Actualizada</span>
            <span class="text-danger ms-2" *ngIf="error">{{error}}</span>
          </div>
        </form>
      </div>

      <div class="p-3" *ngIf="tab==='pedidos'">
        <div *ngIf="orders.length; else noOrders">
          <div class="table-responsive">
            <table class="table align-middle">
              <thead><tr><th>Folio</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody>
                <tr *ngFor="let o of orders">
                  <td class="small">{{ o.id }}</td>
                  <td>{{ o.createdAtUtc | date:'medium' }}</td>
                  <td>{{ o.total | currency:'MXN' }}</td>
                  <td>{{ o.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <ng-template #noOrders>
          <div class="text-muted">Aún no tienes pedidos.</div>
        </ng-template>
      </div>
    </div>
    <ng-template #loading>
      <p class="text-muted">Cargando tu información…</p>
    </ng-template>
  </section>
  `
})
export class PerfilPage implements OnInit {
  #account = inject(AccountService);
  #authApi = inject(AuthService);
  #ordersApi = inject(OrdersService);
  me: AccountMe | null = null;
  tab: 'perfil' | 'seguridad' | 'pedidos' = 'perfil';
  // perfil
  profile: { displayName: string; phoneNumber: string } = { displayName: '', phoneNumber: '' };
  saving = false; saved = false; error = '';
  // seguridad
  security: { currentPassword: string; newPassword: string; confirm: string } = { currentPassword: '', newPassword: '', confirm: '' };
  changing = false; changed = false;
  // pedidos
  orders: OrderSummary[] = [];

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.#account.me().subscribe({
      next: (m) => {
        this.me = m;
        this.profile.displayName = m.displayName || '';
        this.profile.phoneNumber = m.phoneNumber || '';
        this.loadOrders();
      },
      error: () => (this.me = null)
    });
  }

  loadOrders() {
    this.#ordersApi.listMine().subscribe({ next: (o) => (this.orders = o), error: () => (this.orders = []) });
  }

  saveProfile(e: Event) {
    e.preventDefault();
    this.error = ''; this.saved = false; this.saving = true;
    this.#account.updateProfile({ displayName: this.profile.displayName, phoneNumber: this.profile.phoneNumber })
      .subscribe({
        next: () => { this.saving = false; this.saved = true; this.refresh(); },
        error: (err) => { this.saving = false; this.error = this.#msg(err); }
      });
  }

  changePassword(e: Event) {
    e.preventDefault();
    this.error = ''; this.changed = false; this.changing = true;
    if (this.security.newPassword !== this.security.confirm) {
      this.error = 'Las contraseñas no coinciden'; this.changing = false; return;
    }
    this.#account.changePassword({ currentPassword: this.security.currentPassword, newPassword: this.security.newPassword })
      .subscribe({
        next: () => { this.changing = false; this.changed = true; this.security = { currentPassword: '', newPassword: '', confirm: '' }; },
        error: (err) => { this.changing = false; this.error = this.#msg(err); }
      });
  }

  logout() {
    this.#authApi.logout().subscribe({
      next: () => { this.me = null; },
      error: () => { this.me = null; }
    });
  }

  #msg(err: any): string {
    if (err?.error?.errors) return (Object.values(err.error.errors) as any[]).flat().join(' ');
    if (typeof err?.error === 'string') return err.error;
    return 'Ocurrió un error.';
  }
}

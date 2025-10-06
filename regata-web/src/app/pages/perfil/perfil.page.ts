import { Component, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AccountService, AccountMe } from '../../core/account.service';
import { OrdersService, OrderSummary } from '../../core/orders.service';
import { AddressesService, AddressDto } from '../../core/addresses.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, CurrencyPipe, DatePipe, RouterLink],
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
        <button class="tab-btn" [class.active]="tab==='direcciones'" (click)="tab='direcciones'">Direcciones</button>
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

      <div class="p-3" *ngIf="tab==='direcciones'">
        <div class="row g-3">
          <div class="col-12 col-lg-7">
            <div *ngIf="addressesLoading" class="text-muted">Cargando direcciones…</div>
            <ng-container *ngIf="!addressesLoading">
              <ng-container *ngIf="addresses.length; else noAddress">
                <div class="d-grid gap-3">
                  <div class="border rounded-3 p-3" *ngFor="let addr of addresses" [class.border-primary-subtle]="addr.isDefault" [class.border-primary]="addr.isDefault">
                    <div class="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div class="fw-semibold">{{ addr.line1 }}<span *ngIf="addr.line2">, {{ addr.line2 }}</span></div>
                        <div class="text-muted small">{{ addr.city }}, {{ addr.state }} {{ addr.postalCode }} · {{ addr.country }}</div>
                        <span class="badge text-bg-secondary mt-2" *ngIf="addr.isDefault">Predeterminada</span>
                      </div>
                      <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary" (click)="editAddress(addr)" [disabled]="addressSaving">Editar</button>
                        <button type="button" class="btn btn-outline-primary" (click)="setDefaultAddress(addr.id)" [disabled]="addr.isDefault || defaultingAddressId===addr.id">Predeterminar</button>
                        <button type="button" class="btn btn-outline-danger" (click)="removeAddress(addr.id)" [disabled]="removingAddressId===addr.id">Eliminar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>
            </ng-container>
            <ng-template #noAddress>
              <div class="alert alert-info mb-0">Aún no tienes direcciones guardadas.</div>
            </ng-template>
          </div>
          <div class="col-12 col-lg-5">
            <div class="card p-3 h-100">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="h6 mb-0">{{ editingAddressId ? 'Editar dirección' : 'Nueva dirección' }}</h5>
                <button type="button" class="btn btn-sm btn-outline-secondary" (click)="resetAddressForm()" [disabled]="addressSaving">Limpiar</button>
              </div>
              <form class="row g-2" (submit)="submitAddress($event)">
                <div class="col-12">
                  <label class="form-label">Calle y número</label>
                  <input class="form-control" [(ngModel)]="addressForm.line1" name="addrLine1" required placeholder="Av. Siempre Viva 742" [disabled]="addressSaving"/>
                </div>
                <div class="col-12">
                  <label class="form-label">Interior / referencias</label>
                  <input class="form-control" [(ngModel)]="addressForm.line2" name="addrLine2" placeholder="Depto. 2B" [disabled]="addressSaving"/>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Ciudad</label>
                  <input class="form-control" [(ngModel)]="addressForm.city" name="addrCity" required [disabled]="addressSaving"/>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Estado</label>
                  <input class="form-control" [(ngModel)]="addressForm.state" name="addrState" required [disabled]="addressSaving"/>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">Código postal</label>
                  <input class="form-control" [(ngModel)]="addressForm.postalCode" name="addrPostal" required [disabled]="addressSaving"/>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label">País</label>
                  <input class="form-control" [(ngModel)]="addressForm.country" name="addrCountry" [disabled]="addressSaving"/>
                </div>
                <div class="col-12">
                  <label class="form-check">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="addressForm.isDefault" name="addrDefault" [disabled]="addressSaving"/>
                    <span class="form-check-label">Marcar como predeterminada</span>
                  </label>
                </div>
                <div class="col-12 d-flex gap-2">
                  <button class="btn btn-dark" type="submit" [disabled]="addressSaving">{{ editingAddressId ? 'Actualizar' : 'Guardar' }}</button>
                  <button class="btn btn-outline-secondary" type="button" *ngIf="editingAddressId" (click)="resetAddressForm()" [disabled]="addressSaving">Cancelar</button>
                </div>
              </form>
              <div class="text-danger mt-2" *ngIf="addressError">{{ addressError }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-3" *ngIf="tab==='pedidos'">
        <div *ngIf="orders.length; else noOrders">
          <div class="table-responsive">
            <table class="table align-middle">
              <thead><tr><th>Folio</th><th>Fecha</th><th>Total</th><th>Envío</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let o of orders">
                  <td class="small"><a [routerLink]="['/orders', o.id]">{{ o.id }}</a></td>
                  <td>{{ o.createdAtUtc | date:'medium' }}</td>
                  <td>{{ o.total | currency:'MXN' }}</td>
                  <td>
                    <div class="small">{{ o.shipping.city || '—' }}<span *ngIf="o.shipping.state">, {{ o.shipping.state }}</span></div>
                    <div class="text-muted small" *ngIf="o.shipping.trackingCode">Guía: <code>{{ o.shipping.trackingCode }}</code></div>
                  </td>
                  <td>{{ o.status }}</td>
                  <td class="text-end">
                    <button *ngIf="o.status==='Created'" class="btn btn-sm btn-outline-danger" (click)="cancel(o.id)">Cancelar</button>
                  </td>
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
  #addressesApi = inject(AddressesService);
  me: AccountMe | null = null;
  tab: 'perfil' | 'seguridad' | 'direcciones' | 'pedidos' = 'perfil';
  // perfil
  profile: { displayName: string; phoneNumber: string } = { displayName: '', phoneNumber: '' };
  saving = false; saved = false; error = '';
  // seguridad
  security: { currentPassword: string; newPassword: string; confirm: string } = { currentPassword: '', newPassword: '', confirm: '' };
  changing = false; changed = false;
  // pedidos
  orders: OrderSummary[] = [];
  canceling = false;
  // direcciones
  addresses: AddressDto[] = [];
  addressesLoading = false;
  addressSaving = false;
  addressError = '';
  editingAddressId: string | null = null;
  defaultingAddressId: string | null = null;
  removingAddressId: string | null = null;
  addressForm: { line1: string; line2: string; city: string; state: string; postalCode: string; country: string; isDefault: boolean } = {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'MX',
    isDefault: false
  };

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
        this.loadAddresses();
      },
      error: () => (this.me = null)
    });
  }

  loadOrders() {
    this.#ordersApi.listMine().subscribe({ next: (o) => (this.orders = o), error: () => (this.orders = []) });
  }

  loadAddresses() {
    this.addressesLoading = true;
    this.#addressesApi.list().subscribe({
      next: (list) => {
        this.addresses = list;
        this.addressesLoading = false;
        if (!this.editingAddressId && !this.addressForm.line1 && !this.addressForm.city) {
          this.addressForm.isDefault = list.length === 0;
        }
        if (this.editingAddressId) {
          const current = list.find(a => a.id === this.editingAddressId);
          if (!current) {
            this.resetAddressForm();
          }
        }
      },
      error: () => {
        this.addresses = [];
        this.addressesLoading = false;
      }
    });
  }

  editAddress(addr: AddressDto) {
    this.editingAddressId = addr.id;
    this.addressForm = {
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault
    };
    this.addressError = '';
    this.tab = 'direcciones';
  }

  setDefaultAddress(id: string) {
    if (!id) return;
    this.defaultingAddressId = id;
    this.#addressesApi.setDefault(id).subscribe({
      next: () => {
        this.defaultingAddressId = null;
        this.loadAddresses();
      },
      error: () => {
        this.defaultingAddressId = null;
        alert('No se pudo actualizar la dirección predeterminada.');
      }
    });
  }

  removeAddress(id: string) {
    if (!id) return;
    if (!confirm('¿Eliminar esta dirección?')) return;
    this.removingAddressId = id;
    this.#addressesApi.remove(id).subscribe({
      next: () => {
        this.removingAddressId = null;
        if (this.editingAddressId === id) {
          this.resetAddressForm();
        }
        this.loadAddresses();
      },
      error: () => {
        this.removingAddressId = null;
        alert('No se pudo eliminar la dirección.');
      }
    });
  }

  submitAddress(e: Event) {
    e.preventDefault();
    if (!this.addressForm.line1 || !this.addressForm.city || !this.addressForm.state || !this.addressForm.postalCode) {
      this.addressError = 'Completa los campos obligatorios.';
      return;
    }
    this.addressError = '';
    this.addressSaving = true;
    const payload = {
      line1: this.addressForm.line1,
      line2: this.addressForm.line2 || undefined,
      city: this.addressForm.city,
      state: this.addressForm.state,
      postalCode: this.addressForm.postalCode,
      country: this.addressForm.country || 'MX',
      isDefault: this.addressForm.isDefault
    };
    const handler = this.editingAddressId
      ? this.#addressesApi.update(this.editingAddressId, payload)
      : this.#addressesApi.create(payload);
    handler.subscribe({
      next: () => {
        this.addressSaving = false;
        this.resetAddressForm();
        this.loadAddresses();
      },
      error: (err) => {
        this.addressSaving = false;
        this.addressError = this.#msg(err);
      }
    });
  }

  resetAddressForm() {
    this.editingAddressId = null;
    this.addressForm = { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'MX', isDefault: this.addresses.length === 0 };
    this.addressError = '';
  }

  cancel(id: string) {
    if (!confirm('¿Cancelar este pedido?')) return;
    this.canceling = true;
    this.#ordersApi.cancel(id).subscribe({
      next: () => { this.canceling = false; this.loadOrders(); },
      error: (err) => { this.canceling = false; alert(err?.error?.error || 'No se pudo cancelar'); }
    });
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

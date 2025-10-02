import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersService, AdminUserDetail, AdminUserSummary } from '../../core/admin-users.service';
import { ToastService } from '../../core/toast.service';
import { AuthStore } from '../../state/auth.store';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule],
  styles: [`
    :host { display: block; }
    .users-admin h2 { font-family: var(--font-display); }
    .users-admin .card { border-radius: 1rem; border: 1px solid rgba(0,0,0,.07); box-shadow: 0 4px 24px rgba(15,23,42,.05); }
    .users-admin .control-surface { background: linear-gradient(180deg, rgba(248, 249, 252, 0.8), #ffffff); }
    .users-admin .filter-chip { border: 1px solid rgba(0,0,0,.08); border-radius: 999px; padding: .25rem .9rem; background: transparent; color: #4b5563; font-weight: 600; }
    .users-admin .filter-chip.active { background: #111827; color: #fff; border-color: #111827; }
    .users-admin .user-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    @media (min-width: 992px) { .users-admin .user-grid { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); } }
    table { margin: 0; }
    tbody tr { cursor: pointer; transition: background .15s ease; }
    tbody tr:hover { background: rgba(59, 130, 246, 0.08); }
    tbody tr.active { background: rgba(17, 24, 39, 0.08); }
    .status-dot { width: .55rem; height: .55rem; border-radius: 999px; display: inline-block; margin-right: .4rem; }
    .status-dot.online { background: #22c55e; }
    .status-dot.locked { background: #ef4444; }
    .status-dot.idle { background: #f59e0b; }
    .detail-layout { display: flex; flex-direction: column; gap: 1.25rem; }
    .detail-header { display: flex; flex-direction: column; gap: .35rem; }
    .tag { display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px; padding: .35rem .8rem; font-size: .8rem; background: rgba(15,23,42,.08); color: #1f2937; }
    .tag.success { background: rgba(34,197,94,.12); color: #15803d; }
    .tag.warning { background: rgba(245,158,11,.15); color: #b45309; }
    .tag.danger { background: rgba(239,68,68,.12); color: #b91c1c; }
    .actions-grid { display: grid; gap: .6rem; }
    @media (min-width: 576px) { .actions-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .muted { color: #6b7280; }
    .divider { border-top: 1px solid rgba(148, 163, 184, .2); }
  `],
  template: `
  <section class="container my-4 users-admin">
    <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
      <div>
        <h2 class="mb-1">Administración de usuarios</h2>
        <p class="muted mb-0">Monitorea cuentas, asigna roles y controla sesiones activas.</p>
      </div>
      <button class="btn btn-outline-dark" type="button" (click)="refresh()" [disabled]="loading()">Actualizar lista</button>
    </div>

    <div class="card p-3 p-lg-4 mb-4 control-surface">
      <form class="row g-2 align-items-center" (submit)="onSearch($event)">
        <div class="col-12 col-lg-5">
          <label class="form-label fw-semibold small text-uppercase text-muted">Buscar</label>
          <input class="form-control form-control-lg" type="search" placeholder="Correo, nombre o usuario" [(ngModel)]="searchText" name="search" (input)="scheduleSearch()" [disabled]="loading()" />
        </div>
        <div class="col-12 col-lg-4">
          <label class="form-label fw-semibold small text-uppercase text-muted">Filtros rápidos</label>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="filter-chip" [class.active]="filter()==='all'" (click)="setFilter('all')">Todos</button>
            <button type="button" class="filter-chip" [class.active]="filter()==='admins'" (click)="setFilter('admins')">Administradores</button>
            <button type="button" class="filter-chip" [class.active]="filter()==='locked'" (click)="setFilter('locked')">Bloqueados</button>
          </div>
        </div>
        <div class="col-12 col-lg-3 d-flex align-items-end">
          <button class="btn btn-dark w-100" type="submit" [disabled]="loading()">Buscar</button>
        </div>
      </form>
    </div>

    <div class="user-grid">
      <div class="card overflow-hidden">
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead class="small text-muted">
              <tr><th>Usuario</th><th>Rol</th><th class="text-center" style="width:110px;">Estado</th><th class="text-end" style="width:140px;">Confirmación</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers(); trackBy: trackById" [class.active]="user.id===selectedId()" (click)="openUser(user)">
                <td>
                  <div class="fw-semibold">{{ user.displayName || user.email || 'Sin nombre' }}</div>
                  <div class="muted small">{{ user.email || '—' }}</div>
                </td>
                <td>
                  <span class="tag" *ngIf="user.roles.length; else noRoles">{{ user.roles.join(', ') }}</span>
                  <ng-template #noRoles><span class="muted small">Sin rol</span></ng-template>
                </td>
                <td class="text-center">
                  <span class="status-dot" [class.online]="!user.lockedOut" [class.locked]="user.lockedOut"></span>
                  <span class="small" [class.text-danger]="user.lockedOut">{{ user.lockedOut ? 'Bloqueado' : 'Activo' }}</span>
                </td>
                <td class="text-end">
                  <span class="tag success" *ngIf="user.emailConfirmed">Verificado</span>
                  <span class="tag warning" *ngIf="!user.emailConfirmed">Pendiente</span>
                </td>
              </tr>
              <tr *ngIf="!loading() && filteredUsers().length === 0">
                <td colspan="4" class="text-center py-4 muted">No encontramos usuarios con los criterios actuales.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex align-items-center justify-content-between border-top px-4 py-3">
          <div class="muted small">Página {{ page() }} de {{ totalPages() || 1 }} · {{ total() }} usuarios</div>
          <div class="btn-group">
            <button class="btn btn-outline-secondary btn-sm" type="button" (click)="prevPage()" [disabled]="page()<=1 || loading()">Anterior</button>
            <button class="btn btn-outline-secondary btn-sm" type="button" (click)="nextPage()" [disabled]="page()>=totalPages() || loading()">Siguiente</button>
          </div>
        </div>
      </div>

      <div class="card p-4" *ngIf="detail(); else selectPrompt">
        <div class="detail-layout">
          <div class="detail-header">
            <div class="d-flex align-items-center gap-2">
              <span class="status-dot" [class.online]="!detail()!.lockedOut" [class.locked]="detail()!.lockedOut"></span>
              <h4 class="m-0">{{ detail()!.displayName || detail()!.email || 'Usuario sin nombre' }}</h4>
            </div>
            <div class="muted small">{{ detail()!.email || 'Sin correo' }}</div>
            <div class="d-flex flex-wrap gap-2">
              <span class="tag success" *ngIf="detail()!.isAdmin">Administrador</span>
              <span class="tag warning" *ngIf="detail()!.lockedOut">Bloqueado</span>
              <span class="tag" *ngIf="detail()!.twoFactorEnabled">2FA activo</span>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label small text-uppercase text-muted">Nombre para mostrar</label>
              <input class="form-control" [(ngModel)]="mutableDetail.displayName" name="displayName" placeholder="Nombre" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label small text-uppercase text-muted">Teléfono</label>
              <input class="form-control" [(ngModel)]="mutableDetail.phoneNumber" name="phone" placeholder="Número de contacto" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label small text-uppercase text-muted">Correo confirmado</label>
              <select class="form-select" [(ngModel)]="mutableDetail.emailConfirmed" name="confirmed">
                <option [ngValue]="true">Confirmado</option>
                <option [ngValue]="false">Pendiente</option>
              </select>
            </div>
          </div>

          <div class="actions-grid">
            <button class="btn btn-dark" type="button" (click)="saveProfile()" [disabled]="detailBusy()">Guardar cambios</button>
            <button class="btn btn-outline-dark" type="button" (click)="toggleAdmin()" [disabled]="detailBusy()">{{ detail()!.isAdmin ? 'Quitar rol admin' : 'Convertir en admin' }}</button>
            <button class="btn btn-outline-secondary" type="button" (click)="forceLogout()" [disabled]="detailBusy()">Cerrar sesiones activas</button>
            <button class="btn" [ngClass]="detail()!.lockedOut ? 'btn-outline-success' : 'btn-outline-danger'" type="button" (click)="toggleLock()" [disabled]="detailBusy()">
              {{ detail()!.lockedOut ? 'Desbloquear cuenta' : 'Bloquear acceso' }}
            </button>
            <button class="btn btn-outline-danger" type="button" (click)="deleteUser()" [disabled]="detailBusy()">Eliminar usuario</button>
          </div>

          <div class="divider"></div>
          <div>
            <h6 class="fw-semibold text-uppercase small mb-3">Roles</h6>
            <div class="d-flex flex-wrap gap-2" *ngIf="detail()!.roles.length; else noRolesDetail">
              <span class="tag" *ngFor="let role of detail()!.roles">{{ role }}</span>
            </div>
            <ng-template #noRolesDetail><span class="muted small">Sin roles asignados.</span></ng-template>
          </div>

          <div>
            <h6 class="fw-semibold text-uppercase small mb-3">Sesiones externas</h6>
            <div *ngIf="detail()!.externalLogins.length; else noLogins" class="d-flex flex-wrap gap-2">
              <span class="tag" *ngFor="let login of detail()!.externalLogins">{{ login.loginProvider }} · {{ login.displayName || login.providerKey }}</span>
            </div>
            <ng-template #noLogins><span class="muted small">Sin proveedores vinculados.</span></ng-template>
          </div>

          <div>
            <h6 class="fw-semibold text-uppercase small mb-3">Intentos fallidos</h6>
            <span class="muted">{{ detail()!.accessFailedCount }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <ng-template #selectPrompt>
    <div class="card h-100 d-flex align-items-center justify-content-center text-center p-4">
      <div>
        <div class="mb-2"><span class="status-dot idle"></span></div>
        <h5>Selecciona un usuario</h5>
        <p class="muted mb-0">Explora la lista y elige un usuario para administrar detalles y permisos.</p>
      </div>
    </div>
  </ng-template>
  `
})
export class UsersAdminPage implements OnInit, OnDestroy {
  #svc = inject(AdminUsersService);
  #toast = inject(ToastService);
  #auth = inject(AuthStore);

  loading = signal(false);
  detailBusy = signal(false);
  users = signal<AdminUserSummary[]>([]);
  total = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  filter = signal<'all' | 'admins' | 'locked'>('all');
  selectedId = signal<string | null>(null);
  detail = signal<AdminUserDetail | null>(null);
  searchText = '';
  private refreshTimer: any = null;

  mutableDetail = {
    displayName: '',
    phoneNumber: '',
    emailConfirmed: true
  };

  totalPages = computed(() => {
    const count = this.total();
    return count === 0 ? 1 : Math.ceil(count / this.pageSize);
  });

  filteredUsers = computed(() => {
    const mode = this.filter();
    let list = this.users();
    if (mode === 'admins') list = list.filter(u => u.isAdmin);
    if (mode === 'locked') list = list.filter(u => u.lockedOut);
    return list;
  });

  constructor() {
    effect(() => {
      const id = this.selectedId();
      if (!id) {
        this.detail.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  refresh() { this.loadUsers(); }

  onSearch(ev: Event) {
    ev.preventDefault();
    this.page.set(1);
    this.loadUsers();
  }

  scheduleSearch() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      this.page.set(1);
      this.loadUsers();
    }, 450);
  }

  setFilter(mode: 'all' | 'admins' | 'locked') {
    this.filter.set(mode);
  }

  loadUsers() {
    this.loading.set(true);
    this.#svc.list(this.searchText, this.page(), this.pageSize).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
        if (res.items.every(u => u.id !== this.selectedId())) {
          this.selectedId.set(null);
          this.detail.set(null);
        }
      },
      error: () => {
        this.loading.set(false);
        this.#toast.danger('No se pudieron cargar los usuarios');
      }
    });
  }

  openUser(user: AdminUserSummary) {
    if (this.detailBusy()) return;
    this.selectedId.set(user.id);
    this.detailBusy.set(true);
    this.#svc.get(user.id).subscribe({
      next: (res) => {
        this.detail.set(res);
        this.detailBusy.set(false);
        this.mutableDetail = {
          displayName: res.displayName || '',
          phoneNumber: res.phoneNumber || '',
          emailConfirmed: res.emailConfirmed,
        };
      },
      error: () => {
        this.detailBusy.set(false);
        this.#toast.danger('No se pudo cargar el detalle del usuario');
      }
    });
  }

  saveProfile() {
    const current = this.detail();
    if (!current) return;
    this.detailBusy.set(true);
    const payload = {
      displayName: this.mutableDetail.displayName?.trim() || null,
      phoneNumber: this.mutableDetail.phoneNumber?.trim() || null,
      emailConfirmed: this.mutableDetail.emailConfirmed
    };
    this.#svc.update(current.id, payload).subscribe({
      next: () => {
        this.detailBusy.set(false);
        this.#toast.success('Perfil actualizado');
        this.openUserById(current.id);
        this.loadUsers();
      },
      error: (err) => {
        this.detailBusy.set(false);
        this.#toast.danger(err?.error?.errors?.join?.(' ') || 'No se pudo actualizar el usuario');
      }
    });
  }

  toggleAdmin() {
    const current = this.detail();
    if (!current) return;
    this.detailBusy.set(true);
    const next = !current.isAdmin;
    this.#svc.setAdmin(current.id, next).subscribe({
      next: () => {
        this.detailBusy.set(false);
        this.#toast.success(next ? 'Rol de administrador asignado' : 'Rol de administrador removido');
        this.openUserById(current.id);
        this.loadUsers();
        if (!next && this.isCurrentUser(current.id)) {
          this.#auth.clear();
        }
      },
      error: (err) => {
        this.detailBusy.set(false);
        this.#toast.danger(err?.error?.error || err?.error?.errors?.join?.(' ') || 'No fue posible actualizar el rol');
      }
    });
  }

  toggleLock() {
    const current = this.detail();
    if (!current) return;
    const locking = !current.lockedOut;
    if (locking && this.isCurrentUser(current.id)) {
      this.#toast.warning('No puedes bloquear tu propia cuenta desde aquí.');
      return;
    }
    this.detailBusy.set(true);
    this.#svc.setLock(current.id, locking).subscribe({
      next: () => {
        this.detailBusy.set(false);
        this.#toast.success(locking ? 'Cuenta bloqueada' : 'Cuenta desbloqueada');
        this.openUserById(current.id);
        this.loadUsers();
      },
      error: (err) => {
        this.detailBusy.set(false);
        this.#toast.danger(err?.error?.error || err?.error?.errors?.join?.(' ') || 'No fue posible actualizar el bloqueo');
      }
    });
  }

  forceLogout() {
    const current = this.detail();
    if (!current) return;
    this.detailBusy.set(true);
    this.#svc.forceLogout(current.id).subscribe({
      next: () => {
        this.detailBusy.set(false);
        this.#toast.success('Sesiones activas cerradas');
        if (this.isCurrentUser(current.id)) {
          this.#auth.clear();
        }
      },
      error: () => {
        this.detailBusy.set(false);
        this.#toast.danger('No se pudo finalizar las sesiones');
      }
    });
  }

  deleteUser() {
    const current = this.detail();
    if (!current) return;
    if (!confirm('¿Eliminar esta cuenta de usuario? Esta acción no se puede deshacer.')) return;
    if (this.isCurrentUser(current.id)) {
      this.#toast.warning('No puedes eliminar tu propia cuenta.');
      return;
    }
    this.detailBusy.set(true);
    this.#svc.delete(current.id).subscribe({
      next: () => {
        this.detailBusy.set(false);
        this.#toast.success('Usuario eliminado');
        this.selectedId.set(null);
        this.detail.set(null);
        this.loadUsers();
      },
      error: (err) => {
        this.detailBusy.set(false);
        this.#toast.danger(err?.error?.error || err?.error?.errors?.join?.(' ') || 'No se pudo eliminar el usuario');
      }
    });
  }

  openUserById(id: string) {
    this.#svc.get(id).subscribe({
      next: (res) => {
        this.detail.set(res);
        this.mutableDetail = {
          displayName: res.displayName || '',
          phoneNumber: res.phoneNumber || '',
          emailConfirmed: res.emailConfirmed,
        };
      },
      error: () => {
        this.detail.set(null);
        this.#toast.danger('No se pudo refrescar el detalle del usuario');
      }
    });
  }

  nextPage() {
    if (this.loading() || this.page() >= this.totalPages()) return;
    this.page.update(v => v + 1);
    this.loadUsers();
  }

  prevPage() {
    if (this.loading() || this.page() <= 1) return;
    this.page.update(v => v - 1);
    this.loadUsers();
  }

  trackById(_: number, item: AdminUserSummary) { return item.id; }

  private isCurrentUser(id: string) {
    const current = this.#auth.user();
    if (!current) return false;
    if (current.id) return current.id === id;
    return !!current.email && this.detail()?.email === current.email;
  }
}

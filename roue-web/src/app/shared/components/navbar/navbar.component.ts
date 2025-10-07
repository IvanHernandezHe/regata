import { Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartStore } from '../../../state/cart.store';
import { AuthStore } from '../../../state/auth.store';
import { LucideAngularModule } from 'lucide-angular';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { Product } from '../../../core/models/product.model';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, takeUntil, catchError, map, filter } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { WishlistStore } from '../../../state/wishlist.store';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, SlicePipe, FormsModule, LucideAngularModule],
  styles: [`
    .nav-icon { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; color: inherit; padding: 0; overflow: visible; }
    /* Hover/active disabled for a cleaner minimal look */
    .nav-search { max-width: 520px; }
    .nav-input { border-radius: .5rem; padding-left: 38px; padding-right: 44px; background: var(--bs-tertiary-bg, #f8f9fa); border: 1px solid rgba(0,0,0,.08); }
    .nav-input:focus { box-shadow: none; background: #fff; border-color: rgba(0,0,0,.2); }
    .nav-ico-left, .nav-ico-right { position: absolute; top: 50%; transform: translateY(-50%); color: #6c757d; }
    .nav-ico-left { left: 10px; }
    .nav-ico-right { right: 8px; cursor: pointer; background: transparent; border: 0; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; }
    .dropdown-menu.show { display: block; }
    .badge-counter { position: absolute; top: -4px; right: -4px; transform: none; }
  `],
  template: `
  <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
    <div class="container align-items-center">
      <a class="navbar-brand brand-lockup fw-bold" routerLink="/" aria-label="Roue, inicio">
        <picture>
          <source srcset="/assets/brand/roue-mark.svg" type="image/svg+xml" />
          <img src="/favicon.ico" width="22" height="22" alt="Roue" />
        </picture>
        <span class="brand-text">Roue</span>
      </a>

      <div class="d-flex align-items-center gap-1 order-lg-2">
        <button class="nav-icon" type="button" (click)="toggleSearch()" aria-label="Buscar" [attr.aria-expanded]="searchOpen" aria-haspopup="true" aria-controls="navSearchInput">
          <lucide-icon name="search" size="20" [strokeWidth]="2.5"></lucide-icon>
        </button>
        <a class="nav-icon position-relative" routerLink="/cart" [attr.aria-label]="'Carrito, ' + cart.count() + ' artículos'">
          <lucide-icon name="shopping-cart" size="20" [strokeWidth]="2.5"></lucide-icon>
          <span *ngIf="cart.count() > 0" class="badge badge-counter rounded-pill bg-danger" aria-live="polite" aria-atomic="true">{{ cart.count() }}</span>
        </a>
        <a class="nav-icon position-relative" *ngIf="auth.isAuthenticated()" routerLink="/guardados" aria-label="Guardados">
          <lucide-icon name="heart" size="20" [strokeWidth]="2.5"></lucide-icon>
          <span *ngIf="wishlist.count() > 0" class="badge badge-counter rounded-pill bg-secondary">{{ wishlist.count() }}</span>
        </a>
        <ng-container *ngIf="auth.isAuthenticated(); else guestUser">
          <div class="position-relative" #userMenuContainer>
            <button class="nav-icon" type="button" (click)="toggleUserMenu()" aria-label="Usuario" [attr.aria-expanded]="userMenuOpen">
              <lucide-icon name="user" size="20" [strokeWidth]="2.5"></lucide-icon>
            </button>
            <div class="dropdown-menu dropdown-menu-end show py-2" *ngIf="userMenuOpen" style="right:0; left:auto; min-width: 160px;">
              <a class="dropdown-item" routerLink="/perfil" (click)="userMenuOpen=false">Perfil</a>
              <ng-container *ngIf="auth.isAdmin()">
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" routerLink="/admin/usuarios" (click)="userMenuOpen=false">Usuarios</a>
                <a class="dropdown-item" routerLink="/admin/pedidos" (click)="userMenuOpen=false">Pedidos</a>
                <a class="dropdown-item" routerLink="/admin/inventario" (click)="userMenuOpen=false">Inventario</a>
              </ng-container>
              <button class="dropdown-item" type="button" (click)="logout()">Cerrar sesión</button>
            </div>
          </div>
        </ng-container>
        <ng-template #guestUser>
          <a class="nav-icon" routerLink="/auth" aria-label="Iniciar sesión">
            <lucide-icon name="user" size="20" [strokeWidth]="2.5"></lucide-icon>
          </a>
        </ng-template>
        <button class="navbar-toggler ms-1" type="button" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen" aria-controls="navRoue">
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>

      <div class="collapse navbar-collapse order-lg-1" id="navRoue" [class.show]="menuOpen">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/shop" (click)="closeMenuOnSmall()">Tienda</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/nosotros" (click)="closeMenuOnSmall()">Nosotros</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/servicios" (click)="closeMenuOnSmall()">Servicios</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/ayuda" (click)="closeMenuOnSmall()">Emergencia</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/blog" (click)="closeMenuOnSmall()">Blog</a></li>
          <!-- Auth links visible on mobile menu -->
          <li class="nav-item d-lg-none" *ngIf="!auth.isAuthenticated()"><a class="nav-link" [routerLink]="['/auth']" [queryParams]="{ login: 1 }" (click)="closeMenuOnSmall()">Iniciar sesión</a></li>
          <li class="nav-item d-lg-none" *ngIf="!auth.isAuthenticated()"><a class="nav-link" [routerLink]="['/auth']" [queryParams]="{ register: 1 }" (click)="closeMenuOnSmall()">Crear cuenta</a></li>
          <li class="nav-item d-lg-none" *ngIf="auth.isAuthenticated()"><a class="nav-link" routerLink="/perfil" (click)="closeMenuOnSmall()">Perfil</a></li>
          <li class="nav-item d-lg-none" *ngIf="auth.isAdmin()"><a class="nav-link" routerLink="/admin/usuarios" (click)="closeMenuOnSmall()">Usuarios</a></li>
          <li class="nav-item d-lg-none" *ngIf="auth.isAdmin()"><a class="nav-link" routerLink="/admin/pedidos" (click)="closeMenuOnSmall()">Pedidos</a></li>
          <li class="nav-item d-lg-none" *ngIf="auth.isAdmin()"><a class="nav-link" routerLink="/admin/inventario" (click)="closeMenuOnSmall()">Inventario</a></li>
          <li class="nav-item d-lg-none" *ngIf="auth.isAuthenticated()"><a class="nav-link" routerLink="/guardados" (click)="closeMenuOnSmall()">Guardados</a></li>
          <li class="nav-item d-lg-none" *ngIf="auth.isAuthenticated()"><a class="nav-link" href="#" (click)="$event.preventDefault(); logout();">Cerrar sesión</a></li>
        </ul>

        <!-- Dynamic search -->
        <div class="nav-search position-relative w-100 w-lg-auto ms-lg-2" *ngIf="searchOpen && isLargeScreen" #searchContainer>
          <span class="nav-ico-left" (click)="submitNavSearch()" aria-label="Buscar">
            <lucide-icon name="search" size="18" [strokeWidth]="2.5"></lucide-icon>
          </span>
          <input
            #searchInput
            id="navSearchInput"
            class="form-control nav-input"
            placeholder="Buscar marca, modelo o SKU"
            [(ngModel)]="search"
            (input)="onSearchInput(search)"
            (keydown)="onSearchKeydown($event)"
            aria-label="Buscar"
            role="combobox"
            aria-autocomplete="list"
            [attr.aria-expanded]="(suggestions.length > 0 || (search.trim().length > 0 && hasSearched)) ? 'true' : 'false'"
            aria-haspopup="listbox"
            [attr.aria-controls]="listboxId"
            [attr.aria-activedescendant]="activeIndex >= 0 ? optionId(activeIndex) : null"
          />
          <button class="nav-ico-right" type="button" (click)="closeSearch()" aria-label="Cerrar">
            <lucide-icon name="x" size="16" [strokeWidth]="2.5"></lucide-icon>
          </button>
          <div class="dropdown-menu show w-100 shadow-sm mt-1" *ngIf="(suggestions.length > 0) || (search.trim().length > 0 && hasSearched)" role="listbox" [id]="listboxId">
            <button
              class="dropdown-item d-flex align-items-center gap-2"
              *ngFor="let p of suggestions | slice:0:6; let i = index"
              (click)="goToProduct(p.id)"
              (mouseenter)="activeIndex = i"
              [class.active]="i === activeIndex"
              role="option"
              [attr.aria-selected]="i === activeIndex"
              [id]="optionId(i)"
            >
              <img src="/assets/pzero-1_80.jpg" width="36" height="36" class="rounded bg-body border" alt="">
              <div class="text-truncate">{{ p.brand }} {{ p.modelName }} — {{ p.size }}</div>
            </button>
            <div class="dropdown-item text-muted" *ngIf="(suggestions.length === 0) && (search.trim().length > 0 && hasSearched)" role="option" aria-disabled="true">
              Sin resultados
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item fw-semibold" (click)="submitNavSearch()">Ver más resultados</button>
          </div>
        </div>
      </div>
    </div>
  </nav>
  `
})
export class NavbarComponent implements OnDestroy {
  cart = inject(CartStore);
  #api = inject(ApiService);
  #router = inject(Router);
  auth = inject(AuthStore);
  #authApi = inject(AuthService);
  wishlist = inject(WishlistStore);
  @ViewChild('userMenuContainer') userMenuRef?: ElementRef<HTMLElement>;
  @ViewChild('searchContainer') searchContainerRef?: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  searchOpen = false;
  search = '';
  suggestions: Product[] = [];
  hasSearched = false;
  listboxId = 'nav-suggest-list';
  activeIndex = -1;
  userMenuOpen = false;

  // responsive: track >= lg
  isLargeScreen = true;
  menuOpen = false;

  // search stream
  #destroy$ = new Subject<void>();
  #search$ = new Subject<string>();

  constructor(private readonly bp: BreakpointObserver) {
    // breakpoint observer for >= lg (Bootstrap 992px)
    this.bp.observe('(min-width: 992px)')
      .pipe(takeUntil(this.#destroy$))
      .subscribe(state => {
        this.isLargeScreen = state.matches;
        if (!this.isLargeScreen) {
          this.searchOpen = false;
          this.suggestions = [];
          this.activeIndex = -1;
        } else {
          this.menuOpen = false;
        }
      });

    // search pipeline
    this.#search$
      .pipe(
        map((t) => (t ?? '').trim()),
        debounceTime(250),
        distinctUntilChanged(),
        filter(() => this.isLargeScreen && this.searchOpen),
        switchMap((q) =>
          q.length
            ? this.#api.getProducts(q).pipe(
                catchError(() => of([] as Product[]))
              )
            : of([] as Product[])
        ),
        takeUntil(this.#destroy$)
      )
      .subscribe((res) => {
        this.hasSearched = true;
        this.suggestions = res || [];
        this.activeIndex = this.suggestions.length ? 0 : -1;
      });
  }

  toggleSearch() {
    // On small screens, go to the shop page for a dedicated search experience
    if (!this.isLargeScreen) {
      this.#router.navigate(['/shop']);
      return;
    }
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.search = '';
      this.suggestions = [];
      this.hasSearched = false;
      this.activeIndex = -1;
    } else {
      // focus input when opening
      setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 0);
    }
  }

  closeSearch() { this.searchOpen = false; this.suggestions = []; this.activeIndex = -1; }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenuOnSmall() {
    if (!this.isLargeScreen) this.menuOpen = false;
  }

  onSearchInput(term: string) {
    this.#search$.next(term ?? '');
  }

  onSearchKeydown(ev: KeyboardEvent) {
    const max = Math.min(this.suggestions.length, 6);
    if (ev.key === 'Escape') {
      this.closeSearch();
      ev.preventDefault();
      return;
    }
    if (ev.key === 'ArrowDown') {
      if (max > 0) {
        this.activeIndex = (this.activeIndex + 1 + max) % max;
      }
      ev.preventDefault();
      return;
    }
    if (ev.key === 'ArrowUp') {
      if (max > 0) {
        this.activeIndex = (this.activeIndex - 1 + max) % max;
      }
      ev.preventDefault();
      return;
    }
    if (ev.key === 'Enter') {
      if (this.activeIndex >= 0 && this.activeIndex < max && this.suggestions[this.activeIndex]) {
        this.goToProduct(this.suggestions[this.activeIndex].id);
      } else {
        this.submitNavSearch();
      }
      ev.preventDefault();
      return;
    }
  }

  submitNavSearch() {
    const q = this.search.trim();
    if (!q) return;
    this.closeSearch();
    this.#router.navigate(['/shop'], { queryParams: { q } });
  }

  goToProduct(id: string) {
    this.closeSearch();
    this.#router.navigate(['/product', id]);
  }

  optionId(i: number) { return `${this.listboxId}-option-${i}`; }

  @HostListener('document:click', ['$event']) onDocumentClick(ev: MouseEvent) {
    const target = ev.target instanceof Node ? ev.target : null;
    const sEl = this.searchContainerRef?.nativeElement;
    if (this.searchOpen && sEl && target && !sEl.contains(target)) {
      this.closeSearch();
    }
    const uEl = this.userMenuRef?.nativeElement;
    if (this.userMenuOpen && uEl && target && !uEl.contains(target)) {
      this.userMenuOpen = false;
    }
  }

  toggleUserMenu() { this.userMenuOpen = !this.userMenuOpen; }

  logout() {
    this.#authApi.logout().subscribe({
      next: () => { this.userMenuOpen = false; this.menuOpen = false; this.#router.navigate(['/']); },
      error: () => { this.userMenuOpen = false; this.menuOpen = false; this.#router.navigate(['/']); }
    });
  }

  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}

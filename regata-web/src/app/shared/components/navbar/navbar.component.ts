import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartStore } from '../../../state/cart.store';
import { LucideAngularModule } from 'lucide-angular';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { Product } from '../../../core/models/product.model';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, SlicePipe, FormsModule, LucideAngularModule],
  styles: [`
    .nav-icon { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; color: inherit; padding: 0; }
    /* Hover/active disabled for a cleaner minimal look */
    .nav-search { max-width: 520px; }
    .nav-input { border-radius: .5rem; padding-left: 38px; padding-right: 44px; background: var(--bs-tertiary-bg, #f8f9fa); border: 1px solid rgba(0,0,0,.08); }
    .nav-input:focus { box-shadow: none; background: #fff; border-color: rgba(0,0,0,.2); }
    .nav-ico-left, .nav-ico-right { position: absolute; top: 50%; transform: translateY(-50%); color: #6c757d; }
    .nav-ico-left { left: 10px; }
    .nav-ico-right { right: 8px; cursor: pointer; background: transparent; border: 0; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; }
    .dropdown-menu.show { display: block; }
  `],
  template: `
  <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
    <div class="container align-items-center">
      <a class="navbar-brand fw-bold" routerLink="/">Regata</a>

      <div class="d-flex align-items-center gap-1 order-lg-2">
        <button class="nav-icon" type="button" (click)="toggleSearch()" aria-label="Buscar">
          <lucide-icon name="search" size="20" [strokeWidth]="2.5"></lucide-icon>
        </button>
        <a class="nav-icon position-relative" routerLink="/cart" aria-label="Carrito">
          <lucide-icon name="shopping-cart" size="20" [strokeWidth]="2.5"></lucide-icon>
          <span *ngIf="cart.count() > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{{ cart.count() }}</span>
        </a>
        <a class="nav-icon" routerLink="/perfil" aria-label="Perfil">
          <lucide-icon name="user" size="20" [strokeWidth]="2.5"></lucide-icon>
        </a>
        <button class="navbar-toggler ms-1" type="button" data-bs-toggle="collapse" data-bs-target="#navRegata">
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>

      <div class="collapse navbar-collapse order-lg-1" id="navRegata">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/shop">Tienda</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/nosotros">Nosotros</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/servicios">Servicios</a></li>
          <li class="nav-item"><a class="nav-link" routerLinkActive="active" routerLink="/blog">Blog</a></li>
        </ul>

        <!-- Dynamic search -->
        <div class="nav-search position-relative w-100 w-lg-auto ms-lg-2" *ngIf="searchOpen && isLargeScreen">
          <span class="nav-ico-left" (click)="submitNavSearch()" aria-label="Buscar">
            <lucide-icon name="search" size="18" [strokeWidth]="2.5"></lucide-icon>
          </span>
          <input class="form-control nav-input" placeholder="Buscar marca, modelo o SKU" [(ngModel)]="search" (input)="onSearchInput(search)" (keydown.enter)="submitNavSearch()" aria-label="Buscar"/>
          <button class="nav-ico-right" type="button" (click)="closeSearch()" aria-label="Cerrar">
            <lucide-icon name="x" size="16" [strokeWidth]="2.5"></lucide-icon>
          </button>
          <div class="dropdown-menu show w-100 shadow-sm mt-1" *ngIf="suggestions.length">
            <button class="dropdown-item d-flex align-items-center gap-2" *ngFor="let p of suggestions | slice:0:6" (click)="goToProduct(p.id)">
              <img src="/assets/pzero-1_80.jpg" width="36" height="36" class="rounded bg-body border" alt="">
              <div class="text-truncate">{{ p.brand }} {{ p.modelName }} — {{ p.size }}</div>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item fw-semibold" (click)="submitNavSearch()">Ver más resultados</button>
          </div>
        </div>
      </div>
    </div>
  </nav>
  `
})
export class NavbarComponent {
  cart = inject(CartStore);
  #api = inject(ApiService);
  #router = inject(Router);

  searchOpen = false;
  search = '';
  suggestions: Product[] = [];
  #debounce: ReturnType<typeof setTimeout> | null = null;
  isLargeScreen = typeof window !== 'undefined' ? window.innerWidth >= 992 : true; // Bootstrap lg

  @HostListener('window:resize') onResize() {
    this.isLargeScreen = typeof window !== 'undefined' ? window.innerWidth >= 992 : true;
    if (!this.isLargeScreen) {
      this.searchOpen = false; // keep header compact on small screens
    }
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
    }
  }

  closeSearch() { this.searchOpen = false; this.suggestions = []; }

  onSearchInput(term: string) {
    if (this.#debounce) clearTimeout(this.#debounce);
    this.#debounce = setTimeout(() => {
      const q = term?.trim();
      if (!q || !this.isLargeScreen) { this.suggestions = []; return; }
      this.#api.getProducts(q).subscribe(res => this.suggestions = res || []);
    }, 200);
  }

  submitNavSearch() {
    const q = this.search?.trim();
    if (!q) return;
    this.closeSearch();
    this.#router.navigate(['/shop'], { queryParams: { q } });
  }

  goToProduct(id: string) {
    this.closeSearch();
    this.#router.navigate(['/product', id]);
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { WishlistService, WishItem } from '../core/wishlist.service';
import { CartStore } from './cart.store';
import { ToastService } from '../core/toast.service';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  #api = inject(WishlistService);
  #toast = inject(ToastService);
  #cart = inject(CartStore);

  #items = signal<WishItem[] | null>(null);
  readonly items = this.#items.asReadonly();
  readonly count = computed(() => this.#items()?.length ?? 0);

  load() { this.#api.list().subscribe({ next: (l) => this.#items.set(l), error: () => this.#items.set([]) }); }
  add(productId: string) {
    this.#api.add(productId).subscribe({
      next: () => { this.#toast.success('Guardado para después'); this.load(); },
      error: () => this.#toast.warning('No se pudo guardar')
    });
  }
  remove(productId: string) {
    this.#api.remove(productId).subscribe({ next: () => this.load(), error: () => {} });
  }
  moveToCart(productId: string, qty = 1) {
    this.#api.moveToCart(productId, qty).subscribe({
      next: () => { this.#toast.success('Movido al carrito'); this.load(); this.#cart.reload(); },
      error: () => this.#toast.warning('No se pudo mover')
    });
  }
}

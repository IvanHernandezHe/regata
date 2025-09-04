import { signal, computed, Injectable, effect } from '@angular/core';
import { Product } from '../core/models/product.model';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  #storageKey = 'regata_cart_v1';
  #items = signal<CartItem[]>(this.#rehydrate());
  readonly items = this.#items.asReadonly();
  readonly count = computed(() => this.#items().reduce((s, i) => s + i.qty, 0));
  readonly subtotal = computed(() => this.#items().reduce((s, i) => s + i.price * i.qty, 0));

  constructor() {
    effect(() => {
      const snapshot = JSON.stringify(this.#items());
      try { localStorage.setItem(this.#storageKey, snapshot); } catch {}
    });
  }

  add(p: Product, qty = 1) {
    const exists = this.#items().find(i => i.productId === p.id);
    if (exists) {
      this.#items.update(list =>
        list.map(i => i.productId === p.id ? { ...i, qty: i.qty + qty } : i));
    } else {
      this.#items.update(list => [...list, {
        productId: p.id, name: `${p.brand} ${p.modelName} ${p.size}`, sku: p.sku, price: p.price, qty
      }]);
    }
  }
  remove(id: string) { this.#items.update(list => list.filter(i => i.productId !== id)); }
  clear() { this.#items.set([]); }

  replaceFromServer(items: CartItem[]) {
    this.#items.set(items);
  }

  increment(id: string, by = 1) {
    if (by <= 0) return;
    this.#items.update(list => list.map(i => i.productId === id ? { ...i, qty: i.qty + by } : i));
  }

  decrement(id: string, by = 1) {
    if (by <= 0) return;
    this.#items.update(list => list.flatMap(i => {
      if (i.productId !== id) return [i];
      const nextQty = i.qty - by;
      return nextQty > 0 ? [{ ...i, qty: nextQty }] : [];
    }));
  }

  setQty(id: string, qty: number) {
    if (!Number.isFinite(qty) || qty < 1) {
      this.remove(id);
      return;
    }
    this.#items.update(list => list.map(i => i.productId === id ? { ...i, qty: Math.floor(qty) } : i));
  }

  #rehydrate(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.#storageKey);
      if (!raw) return [];
      const arr = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(arr)) return [];
      return arr.filter(x => x && typeof x.productId === 'string' && Number.isFinite(x.price) && Number.isFinite(x.qty));
    } catch {
      return [];
    }
  }
}

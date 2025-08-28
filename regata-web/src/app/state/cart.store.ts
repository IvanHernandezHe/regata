import { signal, computed } from '@angular/core';
import { Product } from '../core/models/product.model';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

export class CartStore {
  #items = signal<CartItem[]>([]);
  readonly items = this.#items.asReadonly();
  readonly count = computed(() => this.#items().reduce((s, i) => s + i.qty, 0));
  readonly subtotal = computed(() => this.#items().reduce((s, i) => s + i.price * i.qty, 0));

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
}
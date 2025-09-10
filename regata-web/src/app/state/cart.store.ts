import { signal, computed, Injectable, effect, inject } from '@angular/core';
import { Product } from '../core/models/product.model';
import { CartService } from '../core/cart.service';
import { AuthStore } from './auth.store';
import { ToastService } from '../core/toast.service';
import { DiscountsService, DiscountInfo } from '../core/discounts.service';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  stock?: number;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  #storageKey = 'regata_cart_v1';
  #originKey = 'regata_cart_origin_v1'; // 'server' | 'local'
  #couponKey = 'regata_coupon_v1';
  #items = signal<CartItem[]>(this.#rehydrate());
  readonly items = this.#items.asReadonly();
  readonly count = computed(() => this.#items().reduce((s, i) => s + i.qty, 0));
  readonly subtotal = computed(() => this.#items().reduce((s, i) => s + i.price * i.qty, 0));
  #coupon = signal<DiscountInfo | null>(this.#rehydrateCoupon());
  readonly coupon = this.#coupon.asReadonly();
  couponCode() { return this.#coupon()?.code ?? null; }
  estimateDiscount = computed(() => {
    const c = this.#coupon();
    if (!c) return 0;
    const sub = this.subtotal();
    // 0=Percentage, 1=FixedAmount (según backend)
    if (c.type === 0) return Math.round((sub * c.value / 100) * 100) / 100;
    if (c.type === 1) return Math.min(sub, c.value);
    return 0;
  });

  #api = inject(CartService);
  #auth = inject(AuthStore);
  #toast = inject(ToastService);
  #discounts = inject(DiscountsService);

  constructor() {
    effect(() => {
      const snapshot = JSON.stringify(this.#items());
      try { localStorage.setItem(this.#storageKey, snapshot); } catch {}
    });
    effect(() => {
      const c = this.#coupon();
      try { c ? localStorage.setItem(this.#couponKey, JSON.stringify(c)) : localStorage.removeItem(this.#couponKey); } catch {}
    });
  }

  // Reload current cart snapshot from server (if authenticated)
  reload() {
    if (!this.#auth.isAuthenticated()) return;
    this.#api.get().subscribe({
      next: (res) => this.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty, stock: (i as any).stock }))),
      error: () => {}
    });
  }

  add(p: Product, qty = 1) {
    if (this.#auth.isAuthenticated()) {
      this.#api.add(p.id, qty).subscribe({
        next: (res) => {
          this.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty, stock: (i as any).stock })));
          this.#toast.success('Producto agregado al carrito');
        },
        error: () => {
          // fallback local
          this.#addLocal(p, qty);
          this.#toast.info('Agregado al carrito (offline)');
        }
      });
    } else {
      this.#addLocal(p, qty);
      this.#toast.success('Producto agregado al carrito');
    }
  }
  remove(id: string) {
    const removed = this.#items().find(i => i.productId === id);
    if (this.#auth.isAuthenticated()) {
      this.#api.remove(id).subscribe({
        next: (res) => {
          this.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty, stock: (i as any).stock })));
          if (removed) this.#toast.showWithAction('Producto quitado', 'Deshacer', () => this.#undoRemove(removed));
        },
        error: () => { this.#removeLocal(id); if (removed) this.#toast.showWithAction('Producto quitado', 'Deshacer', () => this.#undoRemove(removed)); }
      });
    } else { this.#removeLocal(id); if (removed) this.#toast.showWithAction('Producto quitado', 'Deshacer', () => this.#undoRemove(removed)); }
  }
  clear() {
    if (this.#auth.isAuthenticated()) {
      this.#api.clear().subscribe({
        next: (res) => { this.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty }))); this.#toast.info('Carrito vaciado'); },
        error: () => { this.#items.set([]); this.#setOrigin('local'); this.#toast.info('Carrito vaciado'); }
      });
    } else { this.#items.set([]); this.#setOrigin('local'); this.#toast.info('Carrito vaciado'); }
  }

  replaceFromServer(items: CartItem[]) {
    this.#items.set(items.map(i => ({ ...i })));
    this.#setOrigin('server');
  }

  increment(id: string, by = 1) {
    if (by <= 0) return;
    const currItem = this.#items().find(i => i.productId === id);
    if (currItem && Number.isFinite(currItem.stock as any) && (currItem.stock as number) > 0 && currItem.qty >= (currItem.stock as number)) {
      this.#toast.warning('Alcanzaste las existencias disponibles');
      return;
    }
    if (this.#auth.isAuthenticated()) {
      const curr = this.#items().find(i => i.productId === id)?.qty ?? 0;
      const next = curr + by;
      this.#setQtyLocal(id, next);
      this.#scheduleSetQtyServer(id, next);
    } else {
      this.#incrementLocal(id, by);
    }
  }

  decrement(id: string, by = 1) {
    if (by <= 0) return;
    if (this.#auth.isAuthenticated()) {
      const curr = this.#items().find(i => i.productId === id)?.qty ?? 0;
      const next = Math.max(0, curr - by);
      this.#setQtyLocal(id, next);
      this.#scheduleSetQtyServer(id, next);
    } else {
      this.#decrementLocal(id, by);
    }
  }

  setQty(id: string, qty: number) {
    if (!Number.isFinite(qty) || qty < 1) { this.remove(id); return; }
    if (this.#auth.isAuthenticated()) {
      const q = Math.floor(qty);
      this.#setQtyLocal(id, q);
      this.#scheduleSetQtyServer(id, q);
    } else {
      this.#setQtyLocal(id, Math.floor(qty));
    }
  }

  isServerSynced(): boolean {
    try { return localStorage.getItem(this.#originKey) === 'server'; } catch { return false; }
  }
  markServerSynced() { this.#setOrigin('server'); }
  markLocalChanged() { this.#setOrigin('local'); }
  // Restore snapshot (used for undo clear)
  restoreSnapshot(items: CartItem[]) {
    if (this.#auth.isAuthenticated()) {
      const body = items.map(i => ({ productId: i.productId, qty: i.qty }));
      this.#api.merge(body).subscribe({
        next: (res) => this.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty, stock: (i as any).stock }))),
        error: () => { this.#items.set(items); this.#setOrigin('local'); }
      });
    } else {
      this.#items.set(items);
      this.#setOrigin('local');
    }
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

  #setOrigin(v: 'server' | 'local') { try { localStorage.setItem(this.#originKey, v); } catch {} }

  // Local helpers
  #addLocal(p: Product, qty: number) {
    const exists = this.#items().find(i => i.productId === p.id);
    if (exists) {
      this.#items.update(list => list.map(i => {
        if (i.productId !== p.id) return i;
        const stock = Number.isFinite(i.stock as any) ? (i.stock as number) : Infinity;
        const nextQty = Math.min(i.qty + qty, stock);
        if (nextQty === i.qty) this.#toast.warning('Alcanzaste las existencias disponibles');
        return { ...i, qty: nextQty };
      }));
    } else {
      const initialQty = Math.min(qty, Number.isFinite(p.stock as any) ? (p.stock as number) : qty);
      this.#items.update(list => [...list, { productId: p.id, name: `${p.brand} ${p.modelName} ${p.size}`, sku: p.sku, price: p.price, qty: initialQty, stock: p.stock }]);
      if (initialQty < qty) this.#toast.warning('Se agregó el máximo disponible');
    }
    this.#setOrigin('local');
  }
  #removeLocal(id: string) { this.#items.update(list => list.filter(i => i.productId !== id)); this.#setOrigin('local'); }
  #incrementLocal(id: string, by: number) { this.#items.update(list => list.map(i => i.productId === id ? { ...i, qty: i.qty + by } : i)); this.#setOrigin('local'); }
  #decrementLocal(id: string, by: number) {
    this.#items.update(list => list.flatMap(i => {
      if (i.productId !== id) return [i];
      const nextQty = i.qty - by;
      return nextQty > 0 ? [{ ...i, qty: nextQty }] : [];
    }));
    this.#setOrigin('local');
  }
  #setQtyLocal(id: string, qty: number) {
    this.#items.update(list => list.map(i => {
      if (i.productId !== id) return i;
      const max = Number.isFinite(i.stock as any) && (i.stock as number) > 0 ? Math.min(qty, i.stock as number) : qty;
      return { ...i, qty: max };
    }));
    this.#setOrigin('local');
  }
  // Debounced server update
  #qtyTimers = new Map<string, any>();
  #scheduleSetQtyServer(id: string, qty: number) {
    const prev = this.#qtyTimers.get(id);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      this.#api.setQty(id, qty).subscribe({
        next: (res) => this.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty, stock: (i as any).stock }))),
        error: () => this.#toast.warning('No se pudo actualizar la cantidad')
      });
    }, 250);
    this.#qtyTimers.set(id, t);
  }

  // Coupons
  applyCoupon(code: string) {
    const trimmed = (code || '').trim();
    if (!trimmed) { this.#toast.info('Ingresa un código válido'); return; }
    this.#discounts.validate(trimmed).subscribe({
      next: (info) => { this.#coupon.set(info); this.#toast.success('Cupón aplicado'); },
      error: () => { this.#toast.danger('Cupón inválido o expirado'); }
    });
  }
  clearCoupon() { this.#coupon.set(null); this.#toast.info('Cupón removido'); }

  #rehydrateCoupon(): DiscountInfo | null {
    try { const raw = localStorage.getItem(this.#couponKey); return raw ? JSON.parse(raw) as DiscountInfo : null; } catch { return null; }
  }

  #undoRemove(item: CartItem) {
    if (this.#auth.isAuthenticated()) {
      this.#api.add(item.productId, item.qty).subscribe({
        next: (res) => this.replaceFromServer(res.items.map(i => ({ productId: i.productId, name: i.name, sku: i.sku, price: i.price, qty: i.qty }))),
        error: () => this.#addItemRaw(item)
      });
    } else {
      this.#addItemRaw(item);
    }
  }
  #addItemRaw(item: CartItem) { this.#items.update(list => [...list, item]); this.#setOrigin('local'); }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CartItemDto { productId: string; qty: number; }
export interface CartDtoItem { productId: string; name: string; sku: string; size: string; price: number; qty: number; stock?: number; }
export interface CartDto { id: string; userId?: string; items: CartDtoItem[]; subtotal: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/cart';
  #cartIdKey = 'roue_server_cart_id';
  #cartId: string | null = null;

  constructor() {
    try {
      this.#cartId = localStorage.getItem(this.#cartIdKey);
    } catch {
      this.#cartId = null;
    }
  }

  get() { return this.#http.get<CartDto>(`${this.#base}`, this.#opts()).pipe(this.#capture()); }
  merge(items: CartItemDto[]) { return this.#http.post<CartDto>(`${this.#base}/merge`, { items }, this.#opts()).pipe(this.#capture()); }
  add(productId: string, qty = 1) { return this.#http.post<CartDto>(`${this.#base}/items`, { productId, qty }, this.#opts()).pipe(this.#capture()); }
  setQty(productId: string, qty: number) { return this.#http.put<CartDto>(`${this.#base}/items/${productId}`, { qty }, this.#opts()).pipe(this.#capture()); }
  remove(productId: string) { return this.#http.delete<CartDto>(`${this.#base}/items/${productId}`, this.#opts()).pipe(this.#capture()); }
  clear() { return this.#http.delete<CartDto>(`${this.#base}/clear`, this.#opts()).pipe(this.#capture()); }

  remember(id: string | null | undefined) {
    if (!id) return;
    this.#cartId = id;
    try { localStorage.setItem(this.#cartIdKey, id); } catch {}
  }

  forget() {
    this.#cartId = null;
    try { localStorage.removeItem(this.#cartIdKey); } catch {}
  }

  #opts() {
    const headers = this.#cartId ? new HttpHeaders({ 'X-Cart-Id': this.#cartId }) : undefined;
    return headers ? { withCredentials: true, headers } : { withCredentials: true };
  }

  #capture() { return tap<CartDto>((dto) => this.remember(dto?.id)); }
}

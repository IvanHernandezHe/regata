import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface WishItem { productId: string; productName: string; productSku: string; size: string; price: number; createdAtUtc: string; }

@Injectable({ providedIn: 'root' })
export class WishlistService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/wishlist';

  list() { return this.#http.get<WishItem[]>(`${this.#base}`, { withCredentials: true }); }
  add(productId: string) { return this.#http.post(`${this.#base}/${productId}`, {}, { withCredentials: true }); }
  remove(productId: string) { return this.#http.delete(`${this.#base}/${productId}`, { withCredentials: true }); }
  moveToCart(productId: string, qty = 1) { return this.#http.post(`${this.#base}/move-to-cart/${productId}?qty=${qty}`, {}, { withCredentials: true }); }
}


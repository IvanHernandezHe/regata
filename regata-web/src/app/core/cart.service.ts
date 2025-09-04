import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CartItemDto { productId: string; qty: number; }
export interface CartDtoItem { productId: string; name: string; sku: string; size: string; price: number; qty: number; }
export interface CartDto { id: string; userId?: string; items: CartDtoItem[]; subtotal: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/cart';

  get() { return this.#http.get<CartDto>(`${this.#base}`, { withCredentials: true }); }
  merge(items: CartItemDto[]) { return this.#http.post<CartDto>(`${this.#base}/merge`, { items }, { withCredentials: true }); }
}


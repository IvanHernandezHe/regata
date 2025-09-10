import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface OrderSummary { id: string; total: number; status: string; createdAtUtc: string; }
export interface CheckoutItem { productId: string; quantity: number; }
export interface CheckoutRequest { items: CheckoutItem[]; discountCode?: string | null; reservationToken?: string | null; addressId?: string | null; }
export interface ReserveRequest { items: CheckoutItem[]; ttlSeconds?: number; }
export interface ReserveResponse { token: string; expiresAtUtc: string; }
export interface CheckoutResponse { orderId: string; subtotal: number; discount: number; shipping: number; total: number; currency: string; checkoutUrl: string; }
export interface QuoteResponse { subtotal: number; discount: number; shipping: number; total: number; currency: string; items: any[]; }

@Injectable({ providedIn: 'root' })
export class OrdersService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/orders';

  listMine() { return this.#http.get<OrderSummary[]>(`${this.#base}`, { withCredentials: true }); }
  getById(id: string) { return this.#http.get<any>(`${this.#base}/${id}`, { withCredentials: true }); }
  checkout(body: CheckoutRequest) { return this.#http.post<CheckoutResponse>(`${this.#base}/checkout`, body, { withCredentials: true }); }
  quote(body: CheckoutRequest) { return this.#http.post<QuoteResponse>(`${this.#base}/quote`, body, { withCredentials: true }); }
  reserve(body: ReserveRequest) { return this.#http.post<ReserveResponse>(`${this.#base}/reserve`, body, { withCredentials: true }); }
  releaseReservation(token: string) { return this.#http.post(`${this.#base}/release`, { token }, { withCredentials: true }); }
}

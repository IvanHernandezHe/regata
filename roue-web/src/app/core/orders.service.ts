import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface OrderShipping {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  trackingCarrier: string | null;
  trackingCode: string | null;
  shippedAtUtc: string | null;
}

export interface OrderSummary {
  id: string;
  total: number;
  status: string;
  createdAtUtc: string;
  shipping: OrderShipping;
}
export interface OrderItemLine { productId: string; productName: string; productSku: string; size: string; unitPrice: number; quantity: number; lineTotal: number; }
export interface OrderDetail {
  id: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
  paymentReference?: string | null;
  createdAtUtc: string;
  items: OrderItemLine[];
  shipping: OrderShipping;
}
export interface CheckoutItem { productId: string; quantity: number; }
export interface CheckoutRequest { items: CheckoutItem[]; discountCode?: string | null; reservationToken?: string | null; addressId?: string | null; }
export interface ReserveRequest { items: CheckoutItem[]; ttlSeconds?: number; }
export interface ReserveResponse { token: string; expiresAtUtc: string; }
export interface CheckoutResponse { orderId: string; subtotal: number; discount: number; shipping: number; total: number; currency: string; checkoutUrl: string; }
export interface QuoteResponse { subtotal: number; discount: number; shipping: number; total: number; currency: string; items: OrderItemLine[]; }

@Injectable({ providedIn: 'root' })
export class OrdersService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/orders';

  listMine() { return this.#http.get<OrderSummary[]>(`${this.#base}`, { withCredentials: true }); }
  getById(id: string) { return this.#http.get<OrderDetail>(`${this.#base}/${id}`, { withCredentials: true }); }
  checkout(body: CheckoutRequest) { return this.#http.post<CheckoutResponse>(`${this.#base}/checkout`, body, { withCredentials: true }); }
  quote(body: CheckoutRequest) { return this.#http.post<QuoteResponse>(`${this.#base}/quote`, body, { withCredentials: true }); }
  reserve(body: ReserveRequest) { return this.#http.post<ReserveResponse>(`${this.#base}/reserve`, body, { withCredentials: true }); }
  releaseReservation(token: string) { return this.#http.post(`${this.#base}/release`, { token }, { withCredentials: true }); }
  cancel(id: string) { return this.#http.post<{ cancelled: boolean }>(`${this.#base}/${id}/cancel`, {}, { withCredentials: true }); }
}

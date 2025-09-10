import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminOrderSummary { id: string; userEmail?: string; subtotal: number; discountAmount: number; shippingCost: number; total: number; status: string; paymentStatus: string; createdAtUtc: string; }
export interface AdminOrderDetail extends AdminOrderSummary { paymentProvider: string; paymentReference?: string; ship?: any; items: { productId: string; productName: string; productSku: string; size: string; unitPrice: number; quantity: number }[]; }

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/admin/orders';

  list(status?: string, paymentStatus?: string, page = 1, pageSize = 50) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (paymentStatus) params = params.set('paymentStatus', paymentStatus);
    return this.#http.get<{ total: number; page: number; pageSize: number; items: AdminOrderSummary[] }>(this.#base, { params, withCredentials: true });
  }
  get(id: string) { return this.#http.get<AdminOrderDetail>(`${this.#base}/${id}`, { withCredentials: true }); }
  setStatus(id: string, status: string) { return this.#http.post(`${this.#base}/${id}/status`, { status }, { withCredentials: true }); }
  setPaymentStatus(id: string, paymentStatus: string) { return this.#http.post(`${this.#base}/${id}/payment-status`, { paymentStatus }, { withCredentials: true }); }
}


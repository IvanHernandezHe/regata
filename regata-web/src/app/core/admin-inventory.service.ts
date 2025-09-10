import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface InventoryRow { id: string; sku: string; brand: string; modelName: string; size: string; onHand: number; reserved: number; version: number; }
export interface TxnRow { id: string; productId: string; quantity: number; type: number; reference: string; createdAtUtc: string; }

@Injectable({ providedIn: 'root' })
export class AdminInventoryService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/admin/inventory';

  list(productId?: string) {
    let params = new HttpParams();
    if (productId) params = params.set('productId', productId);
    return this.#http.get<InventoryRow[]>(`${this.#base}`, { params, withCredentials: true });
  }
  transactions(productId?: string, page=1, pageSize=50) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize as any);
    if (productId) params = params.set('productId', productId);
    return this.#http.get<{ total: number; page: number; pageSize: number; items: TxnRow[] }>(`${this.#base}/transactions`, { params, withCredentials: true });
  }
  adjust(productId: string, delta: number, reason?: string) {
    return this.#http.post(`${this.#base}/adjust`, { productId, delta, reason }, { withCredentials: true });
  }
}

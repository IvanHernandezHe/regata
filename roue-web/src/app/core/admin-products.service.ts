import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TireInput { type?: string|null; loadIndex?: string|null; speedRating?: string|null; }
export interface RimInput { diameterIn?: number|null; widthIn?: number|null; boltPattern?: string|null; offsetMm?: number|null; centerBoreMm?: number|null; material?: string|null; finish?: string|null; }

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/admin/products';
  upsertTire(productId: string, body: TireInput) { return this.#http.post(`${this.#base}/${productId}/tire`, body, { withCredentials: true }); }
  upsertRim(productId: string, body: RimInput) { return this.#http.post(`${this.#base}/${productId}/rim`, body, { withCredentials: true }); }
}


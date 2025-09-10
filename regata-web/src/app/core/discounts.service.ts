import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface DiscountInfo { code: string; type: number; value: number; expiresAtUtc?: string; maxRedemptions?: number; redemptions?: number; }

@Injectable({ providedIn: 'root' })
export class DiscountsService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/discounts';

  validate(code: string) {
    const params = new HttpParams().set('code', code);
    return this.#http.get<DiscountInfo>(`${this.#base}/validate`, { params, withCredentials: true });
  }
}


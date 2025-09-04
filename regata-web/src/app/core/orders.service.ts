import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface OrderSummary { id: string; total: number; status: string; createdAtUtc: string; }

@Injectable({ providedIn: 'root' })
export class OrdersService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/orders';

  listMine() { return this.#http.get<OrderSummary[]>(`${this.#base}`, { withCredentials: true }); }
}


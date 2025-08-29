import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from './models/product.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getProducts(q?: string) {
    if (q && q.length) {
      const params = new HttpParams().set('q', q);
      return this.http.get<Product[]>(`${this.base}/products`, { params });
    }
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  getProduct(id: string) {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }
}

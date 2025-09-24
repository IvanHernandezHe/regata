import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from './models/product.model';
import { Brand } from './models/brand.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getProducts(q?: string, category?: string) {
    let params = new HttpParams();
    if (q && q.length) params = params.set('q', q);
    if (category && category.length) params = params.set('category', category);
    return this.http.get<Product[]>(`${this.base}/products`, { params });
  }

  getProduct(id: string) {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }

  getBrands() {
    return this.http.get<Brand[]>(`${this.base}/brands`);
  }
}

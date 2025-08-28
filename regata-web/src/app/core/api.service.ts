import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from './models/product.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getProducts() {
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  getProduct(id: string) {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }
}
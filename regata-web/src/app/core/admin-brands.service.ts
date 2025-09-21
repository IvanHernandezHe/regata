import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminBrand { id: string; name: string; logoUrl?: string | null; active: boolean; }

@Injectable({ providedIn: 'root' })
export class AdminBrandsService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/admin/brands';
  list() { return this.#http.get<AdminBrand[]>(this.#base, { withCredentials: true }); }
  upsert(b: Partial<AdminBrand> & { name: string }) { return this.#http.post(this.#base, b, { withCredentials: true }); }
}

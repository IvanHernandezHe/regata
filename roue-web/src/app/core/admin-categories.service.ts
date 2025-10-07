import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminCategory { id: string; name: string; slug: string; active: boolean; }

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/admin/categories';
  list() { return this.#http.get<AdminCategory[]>(this.#base, { withCredentials: true }); }
  upsert(c: Partial<AdminCategory> & { name: string; slug: string }) { return this.#http.post(this.#base, c, { withCredentials: true }); }
}

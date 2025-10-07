import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AddressDto { id: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country: string; isDefault: boolean; }
export interface UpsertAddress { line1: string; line2?: string | null; city: string; state: string; postalCode: string; country?: string; isDefault?: boolean; }

@Injectable({ providedIn: 'root' })
export class AddressesService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/addresses';

  list() { return this.#http.get<AddressDto[]>(this.#base, { withCredentials: true }); }
  create(body: UpsertAddress) { return this.#http.post(this.#base, body, { withCredentials: true }); }
  update(id: string, body: UpsertAddress) { return this.#http.put(`${this.#base}/${id}`, body, { withCredentials: true }); }
  setDefault(id: string) { return this.#http.post(`${this.#base}/${id}/default`, {}, { withCredentials: true }); }
  remove(id: string) { return this.#http.delete(`${this.#base}/${id}`, { withCredentials: true }); }
}


import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminUserSummary {
  id: string;
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  emailConfirmed: boolean;
  isAdmin: boolean;
  lockedOut: boolean;
  lockoutEnd?: string | null;
  roles: string[];
}

export interface AdminUserDetail {
  id: string;
  email?: string | null;
  userName?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  emailConfirmed: boolean;
  twoFactorEnabled: boolean;
  isAdmin: boolean;
  lockedOut: boolean;
  lockoutEnd?: string | null;
  accessFailedCount: number;
  lockoutEnabled: boolean;
  roles: string[];
  claims: { type: string; value: string }[];
  externalLogins: { loginProvider: string; providerKey: string; displayName?: string | null }[];
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/admin/users';

  list(query = '', page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (query?.trim()) params = params.set('q', query.trim());
    return this.#http.get<{ total: number; page: number; pageSize: number; items: AdminUserSummary[] }>(this.#base, { params, withCredentials: true });
  }

  get(id: string) {
    return this.#http.get<AdminUserDetail>(`${this.#base}/${id}`, { withCredentials: true });
  }

  update(id: string, payload: { phoneNumber?: string | null; displayName?: string | null; emailConfirmed?: boolean }) {
    return this.#http.put(`${this.#base}/${id}`, payload, { withCredentials: true });
  }

  setAdmin(id: string, isAdmin: boolean) {
    return this.#http.post(`${this.#base}/${id}/roles`, { isAdmin }, { withCredentials: true });
  }

  setLock(id: string, lock: boolean, reason?: string) {
    return this.#http.post(`${this.#base}/${id}/lock`, { lock, reason }, { withCredentials: true });
  }

  forceLogout(id: string) {
    return this.#http.post(`${this.#base}/${id}/force-logout`, {}, { withCredentials: true });
  }

  delete(id: string) {
    return this.#http.delete(`${this.#base}/${id}`, { withCredentials: true });
  }
}

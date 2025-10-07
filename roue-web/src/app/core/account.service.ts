import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AccountMe { id: string; email: string; phoneNumber?: string | null; emailConfirmed?: boolean; displayName?: string | null; }

@Injectable({ providedIn: 'root' })
export class AccountService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/account';

  me() { return this.#http.get<AccountMe>(`${this.#base}/me`, { withCredentials: true }); }
  updateProfile(input: { phoneNumber?: string; displayName?: string }) { return this.#http.put(`${this.#base}/profile`, input, { withCredentials: true }); }
  changePassword(input: { currentPassword: string; newPassword: string }) { return this.#http.post(`${this.#base}/change-password`, input, { withCredentials: true }); }
}

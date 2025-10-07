import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AppConfig { env: string; payments: { provider: string }; auth: { googleEnabled: boolean; facebookEnabled: boolean }; }

@Injectable({ providedIn: 'root' })
export class ConfigService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/config';
  get() { return this.#http.get<AppConfig>(this.#base, { withCredentials: true }); }
}


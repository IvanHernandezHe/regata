import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { AuthStore } from '../state/auth.store';

export interface SessionInfo {
  authenticated: boolean;
  email: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  #http = inject(HttpClient);
  #base = environment.apiBaseUrl + '/auth';
  #store = inject(AuthStore);

  session() {
    return this.#http.get<SessionInfo>(`${this.#base}/session`, { withCredentials: true }).pipe(
      tap((s) => this.#store.setSession(s))
    );
  }

  register(email: string, password: string) {
    return this.#http.post(`${this.#base}/register?useCookies=true`, { email, password }, { withCredentials: true });
  }

  login(email: string, password: string) {
    // use session cookies for browser session
    return this.#http.post(`${this.#base}/login?useCookies=true&useSessionCookies=true`, { email, password }, { withCredentials: true }).pipe(
      tap(() => this.session().subscribe())
    );
  }

  logout() {
    return this.#http.post(`${this.#base}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.#store.clear())
    );
  }
}


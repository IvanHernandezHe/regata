import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthStore } from '../state/auth.store';

export interface SessionInfo {
  authenticated: boolean;
  email: string | null;
  isAdmin?: boolean;
  userId?: string | null;
  emailConfirmed?: boolean | null;
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
    // Always clear local state; best-effort server sign-out; then refresh session
    return this.#http.post(`${this.#base}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null)),
      tap(() => this.#store.clear()),
      finalize(() => this.session().subscribe({ error: () => {} }))
    );
  }

  forgotPassword(email: string) {
    return this.#http.post(`${this.#base}/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string) {
    return this.#http.post(`${this.#base}/reset-password`, { email, token, newPassword });
  }

  sendConfirmation(email?: string) {
    const body = email ? { email } : {};
    return this.#http.post(`${this.#base}/send-confirmation`, body, { withCredentials: true });
  }

  confirmEmail(userId: string, token: string) {
    return this.#http.post<{ confirmed: boolean }>(`${this.#base}/confirm-email`, { userId, token });
  }
}

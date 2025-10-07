import { Injectable, computed, signal } from '@angular/core';
import { SessionInfo } from '../core/auth.service';

export interface UserInfo { email: string; isAdmin?: boolean; id?: string | null; emailConfirmed?: boolean | null; }

@Injectable({ providedIn: 'root' })
export class AuthStore {
  #user = signal<UserInfo | null>(null);
  readonly user = this.#user.asReadonly();
  readonly isAuthenticated = computed(() => !!this.#user());

  setSession(s: SessionInfo) {
    this.#user.set(s.authenticated && s.email
      ? { email: s.email, isAdmin: !!s.isAdmin, id: s.userId ?? null, emailConfirmed: s.emailConfirmed ?? null }
      : null);
  }

  isAdmin(): boolean { return !!this.#user()?.isAdmin; }

  markEmailConfirmed() {
    const current = this.#user();
    if (current) {
      this.#user.set({ ...current, emailConfirmed: true });
    }
  }

  clear() { this.#user.set(null); }
}

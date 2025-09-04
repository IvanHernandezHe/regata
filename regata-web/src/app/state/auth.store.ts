import { Injectable, computed, signal } from '@angular/core';
import { SessionInfo } from '../core/auth.service';

export interface UserInfo { email: string; }

@Injectable({ providedIn: 'root' })
export class AuthStore {
  #user = signal<UserInfo | null>(null);
  readonly user = this.#user.asReadonly();
  readonly isAuthenticated = computed(() => !!this.#user());

  setSession(s: SessionInfo) {
    this.#user.set(s.authenticated && s.email ? { email: s.email } : null);
  }

  clear() { this.#user.set(null); }
}


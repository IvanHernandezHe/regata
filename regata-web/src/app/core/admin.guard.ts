import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const store = inject(AuthStore);
  const api = inject(AuthService);
  const router = inject(Router);

  if (store.isAuthenticated() && store.isAdmin()) return true;

  // Refresh session to get isAdmin and decide
  return api.session().pipe(
    map((s) => (s.authenticated && s.isAdmin ? true : router.createUrlTree(['/auth'], { queryParams: { login: 1, returnUrl: state.url } }))),
    catchError(() => of(router.createUrlTree(['/auth'], { queryParams: { login: 1, returnUrl: state.url } })))
  );
};


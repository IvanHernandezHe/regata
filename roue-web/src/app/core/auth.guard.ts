import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const store = inject(AuthStore);
  const api = inject(AuthService);
  const router = inject(Router);

  if (store.isAuthenticated()) return true;

  return api.session().pipe(
    map((s) => (s.authenticated ? true : router.createUrlTree(['/auth'], { queryParams: { login: 1, returnUrl: state.url } }))),
    catchError(() => of(router.createUrlTree(['/auth'], { queryParams: { login: 1, returnUrl: state.url } })))
  );
};

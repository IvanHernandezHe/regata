import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { LucideAngularModule, ShoppingCart, User, Search, X, Heart, Bookmark, Zap, CreditCard, MessageCircle, LifeBuoy, Phone, Mail, AlertTriangle, Gauge, MapPin } from 'lucide-angular';




export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        (req: HttpRequest<unknown>, next) => {
          if (req.url.startsWith('/api')) {
            req = req.clone({ withCredentials: true });
          }
          return next(req);
        }
      ])
    ),
    importProvidersFrom(LucideAngularModule.pick({ ShoppingCart, User, Search, X, Heart, Bookmark, Zap, CreditCard, MessageCircle, LifeBuoy, Phone, Mail, AlertTriangle, Gauge, MapPin })),
  ]
};

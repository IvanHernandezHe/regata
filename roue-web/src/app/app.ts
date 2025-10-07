import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AuthService, SessionInfo } from './core/auth.service';
import { CartService } from './core/cart.service';
import { CartStore } from './state/cart.store';
import { ThemeService } from './core/theme.service';
import { ToastService } from './core/toast.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { WishlistStore } from './state/wishlist.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'roue-web';
  #auth = inject(AuthService);
  #theme = inject(ThemeService);
  #cartApi = inject(CartService);
  #cart = inject(CartStore);
  #toast = inject(ToastService);
  #wishlist = inject(WishlistStore);
  constructor() {
    this.#auth.session().subscribe({
      next: (s: SessionInfo) => {
        if (s?.authenticated) {
          this.#wishlist.load();
          const localItems = this.#cart.items();
          if (localItems.length && !this.#cart.isServerSynced()) {
            // auto-merge local → server, then hydrate snapshot
            const body = localItems.map(i => ({ productId: i.productId, qty: i.qty }));
            this.#cartApi.merge(body).subscribe({
              next: (res) => {
                this.#cart.replaceFromServer(res);
                this.#toast.success('Carrito sincronizado con tu cuenta');
              },
              error: () => {
                // If merge fails, avoid overwriting local. Optionally attempt GET later.
              }
            });
          } else {
            // load server-side cart snapshot on boot/refresh
            this.#cartApi.get().subscribe({
              next: (res) => this.#cart.replaceFromServer(res),
              error: () => {}
            });
          }
        }
      },
      error: () => {}
    });
    this.#theme.init();
  }
}

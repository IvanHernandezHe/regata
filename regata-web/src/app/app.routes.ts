import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage) },
    { path: 'shop', loadComponent: () => import('./pages/shop/shop.page').then(m => m.ShopPage) },
    { path: 'product/:id', loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage) },
    { path: 'cart', loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage) },
    { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage) },
    { path: 'blog', loadComponent: () => import('./pages/blog/blog.page').then(m => m.BlogPage) },
    { path: 'nosotros', loadComponent: () => import('./pages/nosotros/nosotros.page').then(m => m.NosotrosPage) },
    { path: 'servicios', loadComponent: () => import('./pages/servicios/servicios.page').then(m => m.ServiciosPage) },
    { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage) },
    { path: '**', redirectTo: '' },
];

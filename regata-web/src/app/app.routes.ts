import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage) },
    { path: 'shop', loadComponent: () => import('./pages/shop/shop.page').then(m => m.ShopPage) },
    { path: 'product/:id', loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage) },
    { path: 'cart', loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage) },
    { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage) },
];
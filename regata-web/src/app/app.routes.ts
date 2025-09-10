import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage) },
    { path: 'shop', loadComponent: () => import('./pages/shop/shop.page').then(m => m.ShopPage) },
    { path: 'product/:id', loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage) },
    { path: 'cart', loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage) },
    { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage) },
    { path: 'guardados', canActivate: [authGuard], loadComponent: () => import('./pages/wishlist/wishlist.page').then(m => m.WishlistPage) },
    { path: 'admin/inventario', loadComponent: () => import('./pages/admin/inventory-admin.page').then(m => m.InventoryAdminPage) },
    { path: 'admin/pedidos', loadComponent: () => import('./pages/admin/orders-admin.page').then(m => m.OrdersAdminPage) },
    { path: 'admin/pedidos/:id', loadComponent: () => import('./pages/admin/order-admin-detail.page').then(m => m.OrderAdminDetailPage) },
    { path: 'blog', loadComponent: () => import('./pages/blog/blog.page').then(m => m.BlogPage) },
    { path: 'nosotros', loadComponent: () => import('./pages/nosotros/nosotros.page').then(m => m.NosotrosPage) },
    { path: 'servicios', loadComponent: () => import('./pages/servicios/servicios.page').then(m => m.ServiciosPage) },
    { path: 'auth', loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
    { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage) },
    { path: 'orders/:id', canActivate: [authGuard], loadComponent: () => import('./pages/orders/order-detail.page').then(m => m.OrderDetailPage) },
    { path: '**', redirectTo: '' },
];

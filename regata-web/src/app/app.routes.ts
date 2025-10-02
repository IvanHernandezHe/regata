import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage) },
    { path: 'shop', loadComponent: () => import('./pages/shop/shop.page').then(m => m.ShopPage) },
    { path: 'product/:id', loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage) },
    { path: 'cart', loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage) },
    { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage) },
    { path: 'checkout/gracias', canActivate: [authGuard], loadComponent: () => import('./pages/checkout/checkout-success.page').then(m => m.CheckoutSuccessPage) },
    { path: 'guardados', canActivate: [authGuard], loadComponent: () => import('./pages/wishlist/wishlist.page').then(m => m.WishlistPage) },
    { path: 'admin/inventario', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/inventory-admin.page').then(m => m.InventoryAdminPage) },
    { path: 'admin/usuarios', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/users-admin.page').then(m => m.UsersAdminPage) },
    { path: 'admin/pedidos', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/orders-admin.page').then(m => m.OrdersAdminPage) },
    { path: 'admin/pedidos/:id', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/order-admin-detail.page').then(m => m.OrderAdminDetailPage) },
    { path: 'admin/marcas', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/brands-admin.page').then(m => m.BrandsAdminPage) },
    { path: 'admin/categorias', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/categories-admin.page').then(m => m.CategoriesAdminPage) },
    { path: 'blog', loadComponent: () => import('./pages/blog/blog.page').then(m => m.BlogPage) },
    { path: 'nosotros', loadComponent: () => import('./pages/nosotros/nosotros.page').then(m => m.NosotrosPage) },
    { path: 'servicios', loadComponent: () => import('./pages/servicios/servicios.page').then(m => m.ServiciosPage) },
    { path: 'ayuda', loadComponent: () => import('./pages/ayuda/ayuda.page').then(m => m.AyudaPage) },
    { path: 'auth', loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
    { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage) },
    { path: 'orders/:id', canActivate: [authGuard], loadComponent: () => import('./pages/orders/order-detail.page').then(m => m.OrderDetailPage) },
    { path: '**', redirectTo: '' },
];

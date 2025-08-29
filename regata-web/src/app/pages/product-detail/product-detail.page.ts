import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, CurrencyPipe } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../state/cart.store';

@Component({
  standalone: true,
  imports: [NgIf, CurrencyPipe, RouterLink],
  template: `
  <section class="container my-4" *ngIf="product; else loading">
    <div class="row g-4">
      <div class="col-md-5">
        <img src="/assets/pzero-1_80.jpg" class="img-fluid border rounded" alt="llanta" />
      </div>
      <div class="col-md-7">
        <h2 class="mb-1">{{ product.brand }} {{ product.modelName }}</h2>
        <p class="text-muted">Tamaño: {{ product.size }} · SKU {{ product.sku }}</p>
        <h3 class="my-3">{{ product.price | currency:'MXN' }}</h3>
        <p *ngIf="product.stock > 0" class="text-success">En stock: {{ product.stock }}</p>
        <p *ngIf="product.stock === 0" class="text-danger">Sin stock</p>

        <div class="d-flex gap-2">
          <button class="btn btn-dark" (click)="addToCart()">Agregar al carrito</button>
          <a class="btn btn-outline-secondary" routerLink="/shop">Seguir comprando</a>
        </div>
      </div>
    </div>
  </section>

  <ng-template #loading>
    <div class="container my-4"><div class="alert alert-info">Cargando producto…</div></div>
  </ng-template>
  `
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private cart = inject(CartStore);
  product?: Product;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getProduct(id).subscribe(p => this.product = p);
  }

  addToCart() {
    if (this.product) {
      this.cart.add(this.product);
    }
  }
}

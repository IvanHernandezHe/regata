import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgIf, CurrencyPipe } from '@angular/common';

type Product = {
  id: string; sku: string; brand: string; modelName: string; size: string;
  price: number; stock: number; active: boolean;
};

@Component({
  standalone: true,
  imports: [NgIf, CurrencyPipe, RouterLink],
  template: `
  <section class="container my-4" *ngIf="product; else loading">
    <div class="row g-4">
      <div class="col-md-5">
        <img src="/assets/tyre.png" class="img-fluid border rounded" alt="llanta" />
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
  private http = inject(HttpClient);
  product?: Product;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<Product>(`/api/products/${id}`).subscribe(p => this.product = p);
  }

  addToCart() {
    // aquí puedes inyectar tu CartStore cuando lo tengas listo
    alert('TODO: conectar con CartStore e incrementar cantidad');
  }
}
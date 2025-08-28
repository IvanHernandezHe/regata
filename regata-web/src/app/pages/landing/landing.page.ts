import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
  <header class="bg-dark text-white py-5 mb-4">
    <div class="container text-center">
      <h1 class="display-5 fw-bold">Regata</h1>
      <p class="lead">Llantas con instalación a domicilio y recompensas por compra.</p>
      <a class="btn btn-danger btn-lg" routerLink="/shop">Comprar ahora</a>
    </div>
  </header>
  <section class="container">
    <div class="row text-center g-3">
      <div class="col-md">
        <div class="p-4 border rounded-3">4x3 en marcas selectas</div>
      </div>
      <div class="col-md">
        <div class="p-4 border rounded-3">Instalación a domicilio</div>
      </div>
      <div class="col-md">
        <div class="p-4 border rounded-3">Gana puntos por cada compra</div>
      </div>
    </div>
  </section>
  `
})
export class LandingPage {}
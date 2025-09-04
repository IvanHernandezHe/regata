import { Component } from '@angular/core';
import { AuthWidgetComponent } from '../../shared/components/auth-widget/auth-widget.component';

@Component({
  standalone: true,
  imports: [AuthWidgetComponent],
  styles: [`
    .auth-hero { background: linear-gradient(180deg, #f8f9fa, #fff); }
  `],
  template: `
  <section class="auth-hero py-4 py-lg-5 border-bottom">
    <div class="container">
      <h1 class="h3 m-0">Tu cuenta</h1>
      <p class="text-muted m-0">Inicia sesión o crea una nueva cuenta.</p>
    </div>
  </section>
  <section class="container my-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-6 col-lg-5">
        <app-auth-widget></app-auth-widget>
      </div>
    </div>
  </section>
  `
})
export class AuthPage {}


import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [RouterLink],
  styles: [`
    footer { width: 100%; }
    .footer a { color: rgba(255,255,255,.85); text-decoration: none; }
    .footer a:hover { color: #fff; text-decoration: underline; }
    .footer h6 { letter-spacing: .02em; }
    .muted { color: rgba(255,255,255,.65); }
  `],
  template: `
  <footer class="footer bg-dark text-light mt-5">
    <div class="container py-5">
      <div class="row g-4">
        <div class="col-12 col-md-3">
          <h6 class="text-uppercase small fw-bold">Nosotros</h6>
          <ul class="list-unstyled m-0">
            <li class="mb-2"><a routerLink="/nosotros">Quiénes somos</a></li>
            <li class="mb-2"><a href="#">Términos y condiciones</a></li>
            <li class="mb-2"><a routerLink="/servicios">Servicios</a></li>
            <li class="mb-2"><a href="#">Sucursales</a></li>
          </ul>
        </div>
        <div class="col-12 col-md-3">
          <h6 class="text-uppercase small fw-bold">Servicio al cliente</h6>
          <ul class="list-unstyled m-0">
            <li class="mb-2"><a href="#">Preguntas frecuentes</a></li>
            <li class="mb-2"><a href="#">Políticas de privacidad</a></li>
            <li class="mb-2"><a href="#">Envíos, devoluciones y cancelaciones</a></li>
            <li class="mb-2"><a href="#">Garantía</a></li>
            <li class="mb-2"><a href="#">Contacto</a></li>
            <li class="mb-2"><a href="#">Profeco</a></li>
            <li class="mb-2"><a href="#">Condusef</a></li>
          </ul>
        </div>
        <div class="col-12 col-md-3">
          <h6 class="text-uppercase small fw-bold">Tu cuenta</h6>
          <ul class="list-unstyled m-0">
            <li class="mb-2"><a routerLink="/perfil">Información personal</a></li>
            <li class="mb-2"><a href="#">Pedidos</a></li>
            <li class="mb-2"><a href="#">Créditos</a></li>
            <li class="mb-2"><a href="#">Direcciones</a></li>
            <li class="mb-2"><a href="#">Vales de descuento</a></li>
            <li class="mb-2"><a href="#">Puntos de fidelidad</a></li>
          </ul>
        </div>
        <div class="col-12 col-md-3">
          <h6 class="text-uppercase small fw-bold">Contáctanos</h6>
          <address class="m-0 small muted">
            <div class="mb-2">Regata S.A. de C.V.</div>
            <div class="mb-2">Calle Ejemplo 123, Col. Centro</div>
            <div class="mb-2">Ciudad de México, México</div>
            <div class="mb-2">Tel: <a href="tel:5555550000">(55) 5555 0000</a></div>
            <div>Email: <a href="mailto:hola@regata.mx">hola@regata.mx</a></div>
          </address>
        </div>
      </div>
      <div class="border-top border-secondary mt-4 pt-3 small d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-2">
        <div class="muted">© {{year}} Regata. Todos los derechos reservados.</div>
        <div class="d-flex gap-3">
          <a href="#" class="muted">Privacidad</a>
          <a href="#" class="muted">Términos</a>
          <a routerLink="/blog" class="muted">Blog</a>
        </div>
      </div>
    </div>
  </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}


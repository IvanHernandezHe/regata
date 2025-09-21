import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  styles: [`
    .card { border-radius: .75rem; border: 1px solid rgba(0,0,0,.08); background: #fff; }
    .help-grid { display: grid; grid-template-columns: repeat(1, minmax(0,1fr)); gap: 1rem; }
    @media (min-width: 768px) { .help-grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
    .help-tile { padding: 1rem; display: flex; gap: .8rem; align-items: center; }
    .help-tile lucide-icon { color: var(--jdm-red); }
    .contact { display: grid; gap: .5rem; }
    .contact a { text-decoration: none; }
    /* Dark theme */
    :host-context([data-bs-theme="dark"]) .card { background: #0f0f0f; border-color: #2a2a2a; }
  `],
  template: `
  <section class="container my-4">
    <nav class="small mb-2"><a routerLink="/">Inicio</a> › Ayuda</nav>
    <h1 class="h4 mb-3">Ayuda y Emergencias</h1>

    <div class="card p-3 mb-3">
      <div class="help-grid">
        <div class="help-tile">
          <lucide-icon name="life-buoy" size="22" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
          <div>
            <div class="fw-semibold">Asistencia inmediata</div>
            <small class="text-muted">¿Neumático dañado? Contáctanos ahora.</small>
          </div>
        </div>
        <div class="help-tile">
          <lucide-icon name="message-circle" size="22" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
          <div>
            <div class="fw-semibold">WhatsApp</div>
            <small class="text-muted">Respuesta rápida por chat.</small>
          </div>
        </div>
        <div class="help-tile">
          <lucide-icon name="phone" size="22" [strokeWidth]="2.5" aria-hidden="true"></lucide-icon>
          <div>
            <div class="fw-semibold">Llámanos</div>
            <small class="text-muted">Horario: 9:00–18:00 hrs.</small>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 align-items-stretch">
      <div class="col-12 col-md-6">
        <div class="card p-3 h-100">
          <h2 class="h6">Contactos</h2>
          <div class="contact">
            <div><span class="text-muted">Teléfono: </span><a href="tel:5555555555">(55) 5555 5555</a></div>
            <div><span class="text-muted">WhatsApp: </span><a [href]="waLink" target="_blank" rel="noopener">Escríbenos</a></div>
            <div><span class="text-muted">Correo: </span><a href="mailto:hola@regata.mx">hola@regata.mx</a></div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card p-3 h-100">
          <h2 class="h6">Consejos rápidos</h2>
          <ul class="m-0 ps-3 small">
            <li>Evita circular si detectas daño severo en la llanta.</li>
            <li>Revisa la presión de todas las llantas antes de continuar.</li>
            <li>Comparte tu ubicación al contactar soporte para una atención más rápida.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
  `
})
export class AyudaPage {
  readonly waNumber = '5215555555555';
  readonly waLink = `https://wa.me/${this.waNumber}?text=${encodeURIComponent('Hola, necesito ayuda con mis llantas')}`;
}

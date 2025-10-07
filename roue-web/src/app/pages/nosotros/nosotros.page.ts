import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <article class="nosotros-page">
      <section class="nosotros-hero position-relative overflow-hidden text-white">
        <div class="container py-5">
          <div class="row align-items-center gy-4">
            <div class="col-lg-6">
              <span class="sticker sticker-red mb-3">Roue Performance</span>
              <h1 class="display-4 text-uppercase drift-in">Impulsamos cada kilómetro</h1>
              <p class="lead text-white-50 mb-4">
                Somos especialistas en llantas premium que combinan ingeniería avanzada, asesoría personalizada
                y logística inmediata para mantener tu flota y tus proyectos siempre en movimiento.
              </p>
              <div class="d-flex flex-wrap gap-3">
                <div class="stat-card">
                  <span class="stat-number">18+</span>
                  <span class="stat-label">Años optimizando el desempeño vehicular</span>
                </div>
                <div class="stat-card">
                  <span class="stat-number">4800+</span>
                  <span class="stat-label">Vehículos equipados cada año</span>
                </div>
                <div class="stat-card">
                  <span class="stat-number">9.7/10</span>
                  <span class="stat-label">Índice de satisfacción en servicio y asesoría</span>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="ratio ratio-4x3 image-frame rounded-4 shadow-lg" data-slot="hero">
                <div class="image-slot">
                  <span class="placeholder-text">Inserta aquí tu imagen hero del showroom o taller</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="hero-accent"></div>
      </section>

      <section class="py-5 bg-body">
        <div class="container">
          <div class="row align-items-center gy-5">
            <div class="col-lg-6 order-lg-2">
              <div class="image-stack">
                <div class="ratio ratio-4x3 image-frame rounded-4 mb-4" data-slot="historia-principal">
                  <div class="image-slot">
                    <span class="placeholder-text">Coloca una foto del equipo montando llantas</span>
                  </div>
                </div>
                <div class="image-stack-secondary">
                  <div class="ratio ratio-1x1 image-frame rounded-4" data-slot="historia-detalle">
                    <div class="image-slot">
                      <span class="placeholder-text">Añade un detalle de tu almacén o inventario</span>
                    </div>
                  </div>
                  <div class="ratio ratio-1x1 image-frame rounded-4" data-slot="historia-ambiente">
                    <div class="image-slot">
                      <span class="placeholder-text">Incluye una toma de instalaciones o sala de ventas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6 order-lg-1">
              <span class="sticker mb-3">Nuestra historia</span>
              <h2 class="section-title display-6">Del taller boutique a la experiencia high performance</h2>
              <p class="text-muted mb-4">
                Nacimos como un pequeño garage apasionado por el grip perfecto y hoy somos el aliado estratégico para
                conductores, flotas y concesionarios que buscan llantas confiables, atractivas y listas para cualquier reto.
              </p>
              <div class="story-timeline">
                <div class="timeline-item">
                  <div class="timeline-year">2009</div>
                  <p class="timeline-copy">Abrimos nuestra primera bodega especializada en llantas de alto rendimiento.</p>
                </div>
                <div class="timeline-item">
                  <div class="timeline-year">2014</div>
                  <p class="timeline-copy">Integramos servicios móviles de montaje y balanceo para flotas.</p>
                </div>
                <div class="timeline-item">
                  <div class="timeline-year">2020</div>
                  <p class="timeline-copy">Lanzamos programas de reciclaje y reacondicionamiento responsable de llantas.</p>
                </div>
                <div class="timeline-item">
                  <div class="timeline-year">Hoy</div>
                  <p class="timeline-copy">Diseñamos soluciones a medida para amantes de la conducción, SUVs y vehículos comerciales.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 position-relative">
        <div class="container">
          <div class="text-center mb-5">
            <span class="sticker sticker-red mb-3">Valores</span>
            <h2 class="section-title display-6">Principios que nos guían en cada instalación</h2>
            <p class="text-muted col-lg-8 mx-auto">
              Cada decisión que tomamos se enfoca en seguridad, eficiencia y una asesoría honesta para que tu inversión rinda al máximo.
            </p>
          </div>
          <div class="row g-4">
            <div class="col-md-4">
              <div class="value-card h-100">
                <div class="value-label">01</div>
                <h3 class="h4">Seguridad comprobada</h3>
                <p class="text-muted mb-0">Protocolos certificados, equipos calibrados y pruebas de calidad en cada llanta que entregamos.</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="value-card h-100">
                <div class="value-label">02</div>
                <h3 class="h4">Stock inteligente</h3>
                <p class="text-muted mb-0">Inventarios dinámicos, entregas express y tecnología para rastrear disponibilidad en tiempo real.</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="value-card h-100">
                <div class="value-label">03</div>
                <h3 class="h4">Asesoría experta</h3>
                <p class="text-muted mb-0">Especialistas que entienden tu estilo de conducción y recomiendan la llanta ideal para cada terreno.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 team-section">
        <div class="container">
          <div class="row align-items-center gy-4">
            <div class="col-lg-5">
              <span class="sticker mb-3">Equipo</span>
              <h2 class="section-title display-6">El equipo que pone tracción a tus metas</h2>
              <p class="text-muted">
                Asesores técnicos, ingenieros en desempeño y especialistas en logística trabajando juntos para ofrecer
                un servicio integral antes, durante y después de la venta.
              </p>
              <ul class="list-unstyled text-muted small mb-0">
                <li class="mb-2">• Certificaciones en control de calidad, montaje y balanceo.</li>
                <li class="mb-2">• Capacitación constante en nuevas tecnologías y marcas premium.</li>
                <li>• Vocación por entender las necesidades de cada conductor y flota.</li>
              </ul>
            </div>
            <div class="col-lg-7">
              <div class="row g-4">
                <div class="col-sm-6">
                  <div class="team-card h-100">
                    <div class="ratio ratio-1x1 image-frame team-photo" data-slot="equipo-lider-tecnico">
                      <div class="image-slot">
                        <span class="placeholder-text">Agrega la foto del líder técnico</span>
                      </div>
                    </div>
                    <h4 class="h5 mt-3 mb-1">Nombre del Líder Técnico</h4>
                    <p class="text-muted small mb-0">Director de ingeniería &mdash; Especialista en compuestos y performance.</p>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="team-card h-100">
                    <div class="ratio ratio-1x1 image-frame team-photo" data-slot="equipo-asesor-comercial">
                      <div class="image-slot">
                        <span class="placeholder-text">Añade la imagen del asesor comercial</span>
                      </div>
                    </div>
                    <h4 class="h5 mt-3 mb-1">Nombre del Asesor Comercial</h4>
                    <p class="text-muted small mb-0">Experto en segmentar líneas, garantías y paquetes empresariales.</p>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="team-card h-100">
                    <div class="ratio ratio-1x1 image-frame team-photo" data-slot="equipo-servicio">
                      <div class="image-slot">
                        <span class="placeholder-text">Inserta la foto del especialista en servicio</span>
                      </div>
                    </div>
                    <h4 class="h5 mt-3 mb-1">Nombre del Especialista de Servicio</h4>
                    <p class="text-muted small mb-0">Supervisor de montaje &mdash; Certificado en balanceo y alineación.</p>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="team-card h-100">
                    <div class="ratio ratio-1x1 image-frame team-photo" data-slot="equipo-logistica">
                      <div class="image-slot">
                        <span class="placeholder-text">Suma la imagen del coordinador logístico</span>
                      </div>
                    </div>
                    <h4 class="h5 mt-3 mb-1">Nombre del Coordinador Logístico</h4>
                    <p class="text-muted small mb-0">Gestiona inventarios, rutas y alianzas con proveedores.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5">
        <div class="container">
          <div class="cta-banner rounded-4 p-4 p-lg-5 text-white overflow-hidden position-relative">
            <div class="row align-items-center g-4">
              <div class="col-lg-7">
                <h2 class="display-6 mb-3">¿Listo para acelerar con la cobertura ideal?</h2>
                <p class="text-white-50 mb-0">
                  Diseñamos propuestas personalizadas para distribuidores, talleres y pilotos que exigen desempeño.
                  Contáctanos y llevemos tus proyectos al siguiente nivel.
                </p>
              </div>
              <div class="col-lg-5">
                <div class="ratio ratio-16x9 image-frame" data-slot="cta">
                  <div class="image-slot image-slot-light">
                    <span class="placeholder-text">Reserva este espacio para una imagen de vitrina o pista</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="cta-overlay"></div>
          </div>
        </div>
      </section>
    </article>
  `,
  styles: [
    `
    :host { display: block; }

    .nosotros-hero {
      background: linear-gradient(135deg, rgba(217, 66, 66, 0.92), rgba(11, 11, 11, 0.95)),
                  radial-gradient(850px 520px at 15% -10%, rgba(61, 255, 181, 0.25), transparent 65%);
    }
    .hero-accent {
      position: absolute;
      inset: auto 0 -120px 0;
      height: 240px;
      background: radial-gradient(60% 60% at 50% 0%, rgba(255, 255, 255, 0.25), transparent);
      opacity: 0.7;
      pointer-events: none;
    }

    .stat-card {
      min-width: 160px;
      padding: 1.25rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(10px);
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
    }
    .stat-number {
      display: block;
      font-family: var(--font-display);
      font-size: clamp(2rem, 4vw, 2.75rem);
      letter-spacing: 1px;
    }
    .stat-label {
      display: block;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      line-height: 1.3;
    }

    .image-frame {
      position: relative;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .image-frame img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .image-slot {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1.5rem;
      border: 2px dashed rgba(217, 66, 66, 0.55);
      color: rgba(217, 66, 66, 0.8);
      background: rgba(255, 255, 255, 0.55);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      font-weight: 700;
    }
    .image-slot-light {
      background: rgba(12, 12, 12, 0.75);
      border-color: rgba(255, 255, 255, 0.35);
      color: rgba(255, 255, 255, 0.65);
    }
    .placeholder-text { max-width: 18ch; }

    .image-stack { position: relative; }
    .image-stack-secondary {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .story-timeline {
      position: relative;
      padding-left: 2.5rem;
      margin-top: 2rem;
    }
    .story-timeline::before {
      content: "";
      position: absolute;
      left: 1.2rem;
      top: 0.2rem;
      bottom: 0.2rem;
      width: 2px;
      background: linear-gradient(180deg, rgba(217, 66, 66, 0.75), transparent);
    }
    .timeline-item { position: relative; padding-bottom: 1.75rem; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-item::before {
      content: "";
      position: absolute;
      left: -1.3rem;
      top: 0.35rem;
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 50%;
      background: var(--jdm-red);
      box-shadow: 0 0 0 6px rgba(217, 66, 66, 0.2);
    }
    .timeline-year {
      font-family: var(--font-display);
      font-size: 1.2rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--jdm-red);
      margin-bottom: 0.25rem;
    }
    .timeline-copy {
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.72);
      margin-bottom: 0;
    }

    .value-card {
      padding: 2.25rem 2rem;
      border-radius: 1.25rem;
      border: 1px solid rgba(217, 66, 66, 0.18);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.65));
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.08);
    }
    .value-label {
      display: inline-flex;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      background: rgba(217, 66, 66, 0.15);
      color: var(--jdm-red);
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    .team-section {
      background: radial-gradient(1200px 680px at 15% 20%, rgba(217, 66, 66, 0.1), transparent 60%),
                  var(--off-white);
    }
    .team-card {
      padding: 1.75rem;
      border-radius: 1.25rem;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 20px 34px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .team-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 28px 44px rgba(0, 0, 0, 0.12);
    }
    .team-photo {
      border-radius: 1rem;
      overflow: hidden;
    }

    .cta-banner {
      background: linear-gradient(120deg, rgba(11, 11, 11, 0.95), rgba(217, 66, 66, 0.85));
      box-shadow: 0 22px 45px rgba(0, 0, 0, 0.28);
    }
    .cta-overlay {
      position: absolute;
      inset: -20%;
      background: radial-gradient(45% 45% at 85% 20%, rgba(61, 255, 181, 0.35), transparent 60%);
      opacity: 0.5;
      pointer-events: none;
    }

    @media (max-width: 991.98px) {
      .stat-card { flex: 1 1 150px; }
      .story-timeline { padding-left: 2rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      .drift-in { animation: none !important; }
      .team-card:hover { transform: none; }
    }

    :host-context([data-bs-theme="dark"]) .nosotros-hero {
      background: linear-gradient(135deg, rgba(217, 66, 66, 0.88), rgba(0, 0, 0, 0.95)),
                  radial-gradient(800px 480px at 12% -12%, rgba(61, 255, 181, 0.18), transparent 70%);
    }
    :host-context([data-bs-theme="dark"]) .hero-accent {
      opacity: 0.45;
      background: radial-gradient(60% 60% at 50% 0%, rgba(61, 255, 181, 0.28), transparent);
    }
    :host-context([data-bs-theme="dark"]) .stat-card {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.12);
    }
    :host-context([data-bs-theme="dark"]) .timeline-copy {
      color: rgba(232, 232, 232, 0.82);
    }
    :host-context([data-bs-theme="dark"]) .story-timeline::before {
      background: linear-gradient(180deg, rgba(217, 66, 66, 0.55), transparent);
    }
    :host-context([data-bs-theme="dark"]) .timeline-item::before {
      box-shadow: 0 0 0 6px rgba(217, 66, 66, 0.35);
    }
    :host-context([data-bs-theme="dark"]) .value-card {
      background: linear-gradient(180deg, rgba(35, 35, 35, 0.95), rgba(25, 25, 25, 0.92));
      border-color: rgba(217, 66, 66, 0.25);
      box-shadow: 0 16px 44px rgba(0, 0, 0, 0.35);
    }
    :host-context([data-bs-theme="dark"]) .value-card p {
      color: rgba(232, 232, 232, 0.78) !important;
    }
    :host-context([data-bs-theme="dark"]) .value-label {
      background: rgba(217, 66, 66, 0.32);
      color: #fff;
    }
    :host-context([data-bs-theme="dark"]) .team-section {
      background: radial-gradient(1200px 680px at 15% 20%, rgba(217, 66, 66, 0.22), transparent 65%),
                  rgba(10, 10, 10, 0.95);
    }
    :host-context([data-bs-theme="dark"]) .team-card {
      background: rgba(20, 20, 20, 0.95);
      border-color: rgba(255, 255, 255, 0.05);
    }
    :host-context([data-bs-theme="dark"]) .team-card:hover {
      box-shadow: 0 32px 46px rgba(0, 0, 0, 0.5);
    }
    :host-context([data-bs-theme="dark"]) .team-card .text-muted {
      color: rgba(232, 232, 232, 0.7) !important;
    }
    :host-context([data-bs-theme="dark"]) .image-frame {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
    }
    :host-context([data-bs-theme="dark"]) .image-slot {
      background: rgba(12, 12, 12, 0.75);
      border-color: rgba(217, 66, 66, 0.55);
      color: rgba(255, 255, 255, 0.7);
    }
    :host-context([data-bs-theme="dark"]) .image-slot-light {
      background: rgba(12, 12, 12, 0.9);
      border-color: rgba(255, 255, 255, 0.25);
      color: rgba(255, 255, 255, 0.78);
    }
    `
  ]
})
export class NosotrosPage {}

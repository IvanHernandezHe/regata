import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <article class="servicios-page">
      <section class="service-hero text-white position-relative overflow-hidden">
        <div class="hero-media">
          <img
            src="https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=1600&q=80"
            alt="Técnico montando llanta en un taller especializado"
            loading="lazy"
          />
          <div class="hero-overlay"></div>
        </div>
        <div class="container py-5 position-relative">
          <div class="row align-items-end gy-4">
            <div class="col-lg-7">
              <span class="sticker sticker-red mb-3">Servicios Roue</span>
              <h1 class="display-4 text-uppercase drift-in">Performance confiable para cualquier terreno</h1>
              <p class="lead text-white-50 mb-4">
                Desde el montaje premium hasta programas de mantenimiento predictivo, diseñamos soluciones integrales
                para autos deportivos, SUVs, camiones ligeros y flotas comerciales.
              </p>
              <div class="d-flex flex-wrap gap-3">
                <div class="hero-pill">
                  <span class="pill-value">24/7</span>
                  <span class="pill-label">Soporte móvil</span>
                </div>
                <div class="hero-pill">
                  <span class="pill-value">+140</span>
                  <span class="pill-label">Marcas certificadas</span>
                </div>
                <div class="hero-pill">
                  <span class="pill-value">99.4%</span>
                  <span class="pill-label">Diagnósticos acertados</span>
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="hero-card shadow-lg">
                <h2 class="h4 mb-3">Solicita una sesión diagnóstica</h2>
                <p class="text-white-50 mb-4">
                  Verificamos desgaste, presión, alineación y condiciones del camino para recomendarte la llanta exacta.
                </p>
                <div class="d-flex flex-column flex-md-row gap-3">
                  <button type="button" class="btn btn-jdm">Agendar ahora</button>
                  <button type="button" class="btn btn-outline-light">Ver planes empresariales</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 bg-body service-grid">
        <div class="container">
          <div class="text-center mb-5">
            <span class="sticker mb-2">Experiencia integral</span>
            <h2 class="section-title display-6">Domina cada kilómetro con nuestros servicios insignia</h2>
            <p class="text-muted col-lg-8 mx-auto">
              Cada solución combina ingeniería de precisión, herramientas calibradas y especialistas certificados para
              entregarte resultados impecables desde el primer montaje.
            </p>
          </div>
          <div class="row g-4">
            <div class="col-md-6 col-xl-3">
              <article class="service-card h-100">
                <figure class="service-media ratio ratio-4x3">
                  <img
                    src="https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=900&q=80"
                    alt="Especialista instalando llanta de alto desempeño"
                    loading="lazy"
                  />
                </figure>
                <div class="service-body">
                  <span class="service-badge">01</span>
                  <h3 class="h4">Montaje y balanceo de precisión</h3>
                  <p class="text-muted">
                    Maquinaria Hunter® Road Force y torque controlado para proteger tu suspensión y brindar suavidad al volante.
                  </p>
                  <ul class="text-muted small">
                    <li>Diagnóstico digital del aro en segundos</li>
                    <li>Balanceo dinámico con microajustes</li>
                    <li>Revisión de sensores TPMS y calibración</li>
                  </ul>
                </div>
              </article>
            </div>
            <div class="col-md-6 col-xl-3">
              <article class="service-card h-100">
                <figure class="service-media ratio ratio-4x3">
                  <img
                    src="https://images.unsplash.com/photo-1605296862957-0e957c31c27d?auto=format&fit=crop&w=900&q=80"
                    alt="Vehículo sobre rampa durante servicio de alineación"
                    loading="lazy"
                  />
                </figure>
                <div class="service-body">
                  <span class="service-badge">02</span>
                  <h3 class="h4">Alineación inteligente en 3D</h3>
                  <p class="text-muted">
                    Ajustes en tiempo real con visión computarizada, asegurando desgaste uniforme y respuesta precisa en curvas.
                  </p>
                  <ul class="text-muted small">
                    <li>Lectura milimétrica de caída y convergencia</li>
                    <li>Reportes visuales para tu historial</li>
                    <li>Configuración sport, touring o carga pesada</li>
                  </ul>
                </div>
              </article>
            </div>
            <div class="col-md-6 col-xl-3">
              <article class="service-card h-100">
                <figure class="service-media ratio ratio-4x3">
                  <img
                    src="https://images.unsplash.com/photo-1542367592-8849eb950fd8?auto=format&fit=crop&w=900&q=80"
                    alt="Camión de asistencia móvil para cambio de llantas"
                    loading="lazy"
                  />
                </figure>
                <div class="service-body">
                  <span class="service-badge">03</span>
                  <h3 class="h4">Pit-stop móvil 24/7</h3>
                  <p class="text-muted">
                    Unidades completamente equipadas llegan a tu domicilio, flotilla o pista para resolver emergencias sin detenerte.
                  </p>
                  <ul class="text-muted small">
                    <li>GPS en ruta y ETA en tiempo real</li>
                    <li>Montaje, vulcanizado y programación TPMS</li>
                    <li>Disponibilidad para autopistas y perímetro urbano</li>
                  </ul>
                </div>
              </article>
            </div>
            <div class="col-md-6 col-xl-3">
              <article class="service-card h-100">
                <figure class="service-media ratio ratio-4x3">
                  <img
                    src="https://images.unsplash.com/photo-1513028325910-4c5090065ff0?auto=format&fit=crop&w=900&q=80"
                    alt="Consultor mostrando opciones de llantas premium a cliente"
                    loading="lazy"
                  />
                </figure>
                <div class="service-body">
                  <span class="service-badge">04</span>
                  <h3 class="h4">Consultoría de performance</h3>
                  <p class="text-muted">
                    Análisis de hábitos de manejo, telemetría y objetivos para recomendar combinaciones óptimas de llantas y rines.
                  </p>
                  <ul class="text-muted small">
                    <li>Sesiones one-to-one con especialista</li>
                    <li>Plan de rotación y mantenimiento anual</li>
                    <li>Acceso a beneficios y garantías extendidas</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 premium-plans">
        <div class="container">
          <div class="row align-items-center gy-5">
            <div class="col-lg-5">
              <span class="sticker sticker-red mb-3">Planes a medida</span>
              <h2 class="section-title display-6">Selecciona el paquete que potencia tu conducción</h2>
              <p class="text-muted mb-4">
                Personalizamos coberturas para conductores urbanos, entusiastas de track-days y flotillas que buscan minimizar paros
                operativos. Configura la combinación perfecta de inspecciones, reemplazos y asistencia.
              </p>
              <div class="d-flex flex-wrap gap-3">
                <div class="plan-chip">Cobertura nacional</div>
                <div class="plan-chip">Garantía antirrotura</div>
                <div class="plan-chip">Reportes digitales</div>
              </div>
            </div>
            <div class="col-lg-7">
              <div class="row g-4">
                <div class="col-md-6">
                  <article class="plan-card h-100">
                    <div class="plan-header">
                      <h3 class="h4 mb-1">Track+ Sport</h3>
                      <p class="text-muted mb-0">Para autos performance y SUV premium</p>
                    </div>
                    <ul class="plan-list">
                      <li>Rotación y balanceo cada 5,000 km</li>
                      <li>Setup de alineación custom (street / track)</li>
                      <li>Soporte express en eventos y track-days</li>
                      <li>Acceso prioritario a llantas semi-slick</li>
                    </ul>
                    <div class="plan-footer">
                      <span class="plan-price">$2,890<span class="plan-price-period">/trimestre</span></span>
                      <button type="button" class="btn btn-outline-dark">Solicitar demo</button>
                    </div>
                  </article>
                </div>
                <div class="col-md-6">
                  <article class="plan-card plan-card-highlight h-100">
                    <div class="plan-header">
                      <span class="badge text-bg-danger">El favorito</span>
                      <h3 class="h4 mb-1">Fleet Guard Pro</h3>
                      <p class="text-muted mb-0">Ideal para flotillas comerciales y reparto</p>
                    </div>
                    <ul class="plan-list">
                      <li>Inspecciones predictivas con IoT</li>
                      <li>Reemplazo en sitio y préstamo de llantas</li>
                      <li>Alertas automáticas por desgaste/temperatura</li>
                      <li>Reportes KPI para operaciones y finanzas</li>
                    </ul>
                    <div class="plan-footer">
                      <span class="plan-price">$4,490<span class="plan-price-period">/trimestre</span></span>
                      <button type="button" class="btn btn-jdm">Hablar con un asesor</button>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 bg-body process-strip">
        <div class="container">
          <div class="row gy-4 align-items-center">
            <div class="col-lg-5">
              <span class="sticker mb-3">Proceso</span>
              <h2 class="section-title display-6">Así cuidamos tus llantas en tres pasos</h2>
              <p class="text-muted mb-4">
                Nuestro flujo combina datos, experiencia humana y seguimiento continuo para que cada instalación sea impecable
                y mantenga tu desempeño por más kilómetros.
              </p>
              <button type="button" class="btn btn-outline-dark">Descargar ficha técnica</button>
            </div>
            <div class="col-lg-7">
              <div class="process-timeline">
                <div class="process-item">
                  <div class="process-index">1</div>
                  <div>
                    <h3 class="h5 mb-1">Evaluación &amp; escaneo digital</h3>
                    <p class="text-muted mb-0">Levantamiento de datos con scanners 3D, lectura de presión y consulta de telemetría conectada.</p>
                  </div>
                </div>
                <div class="process-item">
                  <div class="process-index">2</div>
                  <div>
                    <h3 class="h5 mb-1">Intervención personalizada</h3>
                    <p class="text-muted mb-0">Selección de la llanta ideal, montaje, balanceo milimétrico y calibración TPMS/documentación.</p>
                  </div>
                </div>
                <div class="process-item">
                  <div class="process-index">3</div>
                  <div>
                    <h3 class="h5 mb-1">Seguimiento &amp; optimización</h3>
                    <p class="text-muted mb-0">Alertas proactivas, rotación programada y análisis para extender la vida útil del set completo.</p>
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
              <div class="col-lg-8">
                <h2 class="display-6 mb-3">¿Listo para agendar tu próximo servicio?</h2>
                <p class="text-white-50 mb-0">
                  Conéctate con nuestro equipo técnico, recibe una cotización instantánea y programa la visita en el horario que
                  mejor se adapte a tu operación.
                </p>
              </div>
              <div class="col-lg-4 text-lg-end">
                <button type="button" class="btn btn-jdm mb-3 mb-lg-0">Agendar servicio</button>
                <a href="tel:+529990001234" class="cta-phone d-inline-flex align-items-center gap-2">
                  <span class="cta-phone-icon">📞</span>
                  <span class="fw-semibold">+52 999 000 1234</span>
                </a>
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

    .service-hero {
      min-height: clamp(520px, 60vh, 680px);
      display: flex;
      align-items: flex-end;
    }
    .hero-media {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .hero-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.08);
      filter: brightness(0.55);
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(90% 80% at 20% 20%, rgba(217, 66, 66, 0.55), transparent 70%),
                  linear-gradient(120deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.55));
      mix-blend-mode: lighten;
    }
    .hero-card {
      background: rgba(12, 12, 12, 0.8);
      border-radius: 1.5rem;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(16px);
    }
    .hero-pill {
      min-width: 142px;
      padding: 0.75rem 1rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .pill-value {
      font-family: var(--font-display);
      font-size: 1.4rem;
    }
    .pill-label {
      color: rgba(255, 255, 255, 0.7);
    }

    .service-grid .service-card {
      background: #ffffff;
      border-radius: 1.5rem;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .service-grid .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 24px 44px rgba(0, 0, 0, 0.12);
    }
    .service-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .service-body {
      padding: 1.8rem;
    }
    .service-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 15px;
      background: rgba(217, 66, 66, 0.12);
      color: var(--jdm-red);
      font-weight: 700;
      margin-bottom: 1.25rem;
      letter-spacing: 0.08em;
    }
    .service-body ul {
      padding-left: 1.1rem;
      margin-bottom: 0;
    }
    .service-body ul li {
      margin-bottom: 0.35rem;
    }

    .premium-plans {
      background: radial-gradient(1200px 680px at 15% 30%, rgba(217, 66, 66, 0.12), transparent 60%);
    }
    .plan-chip {
      padding: 0.6rem 1rem;
      border-radius: 999px;
      background: rgba(217, 66, 66, 0.12);
      color: var(--jdm-red);
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .plan-card {
      border-radius: 1.5rem;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      padding: 2.2rem 2rem;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.4rem;
    }
    .plan-card-highlight {
      background: linear-gradient(160deg, rgba(217, 66, 66, 0.92), rgba(11, 11, 11, 0.95));
      color: #ffffff;
      border: none;
      box-shadow: 0 30px 60px rgba(217, 66, 66, 0.25);
    }
    .plan-card-highlight .text-muted { color: rgba(255, 255, 255, 0.72) !important; }
    .plan-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.55rem;
      color: rgba(0, 0, 0, 0.7);
    }
    .plan-card-highlight .plan-list { color: rgba(255, 255, 255, 0.8); }
    .plan-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .plan-price {
      font-family: var(--font-display);
      font-size: 2rem;
      letter-spacing: 0.04em;
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
    }
    .plan-price-period {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: rgba(0, 0, 0, 0.55);
    }
    .plan-card-highlight .plan-price-period { color: rgba(255, 255, 255, 0.7); }

    .process-strip {
      position: relative;
      overflow: hidden;
    }
    .process-strip::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(217, 66, 66, 0.08), transparent 55%);
      pointer-events: none;
    }
    .process-timeline {
      display: grid;
      gap: 1.75rem;
      position: relative;
      padding-left: 3rem;
    }
    .process-timeline::before {
      content: '';
      position: absolute;
      left: 1.1rem;
      top: 0.5rem;
      bottom: 0.5rem;
      width: 3px;
      background: linear-gradient(180deg, rgba(217, 66, 66, 0.85), transparent);
    }
    .process-item {
      display: flex;
      gap: 1.2rem;
      position: relative;
    }
    .process-index {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: var(--jdm-red);
      color: #ffffff;
      font-family: var(--font-display);
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 24px rgba(217, 66, 66, 0.35);
    }

    .cta-banner {
      background: linear-gradient(130deg, rgba(11, 11, 11, 0.95), rgba(217, 66, 66, 0.85));
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    }
    .cta-overlay {
      position: absolute;
      inset: -20%;
      background: radial-gradient(45% 45% at 85% 20%, rgba(61, 255, 181, 0.35), transparent 60%);
      opacity: 0.45;
      pointer-events: none;
    }
    .cta-phone {
      color: #ffffff;
      text-decoration: none;
      letter-spacing: 0.04em;
    }
    .cta-phone-icon {
      display: inline-flex;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    @media (max-width: 991.98px) {
      .hero-card { margin-top: 2rem; }
      .plan-footer { flex-direction: column; align-items: flex-start; }
      .plan-price { font-size: 1.8rem; }
      .service-grid .service-card:hover { transform: none; }
    }

    @media (max-width: 767.98px) {
      .service-body { padding: 1.5rem; }
      .process-timeline { padding-left: 0; }
      .process-timeline::before { left: 0.75rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      .service-grid .service-card:hover { transform: none; }
      .drift-in { animation: none !important; }
    }

    :host-context([data-bs-theme="dark"]) .service-grid .service-card,
    :host-context([data-bs-theme="dark"]) .plan-card {
      background: rgba(10, 10, 10, 0.92);
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
    }
    :host-context([data-bs-theme="dark"]) .service-body,
    :host-context([data-bs-theme="dark"]) .plan-card {
      color: #f0f0f0;
    }
    :host-context([data-bs-theme="dark"]) .service-body .text-muted,
    :host-context([data-bs-theme="dark"]) .plan-card .text-muted,
    :host-context([data-bs-theme="dark"]) .process-strip .text-muted {
      color: rgba(232, 232, 232, 0.75) !important;
    }
    :host-context([data-bs-theme="dark"]) .plan-price-period {
      color: rgba(232, 232, 232, 0.65);
    }
    :host-context([data-bs-theme="dark"]) .plan-card-highlight {
      background: linear-gradient(160deg, rgba(217, 66, 66, 0.88), rgba(0, 0, 0, 0.95));
      box-shadow: 0 30px 60px rgba(217, 66, 66, 0.4);
    }
    :host-context([data-bs-theme="dark"]) .process-timeline::before {
      background: linear-gradient(180deg, rgba(217, 66, 66, 0.6), transparent);
    }
    :host-context([data-bs-theme="dark"]) .process-index {
      box-shadow: 0 18px 32px rgba(217, 66, 66, 0.35);
    }
    :host-context([data-bs-theme="dark"]) .plan-list { color: rgba(232, 232, 232, 0.78); }
    :host-context([data-bs-theme="dark"]) .plan-card-highlight .plan-list { color: rgba(255, 255, 255, 0.85); }
    :host-context([data-bs-theme="dark"]) .plan-chip {
      background: rgba(217, 66, 66, 0.28);
      color: #ffffff;
    }
    :host-context([data-bs-theme="dark"]) .plan-card .btn-outline-dark {
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.55);
    }
    :host-context([data-bs-theme="dark"]) .plan-card .btn-outline-dark:hover,
    :host-context([data-bs-theme="dark"]) .plan-card .btn-outline-dark:focus {
      background: var(--jdm-red);
      border-color: var(--jdm-red);
      color: #ffffff;
    }
    :host-context([data-bs-theme="dark"]) .cta-banner {
      background: linear-gradient(130deg, rgba(0, 0, 0, 0.95), rgba(217, 66, 66, 0.88));
    }
    :host-context([data-bs-theme="dark"]) .cta-phone-icon {
      background: rgba(255, 255, 255, 0.22);
    }
    `
  ]
})
export class ServiciosPage {}

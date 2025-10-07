import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgFor],
  template: `
    <article class="blog-page">
      <section class="blog-hero position-relative overflow-hidden text-white">
        <img
          class="hero-image"
          src="https://images.unsplash.com/photo-1593941707874-ef25b8b2957b?auto=format&fit=crop&w=1900&q=80"
          alt="Vista nocturna de un auto deportivo equipado con llantas premium"
          loading="lazy"
        />
        <div class="hero-overlay"></div>
        <div class="container position-relative py-5">
          <div class="row gy-4 align-items-end">
            <div class="col-lg-7">
              <span class="sticker sticker-red mb-3">Insights Roue</span>
              <h1 class="display-4 text-uppercase drift-in">Historias de desempeño real sobre el asfalto</h1>
              <p class="lead text-white-50 mb-4">
                Analizamos tendencias en neumáticos, compartimos guías de mantenimiento y te acercamos a las experiencias de quienes confían en nosotros.
              </p>
              <div class="hero-tags d-flex flex-wrap gap-2">
                <span class="tag-chip">Mantenimiento</span>
                <span class="tag-chip">Performance</span>
                <span class="tag-chip">Flotillas</span>
                <span class="tag-chip">Novedades</span>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="hero-feature shadow-lg">
                <span class="badge text-bg-danger mb-3">Destacado</span>
                <h2 class="h4 mb-3">Cómo elegir la llanta perfecta para tu SUV híbrida</h2>
                <p class="text-white-50 mb-4">
                  Te mostramos los compuestos, patrones de banda y certificaciones que marcan la diferencia en consumo y agarre.
                </p>
                <div class="d-flex align-items-center gap-3">
                  <img
                    class="author-avatar"
                    src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80"
                    alt="Retrato del autor"
                    loading="lazy"
                  />
                  <div>
                    <span class="fw-semibold">Por Laura Méndez</span>
                    <div class="text-white-50 small">6 min de lectura · 02 Jul 2024</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 bg-body">
        <div class="container">
          <div class="row gy-4 align-items-start">
            <div class="col-lg-7">
              <article class="featured-card h-100">
                <div class="featured-media ratio ratio-16x9">
                  <img
                    src="https://images.unsplash.com/photo-1458063048042-0f265902e64b?auto=format&fit=crop&w=1200&q=80"
                    alt="Auto deportivo corriendo en pista mojada"
                    loading="lazy"
                  />
                </div>
                <div class="featured-content">
                  <span class="category-badge">Track Days</span>
                  <h2 class="h3 mb-3">Setups recomendados para dominar circuitos en temporada de lluvias</h2>
                  <p class="text-muted">
                    Presentamos combinaciones de llantas, presiones y ajustes de suspensión que te permiten bajar segundos sin sacrificar seguridad.
                  </p>
                  <div class="featured-meta text-muted small">
                    <span>Por Marco Vidal</span>
                    <span class="dot">•</span>
                    <span>08 Jul 2024</span>
                    <span class="dot">•</span>
                    <span>8 min de lectura</span>
                  </div>
                </div>
              </article>
            </div>
            <div class="col-lg-5">
              <div class="mini-grid">
                <article class="mini-card" *ngFor="let post of sidePosts">
                  <div class="mini-media">
                    <img [src]="post.image" [alt]="post.alt" loading="lazy" />
                  </div>
                  <div class="mini-body">
                    <span class="category-label">{{ post.category }}</span>
                    <h3 class="h5">{{ post.title }}</h3>
                    <p class="text-muted small mb-0">{{ post.summary }}</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 latest-posts">
        <div class="container">
          <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mb-4">
            <div>
              <span class="sticker sticker-red mb-2">Últimas entradas</span>
              <h2 class="section-title display-6 mb-0">Lo más reciente desde nuestra sala de pruebas</h2>
            </div>
            <div class="filter-chips d-flex flex-wrap gap-2 mt-3 mt-lg-0">
              <span class="filter-chip active">Todos</span>
              <span class="filter-chip">Tips rápidos</span>
              <span class="filter-chip">Tecnología</span>
              <span class="filter-chip">Historias de clientes</span>
              <span class="filter-chip">Noticias</span>
            </div>
          </div>
          <div class="row g-4">
            <div class="col-md-6 col-xl-4" *ngFor="let post of latestPosts">
              <article class="post-card h-100">
                <figure class="post-media ratio ratio-4x3">
                  <img [src]="post.image" [alt]="post.alt" loading="lazy" />
                </figure>
                <div class="post-body">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="category-label">{{ post.category }}</span>
                    <span class="dot">•</span>
                    <span class="date small text-muted">{{ post.date }}</span>
                  </div>
                  <h3 class="h4 mb-2">{{ post.title }}</h3>
                  <p class="text-muted">{{ post.summary }}</p>
                  <div class="author-row d-flex align-items-center gap-3">
                    <img class="author-avatar" [src]="post.authorAvatar" [alt]="post.author" loading="lazy" />
                    <div class="small text-muted">
                      <div class="fw-semibold text-body">{{ post.author }}</div>
                      <span>{{ post.readTime }} min de lectura</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 bg-body newsletter">
        <div class="container">
          <div class="row gy-4 align-items-center">
            <div class="col-lg-6">
              <span class="sticker mb-2">Newsletter</span>
              <h2 class="section-title display-6">Recibe primero nuestras comparativas y lanzamientos</h2>
              <p class="text-muted">
                Resúmenes mensuales, invitaciones a track days privados y promociones especiales para nuestra comunidad de performance.
              </p>
              <div class="d-flex flex-column flex-sm-row gap-3">
                <input type="email" class="form-control form-control-lg" placeholder="tu@email.com" aria-label="Correo electrónico" />
                <button type="button" class="btn btn-jdm btn-lg">Suscribirme</button>
              </div>
              <small class="text-muted d-block mt-2">Sin spam, puedes darte de baja en cualquier momento.</small>
            </div>
            <div class="col-lg-6">
              <div class="newsletter-media ratio ratio-4x3">
                <img
                  src="https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=1200&q=80"
                  alt="Equipo técnico analizando neumáticos en laboratorio"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 knowledge-strip text-white">
        <div class="container">
          <div class="row gy-4 align-items-center">
            <div class="col-lg-4">
              <h2 class="display-6 mb-3">Explora nuestras guías técnicas</h2>
              <p class="text-white-50 mb-0">
                Documentos descargables, fichas técnicas y checklists para elevar tus procesos de mantenimiento y operación de flotillas.
              </p>
            </div>
            <div class="col-lg-8">
              <div class="resource-grid">
                <article class="resource-card">
                  <div class="resource-icon">DOC</div>
                  <div>
                    <h3 class="h5 mb-1">Manual de presión ideal por carga y clima</h3>
                    <p class="text-white-50 mb-0">Actualizado 2024 · Incluye calculadora y tablas de referencia.</p>
                  </div>
                </article>
                <article class="resource-card">
                  <div class="resource-icon">LAB</div>
                  <div>
                    <h3 class="h5 mb-1">Informe especial: nuevos compuestos de sílice</h3>
                    <p class="text-white-50 mb-0">Descubre cómo impactan en frenado, ruido y durabilidad.</p>
                  </div>
                </article>
                <article class="resource-card">
                  <div class="resource-icon">PRO</div>
                  <div>
                    <h3 class="h5 mb-1">Checklist pre track-day</h3>
                    <p class="text-white-50 mb-0">Todo lo que debes revisar antes de entrar a pista.</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  `,
  styles: [
    `
    :host { display: block; }

    .blog-hero {
      min-height: clamp(540px, 68vh, 720px);
    }
    .blog-hero .hero-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.5) saturate(1.2);
      transform: scale(1.08);
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(0, 0, 0, 0.82), rgba(217, 66, 66, 0.55));
    }
    .hero-feature {
      background: rgba(12, 12, 12, 0.82);
      border-radius: 1.5rem;
      padding: 2.2rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(18px);
    }
    .hero-tags .tag-chip {
      padding: 0.45rem 1rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      text-transform: uppercase;
      font-size: 0.66rem;
      letter-spacing: 0.12em;
    }
    .author-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .featured-card {
      border-radius: 1.75rem;
      overflow: hidden;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .featured-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .featured-content {
      padding: 2.2rem;
      display: grid;
      gap: 1rem;
    }
    .category-badge {
      display: inline-block;
      padding: 0.45rem 1.1rem;
      border-radius: 999px;
      background: rgba(217, 66, 66, 0.12);
      color: var(--jdm-red);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      font-weight: 700;
    }
    .featured-meta { display: flex; align-items: center; gap: 0.6rem; }
    .featured-meta .dot { opacity: 0.45; }

    .mini-grid { display: grid; gap: 1.2rem; }
    .mini-card {
      display: grid;
      grid-template-columns: 96px 1fr;
      gap: 1rem;
      background: #fff;
      border-radius: 1.1rem;
      padding: 1rem;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .mini-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 24px 36px rgba(0, 0, 0, 0.12);
    }
    .mini-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 0.9rem;
    }
    .category-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--jdm-red);
      font-weight: 700;
    }

    .latest-posts .filter-chip {
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.04);
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.09em;
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    .latest-posts .filter-chip.active,
    .latest-posts .filter-chip:hover {
      background: var(--jdm-red);
      color: #fff;
    }

    .post-card {
      border-radius: 1.4rem;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .post-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 26px 48px rgba(0, 0, 0, 0.12);
    }
    .post-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .post-body { padding: 1.8rem; display: grid; gap: 1rem; }
    .post-body .dot { opacity: 0.4; }
    .author-row .author-avatar { width: 42px; height: 42px; }

    .newsletter .form-control-lg {
      border-radius: 0.9rem;
      border: 2px solid rgba(0, 0, 0, 0.12);
    }
    .newsletter-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 1.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    }

    .knowledge-strip {
      background: linear-gradient(140deg, rgba(11, 11, 11, 0.95), rgba(217, 66, 66, 0.85));
      border-radius: 2rem;
      margin: 0 1rem;
      padding: clamp(2.5rem, 8vw, 4rem);
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
    }
    .resource-grid {
      display: grid;
      gap: 1.4rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .resource-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      padding: 1.4rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(6px);
    }
    .resource-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(217, 66, 66, 0.25);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 1.1rem;
      letter-spacing: 0.08em;
    }

    @media (max-width: 991.98px) {
      .hero-feature { margin-top: 2rem; }
      .knowledge-strip { margin: 0; border-radius: 1.5rem; }
    }

    @media (max-width: 767.98px) {
      .mini-card { grid-template-columns: 1fr; }
      .mini-media img { border-radius: 0.9rem; }
      .featured-content { padding: 1.6rem; }
      .post-body { padding: 1.5rem; }
      .hero-feature { padding: 1.8rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      .post-card:hover,
      .mini-card:hover { transform: none; }
      .drift-in { animation: none !important; }
    }

    :host-context([data-bs-theme="dark"]) .featured-card,
    :host-context([data-bs-theme="dark"]) .mini-card,
    :host-context([data-bs-theme="dark"]) .post-card,
    :host-context([data-bs-theme="dark"]) .newsletter .form-control-lg {
      background: rgba(12, 12, 12, 0.92);
      color: #f2f2f2;
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 22px 44px rgba(0, 0, 0, 0.45);
    }
    :host-context([data-bs-theme="dark"]) .featured-card .text-muted,
    :host-context([data-bs-theme="dark"]) .mini-card .text-muted,
    :host-context([data-bs-theme="dark"]) .post-card .text-muted,
    :host-context([data-bs-theme="dark"]) .newsletter .text-muted {
      color: rgba(232, 232, 232, 0.78) !important;
    }
    :host-context([data-bs-theme="dark"]) .mini-card:hover,
    :host-context([data-bs-theme="dark"]) .post-card:hover {
      box-shadow: 0 30px 50px rgba(0, 0, 0, 0.55);
    }
    :host-context([data-bs-theme="dark"]) .latest-posts .filter-chip {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.72);
    }
    :host-context([data-bs-theme="dark"]) .latest-posts .filter-chip.active,
    :host-context([data-bs-theme="dark"]) .latest-posts .filter-chip:hover {
      background: var(--jdm-red);
      color: #fff;
    }
    :host-context([data-bs-theme="dark"]) .knowledge-strip {
      background: linear-gradient(140deg, rgba(0, 0, 0, 0.92), rgba(217, 66, 66, 0.78));
    }
    :host-context([data-bs-theme="dark"]) .resource-card {
      background: rgba(255, 255, 255, 0.08);
    }
    :host-context([data-bs-theme="dark"]) .hero-feature {
      background: rgba(10, 10, 10, 0.88);
      border-color: rgba(255, 255, 255, 0.14);
    }
    :host-context([data-bs-theme="dark"]) .hero-tags .tag-chip {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.22);
    }
    :host-context([data-bs-theme="dark"]) .category-badge {
      background: rgba(217, 66, 66, 0.28);
      color: #fff;
    }
    :host-context([data-bs-theme="dark"]) .mini-card {
      background: rgba(14, 14, 14, 0.92);
    }
    :host-context([data-bs-theme="dark"]) .newsletter .form-control-lg {
      border-color: rgba(255, 255, 255, 0.18);
      background: rgba(12, 12, 12, 0.78);
      color: #f0f0f0;
    }
    :host-context([data-bs-theme="dark"]) .newsletter-media img {
      box-shadow: 0 24px 52px rgba(0, 0, 0, 0.55);
    }
    `
  ]
})
export class BlogPage {
  readonly sidePosts = [
    {
      category: 'Flotillas',
      title: 'Cómo reducir un 18% tus paros por desgaste irregular',
      summary: 'Implementa inspecciones predictivas y rotaciones estratégicas en tu calendario operativo.',
      image: 'https://images.unsplash.com/photo-1529429617124-aee66346910f?auto=format&fit=crop&w=600&q=80',
      alt: 'Supervisor revisando neumáticos de una flotilla comercial'
    },
    {
      category: 'Tecnología',
      title: '5 sensores TPMS que debes conocer en 2024',
      summary: 'Comparamos precisión, compatibilidad y seguridad para el mercado latinoamericano.',
      image: 'https://images.unsplash.com/photo-1582529550960-018487afeca7?auto=format&fit=crop&w=600&q=80',
      alt: 'Close up de sensor TPMS instalado en rin'
    },
    {
      category: 'Tips rápidos',
      title: 'Checklist express antes de salir a carretera',
      summary: '5 puntos clave para asegurar estabilidad, frenado óptimo y mejor consumo de combustible.',
      image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80',
      alt: 'Persona revisando presión de llantas en una gasolinera'
    }
  ];

  readonly latestPosts = [
    {
      category: 'Historias de clientes',
      title: 'El equipo Drift MX logró el podio tras ajustar presiones con nuestro laboratorio',
      summary: 'Compartimos la estrategia de neumáticos y telemetría que permitió mejorar el grip en cada curva.',
      image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=900&q=80',
      alt: 'Auto de drift generando humo en una curva',
      date: '04 Jul 2024',
      author: 'Gabriel Ortiz',
      authorAvatar: 'https://images.unsplash.com/photo-1529933037705-0d537317ae4e?auto=format&fit=crop&w=200&q=80',
      readTime: 7
    },
    {
      category: 'Tecnología',
      title: 'Cómo la inteligencia artificial anticipa el desgaste de tus llantas',
      summary: 'Analizamos casos reales con machine learning para detectar patrones críticos antes de que afecten la operación.',
      image: 'https://images.unsplash.com/photo-1580894897200-655b4be94b4b?auto=format&fit=crop&w=900&q=80',
      alt: 'Pantallas de análisis de datos dentro de un taller automotriz',
      date: '28 Jun 2024',
      author: 'Victoria Salgado',
      authorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
      readTime: 6
    },
    {
      category: 'Noticias',
      title: 'Roue presenta su programa de reciclaje con recompensas para flotillas',
      summary: 'Conoce cómo funciona el plan, qué beneficios financieros entrega y cómo sumarte desde cualquier ciudad.',
      image: 'https://images.unsplash.com/photo-1518552782006-25ef988d57c0?auto=format&fit=crop&w=900&q=80',
      alt: 'Acopio de llantas listas para reciclaje en almacén',
      date: '21 Jun 2024',
      author: 'Susana Prieto',
      authorAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
      readTime: 5
    },
    {
      category: 'Tips rápidos',
      title: '3 señales que indican que debes alinear tu vehículo',
      summary: 'Vibraciones, tirones y desgaste irregular: cómo identificarlos y solucionarlos antes de dañar la suspensión.',
      image: 'https://images.unsplash.com/photo-1615914093911-04a482eb8b4e?auto=format&fit=crop&w=900&q=80',
      alt: 'Técnico midiendo ángulos de alineación',
      date: '17 Jun 2024',
      author: 'Diego Ramírez',
      authorAvatar: 'https://images.unsplash.com/photo-1522098543979-ffc7f79d8c98?auto=format&fit=crop&w=200&q=80',
      readTime: 4
    },
    {
      category: 'Performance',
      title: 'Comparativa: llantas semi-slick vs. ultra high performance',
      summary: 'Evaluamos agarre, temperatura ideal y durabilidad para track days y uso callejero entusiasta.',
      image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
      alt: 'Detalle de llantas de alto desempeño en auto deportivo',
      date: '11 Jun 2024',
      author: 'Melissa Castro',
      authorAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
      readTime: 6
    },
    {
      category: 'Flotillas',
      title: 'Caso de estudio: logística urbana con 20% menos de pinchazos',
      summary: 'Revelamos el plan preventivo y las rutas inteligentes que aplicamos junto a una empresa de e-commerce.',
      image: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=900&q=80',
      alt: 'Camiones de reparto estacionados en centro de distribución',
      date: '03 Jun 2024',
      author: 'Karim Navarro',
      authorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
      readTime: 8
    }
  ];
}

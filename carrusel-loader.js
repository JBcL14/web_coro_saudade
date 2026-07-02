/* ═══════════════════════════════════════════════════════════════════
   carrusel-loader.js — Coro Saudade de Pamplona
   Lee carrusel.json desde GitHub Pages y rellena los carruseles
   de forma dinámica, sin tocar index.html cada vez que hay fotos nuevas.

   INCLUIR en index.html ANTES de main.js y video-carousel.js:
     <script src="carrusel-loader.js"></script>

   Funciona con GitHub Pages. Si tu web tiene otro dominio, ajusta
   CARRUSEL_JSON_URL a la URL pública del archivo.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── URL pública del JSON en tu repositorio GitHub Pages ───────────────────
  // Formato: https://TU_USUARIO.github.io/TU_REPO/assets/carrusel.json
  // Si usas dominio propio configurado en GitHub Pages, ponlo aquí:
  const CARRUSEL_JSON_URL = '/assets/carrusel.json';

  // Rutas base donde están los archivos en el repo/servidor
  const BASE_IMAGES = '/assets/images/carrusel/';
  const BASE_VIDEOS = '/assets/videos/carrusel/';

  // ── Plantillas HTML ───────────────────────────────────────────────────────

  function htmlSlideImagen(nombre) {
    const alt = nombre.replace(/[-_]/g, ' ').replace(/\.webp$/i, '');
    return `<div class="carousel-slide">
  <img src="${BASE_IMAGES}${nombre}" alt="${alt}" class="carousel-img" loading="lazy">
  <div class="carousel-caption"><span>${alt}</span></div>
</div>`;
  }

  const PLAY_ICON  = '<svg viewBox="0 0 24 24" class="icon-play"><path d="M8 5v14l11-7z"/></svg>';
  const PAUSE_ICON = '<svg viewBox="0 0 24 24" class="icon-pause"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

  function htmlSlideVideo(nombre) {
    const titulo = nombre.replace(/[-_]/g, ' ').replace(/\.\w+$/i, '');
    return `<div class="carousel-slide vc-slide">
  <video src="${BASE_VIDEOS}${nombre}" preload="metadata" playsinline loop muted class="vc-video"></video>
  <div class="vc-overlay" role="button" aria-label="Reproducir/Pausar">
    <div class="vc-play-btn" aria-hidden="true">
      ${PLAY_ICON}
      ${PAUSE_ICON}
    </div>
  </div>
  <div class="carousel-caption"><span>${titulo}</span></div>
</div>`;
  }

  // ── Inyección en el DOM ───────────────────────────────────────────────────

  function inyectarContenido(datos) {
    // Galería de fotos
    const trackFotos = document.getElementById('carouselTrack');
    if (trackFotos && Array.isArray(datos.images) && datos.images.length) {
      trackFotos.innerHTML = datos.images.map(htmlSlideImagen).join('\n');
    }

    // Carrusel de vídeos
    const trackVideos = document.getElementById('videoCarouselTrack');
    if (trackVideos && Array.isArray(datos.videos) && datos.videos.length) {
      trackVideos.innerHTML = datos.videos.map(htmlSlideVideo).join('\n');
    }
  }

  // ── Carga del JSON y arranque ─────────────────────────────────────────────

  function cargarYRenderizar() {
    fetch(CARRUSEL_JSON_URL + '?v=' + Date.now()) // cache-bust
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function (datos) {
        inyectarContenido(datos);
        // Disparar evento para que main.js y video-carousel.js
        // (si ya están cargados) reinicialicen los carruseles
        document.dispatchEvent(new CustomEvent('carruselDatosListos'));
      })
      .catch(function (err) {
        console.warn('[carrusel-loader] No se pudo cargar carrusel.json:', err.message);
        // El HTML estático de index.html actúa como fallback — no bloqueante
      });
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarYRenderizar);
  } else {
    cargarYRenderizar();
  }

})();

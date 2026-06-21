/* ═══════════════════════════════════════════════════════════════════
   carrusel-loader.js — Coro Saudade de Pamplona
   Lee assets/carrusel.json, rellena los dos carruseles y después
   inicializa main.js y video-carousel.js cuando el DOM está listo.

   ORDEN EN index.html (los tres con defer):
     <script src="carrusel-loader.js" defer></script>
     <script src="video-carousel.js"  defer></script>
     <script src="main.js"            defer></script>

   Con defer todos se descargan en paralelo pero se ejecutan en orden,
   así que carrusel-loader siempre va primero y rellena los tracks
   antes de que main.js y video-carousel.js lean los slides.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Ajusta estas rutas si tu repo está en un subdirectorio ───────────────
  // GitHub Pages con dominio propio → '/'   (raíz del dominio)
  // GitHub Pages sin dominio → '/nombre-del-repo/'
  const BASE      = '/';
  const JSON_URL  = BASE + 'assets/carrusel.json';
  const IMG_BASE  = BASE + 'assets/images/carrusel/';
  const VID_BASE  = BASE + 'assets/videos/carrusel/';

  // ── Plantilla para cada slide de foto ────────────────────────────────────
  function slideImagen(nombre) {
    const alt = nombre.replace(/[-_]/g, ' ').replace(/\.webp$/i, '').trim();
    return '<div class="carousel-slide">'
      + '<img src="' + IMG_BASE + nombre + '" alt="' + alt + '" class="carousel-img" loading="lazy">'
      + '<div class="carousel-caption"><span>' + alt + '</span></div>'
      + '</div>';
  }

  // ── Plantilla para cada slide de vídeo ───────────────────────────────────
  var PLAY  = '<svg viewBox="0 0 24 24" class="icon-play"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" class="icon-pause"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

  function slideVideo(nombre) {
    var titulo = nombre.replace(/[-_]/g, ' ').replace(/\.\w+$/i, '').trim();
    return '<div class="carousel-slide vc-slide">'
      + '<video src="' + VID_BASE + nombre + '" preload="metadata" playsinline loop muted class="vc-video"></video>'
      + '<div class="vc-overlay" role="button" aria-label="Reproducir/Pausar">'
      + '<div class="vc-play-btn" aria-hidden="true">' + PLAY + PAUSE + '</div>'
      + '</div>'
      + '<div class="carousel-caption"><span>' + titulo + '</span></div>'
      + '</div>';
  }

  // ── Inyecta el HTML en los tracks ────────────────────────────────────────
  function inyectar(datos) {
    var trackFotos  = document.getElementById('carouselTrack');
    var trackVideos = document.getElementById('videoCarouselTrack');

    if (trackFotos && Array.isArray(datos.images) && datos.images.length > 0) {
      trackFotos.innerHTML = datos.images.map(slideImagen).join('');
    }
    if (trackVideos && Array.isArray(datos.videos) && datos.videos.length > 0) {
      trackVideos.innerHTML = datos.videos.map(slideVideo).join('');
    }
  }

  // ── Carga el JSON y rellena los tracks ───────────────────────────────────
  // Se ejecuta con defer, así que el DOM ya existe cuando esto corre.
  // main.js y video-carousel.js (también defer, declarados DESPUÉS en el HTML)
  // todavía no han corrido → cuando les llegue el turno los tracks ya tienen slides.
  fetch(JSON_URL + '?_=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (datos) {
      inyectar(datos);
      // Llamar a los inicializadores DESPUÉS de que los slides estén en el DOM.
      // Con defer, main.js y video-carousel.js ya están parseados cuando esto corre,
      // así que sus funciones están disponibles globalmente.
      if (typeof initCarousel      === 'function') initCarousel();
      if (typeof initVideoCarousel === 'function') initVideoCarousel();
    })
    .catch(function (err) {
      console.warn('[carrusel-loader] No se pudo cargar ' + JSON_URL + ':', err.message);
      // Fallback: intentar inicializar con lo que haya en el DOM (slides estáticos)
      if (typeof initCarousel      === 'function') initCarousel();
      if (typeof initVideoCarousel === 'function') initVideoCarousel();
    });

})();

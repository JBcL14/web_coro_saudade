/* ═══════════════════════════════════════════════════════════════════
   carrusel-loader.js — Coro Saudade de Pamplona
   Lee /api/carrusel (bucket R2 en Cloudflare Pages) o, como respaldo,
   assets/carrusel.json; rellena los dos carruseles y después
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
  const BASE = window.location.pathname.includes('/web_coro_saudade/')
  ? '/web_coro_saudade/'
  : '/';

  // Cloudflare Pages + R2: /api/carrusel lista los medios del bucket
  // y /media/ los sirve (functions/api/carrusel.js y functions/media/).
  const JSON_URL  = BASE + 'api/carrusel';
  var   IMG_BASE  = BASE + 'media/images/';
  var   VID_BASE  = BASE + 'media/videos/';

  // Respaldo (en local o GitHub Pages, sin Functions): archivos del repo.
  const JSON_LOCAL = BASE + 'assets/carrusel.json';
  const IMG_LOCAL  = BASE + 'assets/images/carrusel/';
  const VID_LOCAL  = BASE + 'assets/videos/carrusel/';

  // ── Plantilla para cada slide de foto ────────────────────────────────────
  // Las primeras 4 imágenes se cargan de forma inmediata (eager + fetchpriority high).
  // El resto usan eager también pero sin alta prioridad, para que el navegador
  // las descargue en paralelo en segundo plano sin bloquear el render inicial.
  // No usamos lazy porque el carrusel no es scroll vertical — el navegador nunca
  // detectaría que esas imágenes están "cerca" del viewport en un carrusel horizontal.
  function slideImagen(nombre, idx) {
    const alt      = nombre.replace(/[-_]/g, ' ').replace(/\.webp$/i, '').trim();
    const priority = idx < 4 ? ' fetchpriority="high"' : ' fetchpriority="low"';
    return '<div class="carousel-slide">'
      + '<img src="' + IMG_BASE + nombre + '" alt="' + alt + '" class="carousel-img" loading="eager" decoding="async"' + priority + '>'
      + '</div>';
  }

  // ── Plantilla para cada slide de vídeo ───────────────────────────────────
  var PLAY  = '<svg viewBox="0 0 24 24" class="icon-play"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" class="icon-pause"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

  function slideVideo(nombre) {
    return '<div class="carousel-slide vc-slide">'
      + '<video src="' + VID_BASE + nombre + '" preload="metadata" playsinline loop muted class="vc-video"></video>'
      + '<div class="vc-overlay" role="button" aria-label="Reproducir/Pausar">'
      + '<div class="vc-play-btn" aria-hidden="true">' + PLAY + PAUSE + '</div>'
      + '</div>'
      + '</div>';
  }

  // ── Inyecta el HTML en los tracks ────────────────────────────────────────
  function inyectar(datos) {
    var trackFotos  = document.getElementById('carouselTrack');
    var trackVideos = document.getElementById('videoCarouselTrack');

    if (trackFotos && Array.isArray(datos.images) && datos.images.length > 0) {
      trackFotos.innerHTML = datos.images.map(function(nombre, idx) { return slideImagen(nombre, idx); }).join('');
    }
    if (trackVideos && Array.isArray(datos.videos) && datos.videos.length > 0) {
      trackVideos.innerHTML = datos.videos.map(slideVideo).join('');
    }
  }

  // ── Carga el JSON y rellena los tracks ───────────────────────────────────
  // Se ejecuta con defer, así que el DOM ya existe cuando esto corre.
  // main.js y video-carousel.js (también defer, declarados DESPUÉS en el HTML)
  // todavía no han corrido → cuando les llegue el turno los tracks ya tienen slides.
  function inicializar() {
    // Llamar a los inicializadores DESPUÉS de que los slides estén en el DOM.
    // Con defer, main.js y video-carousel.js ya están parseados cuando esto corre,
    // así que sus funciones están disponibles globalmente.
    if (typeof initCarousel      === 'function') initCarousel();
    if (typeof initVideoCarousel === 'function') initVideoCarousel();
  }

  function pedirJson(url) {
    return fetch(url + '?_=' + Date.now()).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  pedirJson(JSON_URL)
    .catch(function (err) {
      // Sin Functions (local / GitHub Pages): usar el JSON y los archivos del repo
      console.warn('[carrusel-loader] ' + JSON_URL + ' no disponible (' + err.message + '); usando ' + JSON_LOCAL);
      IMG_BASE = IMG_LOCAL;
      VID_BASE = VID_LOCAL;
      return pedirJson(JSON_LOCAL);
    })
    .then(function (datos) {
      inyectar(datos);
      inicializar();
    })
    .catch(function (err) {
      console.warn('[carrusel-loader] No se pudo cargar el carrusel:', err.message);
      // Fallback final: inicializar con lo que haya en el DOM (slides estáticos)
      inicializar();
    });

})();

/* ═══════════════════════════════════════════════════════════════════
   agenda-loader.js — Coro Saudade de Pamplona
   Lee assets/agenda.json y rellena dinámicamente la sección #eventos.

   ORDEN EN index.html (con defer, antes de main.js):
     <script src="agenda-loader.js" defer></script>
     <script src="carrusel-loader.js" defer></script>
     <script src="main.js" defer></script>
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Ruta al JSON (se ajusta automáticamente según el dominio) ────────────
  var BASE = window.location.pathname.includes('/web_coro_saudade/')
    ? '/web_coro_saudade/'
    : '/';
  var JSON_URL = BASE + 'assets/agenda.json';

  // ── SVGs reutilizables ───────────────────────────────────────────────────
  var DIAMOND = '<svg class="ornament-diamond" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polygon points="6,0 12,6 6,12 0,6"/></svg>';

  // ── Construye el HTML de un evento ───────────────────────────────────────
  function htmlEvento(ev, badgeTexto, badgeClass) {
    var detalle = [ev.lugar, ev.hora ? ev.hora + ' h' : '', ev.descripcion]
      .filter(Boolean).join(' · ');

    return '<div class="event-item fade-in">'
      + '<div class="event-date">'
      + '<span class="event-day">' + ev.dia + '</span>'
      + '<span class="event-month">' + ev.mes + ' ' + ev.anio + '</span>'
      + '</div>'
      + '<div class="event-info">'
      + '<h3>' + escHtml(ev.titulo) + '</h3>'
      + (detalle ? '<p>' + escHtml(detalle) + '</p>' : '')
      + '</div>'
      + '<span class="event-badge' + (badgeClass ? ' ' + badgeClass : '') + '">'
      + escHtml(badgeTexto)
      + '</span>'
      + '</div>';
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Inyecta los datos en el DOM ──────────────────────────────────────────
  function renderizar(datos) {
    // Actualizar el año en la etiqueta de sección
    var labelAnio = document.querySelector('#eventos .section-label');
    if (labelAnio && datos.anio) {
      labelAnio.innerHTML = DIAMOND + ' Agenda ' + datos.anio;
    }

    // ── Próximos conciertos ─────────────────────────────────────────────────
    var listProximos = document.querySelector('#eventos .events-subsection:not(.events-subsection--past) .events-list');
    if (listProximos) {
      if (datos.proximos && datos.proximos.length > 0) {
        listProximos.innerHTML = datos.proximos.map(function(ev) {
          // Badge: usar el campo "tipo" si existe, o "Próximo" por defecto
          var badge = ev.tipo || 'Próximo';
          // Los eventos marcados como destacado dentro de próximos llevan badge featured
          var cls   = ev.destacado ? 'featured' : '';
          return htmlEvento(ev, badge, cls);
        }).join('');
      } else {
        listProximos.innerHTML = '<p class="events-empty">Próximamente anunciaremos nuevas fechas.<br>Síguenos en Instagram para estar al día.</p>';
      }
    }

    // ── Conciertos destacados (pasados) ─────────────────────────────────────
    var listDestacados = document.querySelector('#eventos .events-subsection--past .events-list');
    if (listDestacados) {
      if (datos.destacados && datos.destacados.length > 0) {
        listDestacados.innerHTML = datos.destacados.map(function(ev) {
          var badge = ev.tipo || 'Destacado';
          return htmlEvento(ev, badge, 'featured');
        }).join('');
      } else {
        listDestacados.innerHTML = '';
        // Ocultar la subsección entera si no hay destacados
        var secDestacados = document.querySelector('#eventos .events-subsection--past');
        if (secDestacados) secDestacados.style.display = 'none';
      }
    }

    // Re-observar los nuevos .fade-in para las animaciones de scroll
    if (typeof IntersectionObserver !== 'undefined') {
      var nuevosFadeIn = document.querySelectorAll('#eventos .fade-in:not(.visible)');
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry, i) {
          if (!entry.isIntersecting) return;
          setTimeout(function() { entry.target.classList.add('visible'); }, i * 100);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      nuevosFadeIn.forEach(function(el) { obs.observe(el); });
    }
  }

  // ── Skeleton mientras carga ─────────────────────────────────────────────
  function skeletonEvento() {
    return '<div class="event-skeleton">'
      + '<div><div class="skeleton-block skeleton-day"></div><div class="skeleton-block skeleton-month"></div></div>'
      + '<div><div class="skeleton-block skeleton-title"></div><div class="skeleton-block skeleton-sub"></div></div>'
      + '<div class="skeleton-block skeleton-badge"></div>'
      + '</div>';
  }

  function mostrarSkeleton() {
    var listas = document.querySelectorAll('#eventos .events-list');
    listas.forEach(function(l) { l.innerHTML = skeletonEvento() + skeletonEvento() + skeletonEvento(); });
  }

  // ── Carga el JSON ────────────────────────────────────────────────────────
  mostrarSkeleton();

  fetch(JSON_URL + '?_=' + Date.now())
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(datos) {
      renderizar(datos);
    })
    .catch(function(err) {
      console.warn('[agenda-loader] No se pudo cargar ' + JSON_URL + ':', err.message);
      // Limpiar skeletons y dejar las listas vacías (fallback silencioso)
      document.querySelectorAll('#eventos .events-list').forEach(function(l) { l.innerHTML = ''; });
    });

})();

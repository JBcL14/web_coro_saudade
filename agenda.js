/* ═══════════════════════════════════════════════════════
   agenda.js — Coro Saudade de Pamplona
   Lee assets/agenda.json (generado por el Google Apps Script)
   y rellena dinámicamente la sección #eventos del index.html.

   INCLUIR EN index.html (con defer, antes del cierre de </body>):
     <script src="agenda.js" defer></script>

   Si agenda.json no existe o falla la carga, el HTML estático
   que ya esté en el index.html se conserva como fallback.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Ajusta la base si tu repo está en un subdirectorio ─────────────────
  const BASE = window.location.pathname.includes('/web_coro_saudade/')
    ? '/web_coro_saudade/'
    : '/';
  const JSON_URL = BASE + 'assets/agenda.json';

  // ── Nombres completos de mes en español ────────────────────────────────
  const MESES_LARGO = {
    'Ene': 'Enero',   'Feb': 'Febrero',  'Mar': 'Marzo',
    'Abr': 'Abril',   'May': 'Mayo',     'Jun': 'Junio',
    'Jul': 'Julio',   'Ago': 'Agosto',   'Sep': 'Septiembre',
    'Oct': 'Octubre', 'Nov': 'Noviembre','Dic': 'Diciembre',
  };

  // ── Badge por tipo de evento ────────────────────────────────────────────
  const BADGE_CLASE = {
    'colaboración': 'featured',
    'colaboracion': 'featured',
    'destacado'   : 'featured',
    'festival'    : 'featured',
  };

  function badgeClase(tipo) {
    if (!tipo) return '';
    return BADGE_CLASE[tipo.toLowerCase()] || '';
  }

  // ── Construye el texto del subtítulo de un evento ──────────────────────
  function subtitulo(ev) {
    const partes = [];
    if (ev.lugar)       partes.push(ev.lugar);
    if (ev.hora)        partes.push(ev.hora + ' h');
    if (ev.descripcion) partes.push(ev.descripcion);
    return partes.join(' · ');
  }

  // ── Renderiza un evento como .event-item ──────────────────────────────
  function renderEvento(ev, badge, badgeExtra) {
    const mes      = ev.mes || '';
    const mesLargo = MESES_LARGO[mes] || mes;
    const anioStr  = ev.anio ? ' ' + ev.anio : '';
    const sub      = subtitulo(ev);
    const tipo     = ev.tipo || badge;
    const clase    = badgeClase(tipo) || badgeExtra || '';

    return '<div class="event-item fade-in">'
      + '<div class="event-date">'
      + '<span class="event-day">' + (ev.dia || '') + '</span>'
      + '<span class="event-month">' + mesLargo + anioStr + '</span>'
      + '</div>'
      + '<div class="event-info">'
      + '<h3>' + escHtml(ev.titulo) + '</h3>'
      + (sub ? '<p>' + escHtml(sub) + '</p>' : '')
      + '</div>'
      + '<span class="event-badge' + (clase ? ' ' + clase : '') + '">'
      + escHtml(tipo || badge)
      + '</span>'
      + '</div>';
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Actualiza el label "Agenda AAAA" ──────────────────────────────────
  function actualizarLabelAnio(anio) {
    const label = document.querySelector('#eventos .section-label');
    if (label) {
      // Conserva el SVG del diamante y solo actualiza el texto
      const svg = label.querySelector('svg');
      label.textContent = ' Agenda ' + anio;
      if (svg) label.insertBefore(svg, label.firstChild);
    }
  }

  // ── Renderiza la lista de próximos conciertos ─────────────────────────
  function renderProximos(lista, contenedor) {
    if (!contenedor) return;
    if (!lista || lista.length === 0) {
      contenedor.innerHTML =
        '<p class="events-empty">Próximamente anunciaremos nuevos conciertos. '
        + '¡Síguenos en Instagram para estar al día!</p>';
      return;
    }
    contenedor.innerHTML = lista.map(function (ev) {
      return renderEvento(ev, 'Próximo', '');
    }).join('');
    // Re-observar los nuevos .fade-in
    observarFadeIn(contenedor);
  }

  // ── Renderiza la lista de conciertos destacados ───────────────────────
  function renderDestacados(lista, contenedor) {
    if (!contenedor) return;
    if (!lista || lista.length === 0) {
      contenedor.innerHTML = '';
      // Ocultar la subsección entera si no hay destacados
      const subseccion = contenedor.closest('.events-subsection--past');
      if (subseccion) subseccion.style.display = 'none';
      return;
    }
    contenedor.innerHTML = lista.map(function (ev) {
      return renderEvento(ev, 'Destacado', 'featured');
    }).join('');
    observarFadeIn(contenedor);
  }

  // ── Registra nuevos .fade-in en el IntersectionObserver existente ─────
  // (el observer ya está activo en main.js / scroll-animations.js)
  function observarFadeIn(contenedor) {
    // Intentar reutilizar el observer de scroll-animations si está disponible,
    // o crear uno propio de fallback.
    const nuevos = Array.from(contenedor.querySelectorAll('.fade-in:not(.visible)'));
    if (nuevos.length === 0) return;

    const obs = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () {
          entry.target.classList.add('visible');
        }, i * 100);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    nuevos.forEach(function (el) { obs.observe(el); });
  }

  // ── CARGA Y RENDERIZADO PRINCIPAL ─────────────────────────────────────
  function cargarAgenda() {
    // Buscar los contenedores de eventos en el DOM
    const seccion         = document.getElementById('eventos');
    if (!seccion) return;   // sección no existe en esta página

    // .events-list dentro de la primera .events-subsection → próximos
    const subsecciones    = seccion.querySelectorAll('.events-subsection');
    const listProximos    = subsecciones[0] ? subsecciones[0].querySelector('.events-list')  : null;
    const listDestacados  = subsecciones[1] ? subsecciones[1].querySelector('.events-list')  : null;

    fetch(JSON_URL + '?_=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (datos) {
        // Actualizar año en el label de la sección
        if (datos.anio) actualizarLabelAnio(datos.anio);

        renderProximos(datos.proximos,    listProximos);
        renderDestacados(datos.destacados, listDestacados);
      })
      .catch(function (err) {
        // Si falla la carga (archivo no existe aún, error de red, etc.),
        // el HTML estático del index.html permanece intacto → no hacemos nada.
        console.info('[agenda.js] agenda.json no disponible todavía:', err.message);
      });
  }

  // Ejecutar tras el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarAgenda);
  } else {
    cargarAgenda();
  }

})();

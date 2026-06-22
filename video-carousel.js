/* ═══════════════════════════════════════════════════════
   video-carousel.js — Coro Saudade de Pamplona
   Lógica del carrusel de vídeos con reproductor integrado.
   ═══════════════════════════════════════════════════════ */

// initVideoCarousel() es llamado por carrusel-loader.js tras inyectar los slides.
function initVideoCarousel() {
  'use strict';

  const wrapper  = document.getElementById('videoCarouselWrapper');
  const track    = document.getElementById('videoCarouselTrack');
  if (!wrapper || !track) return;
  const dotsEl   = document.getElementById('vcDots');
  const counter  = document.getElementById('vcCounter');
  const prevBtn  = document.getElementById('vcPrevBtn');
  const nextBtn  = document.getElementById('vcNextBtn');
  const progress = document.getElementById('videoCarouselProgress');
  const slides   = Array.from(track.querySelectorAll('.vc-slide'));
  const total    = slides.length;

  let currentPage = 0;
  let autoTimer;
  let uiTimer = null;
  let isDragging = false, dragStartX = 0, dragStartTranslate = 0, dragCurrentX = 0;

  // ── Helpers
  function slideWidth()   { return wrapper.offsetWidth; }
  function totalPages()   { return total; }
  function translateFor(p){ return -(p * slideWidth()); }

  function applyTranslate(x, animate) {
    track.classList.toggle('animating', animate);
    track.style.transform = `translateX(${x}px)`;
  }

  function updateSlideWidths() {
    slides.forEach(s => { s.style.flex = '0 0 100%'; });
  }

  function pauseAllVideos() {
    slides.forEach(function(s) {
      var v = s.querySelector('.vc-video');
      if (v && !v.paused) { v.pause(); }
      // enterPaused se llama después de definirla; aquí solo reseteamos clases
      clearTimeout(uiTimer);
      s.classList.remove('vc-playing');
      s.classList.remove('vc-ui');
      s.classList.add('vc-paused');
    });
  }

  function updateActiveSlides() {
    slides.forEach((s, i) => s.classList.toggle('active', i === currentPage));
  }

  function updateDots(forceLayout) {
    // Barra segmentada: solo toggle de clase activa, sin scroll
    dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentPage);
    });
  }

  function updateCounter() {
    counter.textContent = `${currentPage + 1} / ${totalPages()}`;
  }

  function updateProgress() {
    progress.style.width = `${((currentPage + 1) / totalPages()) * 100}%`;
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < totalPages(); i++) {
      const d = document.createElement('div');
      d.className = 'carousel-dot' + (i === currentPage ? ' active' : '');
      d.addEventListener('click', () => { goTo(i); resetAuto(); });
      dotsEl.appendChild(d);
    }
  }

  function goTo(page, animate = true, forceLayout = false) {
    pauseAllVideos();
    currentPage = Math.max(0, Math.min(page, totalPages() - 1));
    applyTranslate(translateFor(currentPage), animate);
    updateActiveSlides();
    updateDots(forceLayout);
    updateCounter();
    updateProgress();
  }

  function next() { goTo((currentPage + 1) % totalPages()); }
  function prev() { goTo((currentPage - 1 + totalPages()) % totalPages()); }

  function isAnyVideoPlaying() {
    return slides.some(s => {
      const v = s.querySelector('.vc-video');
      return v && !v.paused;
    });
  }

  function resetAuto() {
    clearInterval(autoTimer);
    if (!isAnyVideoPlaying()) {
      autoTimer = setInterval(next, 6000);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  REPRODUCTOR DE VÍDEO
  //
  //  ESCRITORIO (hover: hover):
  //    · Click en cualquier zona → play/pausa directo
  //    · Hover → muestra botón mientras el ratón esté encima
  //
  //  MÓVIL (touch):
  //    PARADO   → botón play visible y fijo
  //               toque sobre botón → play; botón se oculta tras 2 s
  //    PLAYING  → botón oculto
  //               toque en cualquier zona → muestra botón pausa 2 s
  //               toque sobre botón (mientras visible) → pausa
  //    PAUSA    → botón play visible y fijo
  //
  //  Los listeners touch usan preventDefault() para suprimir el click
  //  sintético de iOS y evitar dobles disparos.
  // ─────────────────────────────────────────────────────────────────

  function showUI(slide) {
    clearTimeout(uiTimer);
    slide.classList.add('vc-ui');
    uiTimer = setTimeout(function() {
      slide.classList.remove('vc-ui');
    }, 2000);
  }

  function enterPaused(slide) {
    clearTimeout(uiTimer);
    slide.classList.remove('vc-playing');
    slide.classList.remove('vc-ui');
    slide.classList.add('vc-paused');
  }

  function enterPlaying(slide) {
    slide.classList.remove('vc-paused');
    slide.classList.add('vc-playing');
    showUI(slide);
  }

  function doPlay(slide, vid) {
    var p = vid.play();
    if (p && p.then) {
      p.then(function() { vid.muted = false; })
       .catch(function() { enterPaused(slide); });
    } else {
      vid.muted = false;
    }
    clearInterval(autoTimer);
    enterPlaying(slide);
  }

  function doPause(slide, vid) {
    vid.pause();
    clearTimeout(uiTimer);
    enterPaused(slide);
    resetAuto();
  }

  slides.forEach(function(slide) {
    var overlay = slide.querySelector('.vc-overlay');
    var btn     = slide.querySelector('.vc-play-btn');
    var vid     = slide.querySelector('.vc-video');
    if (!overlay || !vid) return;

    enterPaused(slide);

    // ── ESCRITORIO: click directo play/pausa en todo el overlay ──────
    overlay.addEventListener('click', function(e) {
      // En móvil los clicks sintéticos llegan aquí también;
      // los ignoramos porque touch ya habrá actuado.
      if (e.sourceCapabilities && !e.sourceCapabilities.firesTouchEvents === false) return;
      if (!slide.classList.contains('active')) return;
      if (vid.paused) {
        doPlay(slide, vid);
      } else {
        doPause(slide, vid);
      }
    });


    // ── MÓVIL: lógica touch independiente ────────────────────────────
    var touchStartXT = 0;
    var touchStartYT = 0;

    overlay.addEventListener('touchstart', function(e) {
      touchStartXT = e.touches[0].clientX;
      touchStartYT = e.touches[0].clientY;
    }, { passive: true });

    overlay.addEventListener('touchend', function(e) {
      if (!slide.classList.contains('active')) return;

      // Ignorar si fue un swipe (el carrusel lo gestiona)
      var dx = Math.abs(e.changedTouches[0].clientX - touchStartXT);
      var dy = Math.abs(e.changedTouches[0].clientY - touchStartYT);
      if (dx > 10 || dy > 10) return;

      // Suprimir el click sintético de iOS
      e.preventDefault();

      var touchedBtn = false;
      if (btn) {
        var br = btn.getBoundingClientRect();
        var tx = e.changedTouches[0].clientX;
        var ty = e.changedTouches[0].clientY;
        // Zona de toque ampliada 12px alrededor del botón para facilitar el tap
        touchedBtn = tx >= br.left - 12 && tx <= br.right + 12 &&
                     ty >= br.top  - 12 && ty <= br.bottom + 12;
      }

      if (vid.paused) {
        // PARADO: solo el botón arranca
        if (touchedBtn) doPlay(slide, vid);
        // toque fuera del botón no hace nada cuando está parado

      } else if (slide.classList.contains('vc-ui')) {
        // REPRODUCIENDO + botón visible:
        //   · toque sobre botón → pausa
        //   · toque fuera → reinicia el temporizador de ocultación
        if (touchedBtn) {
          doPause(slide, vid);
        } else {
          showUI(slide); // reinicia los 2 s
        }

      } else {
        // REPRODUCIENDO + botón oculto: cualquier toque muestra el botón
        showUI(slide);
      }
    }, { passive: false }); // passive:false para poder llamar preventDefault

    // Fin natural del vídeo
    vid.addEventListener('ended', function() {
      enterPaused(slide);
      resetAuto();
    });
  });

  // ── Drag (ratón)
  let dragMoved = false;
  wrapper.addEventListener('mousedown', e => {
    // No interceptar clics sobre el overlay del vídeo
    if (e.target.closest('.vc-overlay')) return;
    isDragging = true;
    dragMoved  = false;
    dragStartX = e.clientX;
    dragStartTranslate = translateFor(currentPage);
    track.classList.remove('animating');
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    dragCurrentX = e.clientX;
    const delta = dragCurrentX - dragStartX;
    if (Math.abs(delta) > 4) {
      dragMoved = true;
      wrapper.classList.add('dragging');
    }
    const newX = dragStartTranslate + delta;
    const minX = translateFor(totalPages() - 1);
    const maxX = 0;
    let bounded = newX;
    if (newX > maxX) bounded = maxX + (newX - maxX) * 0.25;
    if (newX < minX) bounded = minX + (newX - minX) * 0.25;
    track.style.transform = `translateX(${bounded}px)`;
  });
  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    wrapper.classList.remove('dragging');
    if (dragMoved) {
      const delta = e.clientX - dragStartX;
      const threshold = slideWidth() * 0.2;
      if (delta < -threshold) next();
      else if (delta > threshold) prev();
      else goTo(currentPage);
      resetAuto();
    }
  });

  // ── Touch
  let touchStartX = 0;
  wrapper.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    dragStartTranslate = translateFor(currentPage);
    track.classList.remove('animating');
  }, { passive: true });
  wrapper.addEventListener('touchmove', e => {
    const delta = e.touches[0].clientX - touchStartX;
    const newX = dragStartTranslate + delta;
    const minX = translateFor(totalPages() - 1);
    const maxX = 0;
    let bounded = newX;
    if (newX > maxX) bounded = maxX + (newX - maxX) * 0.25;
    if (newX < minX) bounded = minX + (newX - minX) * 0.25;
    track.style.transform = `translateX(${bounded}px)`;
  }, { passive: true });
  wrapper.addEventListener('touchend', e => {
    // Si el toque terminó sobre el overlay del vídeo y no fue un swipe,
    // dejarlo al listener touch del overlay — no llamar goTo aquí.
    if (e.target.closest('.vc-overlay')) {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
      if (dx <= 10) return;
    }
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (delta < -slideWidth() * 0.18) next();
    else if (delta > slideWidth() * 0.18) prev();
    else goTo(currentPage);
    resetAuto();
  });

  prevBtn.addEventListener('click', () => { prev(); resetAuto(); });
  nextBtn.addEventListener('click', () => { next(); resetAuto(); });

  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', () => { if (!isAnyVideoPlaying()) resetAuto(); });

  window.addEventListener('resize', () => {
    updateSlideWidths();
    buildDots();
    goTo(Math.min(currentPage, totalPages() - 1), false);
  });

  // Init
  updateSlideWidths();
  buildDots();
  goTo(0, false, true);   // forceLayout=true → espera al siguiente frame para centrar el dot
  resetAuto();

  // ── Precarga de metadatos y primer fotograma ─────────────────────────────────────
  // 1. Todos los vídeos cargan metadatos al init; el actual y el adyacente
  //    usan preload="auto" para play inmediato sin buffering visible.
  // 2. currentTime=0.001 fuerza el primer fotograma en Safari/iOS.
  function actualizarPreload(paginaActual) {
    slides.forEach(function(slide, idx) {
      var vid = slide.querySelector('.vc-video');
      if (!vid) return;
      var esActual    = idx === paginaActual;
      var esAdyacente = idx === (paginaActual + 1) % total ||
                        idx === (paginaActual - 1 + total) % total;
      vid.preload = (esActual || esAdyacente) ? 'auto' : 'metadata';
    });
  }

  slides.forEach(function(slide) {
    var vid = slide.querySelector('.vc-video');
    if (!vid) return;
    vid.load();
    vid.addEventListener('loadedmetadata', function onMeta() {
      vid.currentTime = 0.001;
      vid.removeEventListener('loadedmetadata', onMeta);
    });
  });

  // Cuando el usuario cambia de slide, actualizar preload del nuevo actual
  var _goToOriginal = goTo;
  goTo = function(page, animate, forceLayout) {
    _goToOriginal(page, animate, forceLayout);
    actualizarPreload(currentPage);
  };

  actualizarPreload(0);
}

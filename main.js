/* ═══════════════════════════════════════════════════════
   main.js — Coro Saudade de Pamplona
   Lógica principal: navbar, fade-in, carrusel de fotos,
   formulario de contacto y utilidades generales.
   ═══════════════════════════════════════════════════════ */

// Autoplay vídeos de la sección coro al entrar en viewport
(function() {
  const nvideos = ['nvid1','nvid2','nvid3'].map(id => document.getElementById(id)).filter(Boolean);
  nvideos.forEach(v => { v.muted = true; });
  const nobs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        nvideos.forEach(v => v.play().catch(()=>{}));
      } else {
        nvideos.forEach(v => v.pause());
      }
    });
  }, { threshold: 0.3 });
  const nrow = document.getElementById('nosotrosVideoRow');
  if (nrow) nobs.observe(nrow);
})();

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', (window.scrollY || window.pageYOffset) > 50);
});

// ─── HAMBURGER
const ham = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');
ham.addEventListener('click', () => mob.classList.toggle('open'));
function closeMobile() { mob.classList.remove('open'); }

// ─── FADE IN OBSERVER
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 120);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ─── CAROUSEL
// initCarousel() es llamado por carrusel-loader.js una vez inyectados los slides.
// Si no hay carrusel-loader (uso sin JSON), se llama desde DOMContentLoaded.
function initCarousel() {
  const wrapper  = document.getElementById('carouselWrapper');
  const track    = document.getElementById('carouselTrack');
  if (!wrapper || !track) return;
  const slides   = Array.from(track.querySelectorAll('.carousel-slide'));
  if (slides.length === 0) return; // nada que inicializar
  const dotsEl   = document.getElementById('carouselDots');
  const counter  = document.getElementById('carouselCounter');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');
  const progress = document.getElementById('carouselProgress');

  const total = slides.length;
  let currentPage = 0;
  let autoTimer;
  let isDragging = false;
  let dragStartX = 0;
  let dragCurrentX = 0;
  let dragStartTranslate = 0;

  function slidesVisible() {
    return 1;
  }

  function totalPages() {
    return Math.ceil(total / slidesVisible());
  }

  function slideWidth() {
    return wrapper.offsetWidth / slidesVisible();
  }

  function getTranslateForPage(page) {
    return -(page * slidesVisible() * slideWidth());
  }

  function applyTranslate(x, animate) {
    track.classList.toggle('animating', animate);
    track.style.transform = `translateX(${x}px)`;
  }

  function updateSlideWidths() {
    const sv = slidesVisible();
    slides.forEach(s => { s.style.flex = `0 0 ${100 / sv}%`; });
  }

  function updateActiveSlides() {
    const sv = slidesVisible();
    const start = currentPage * sv;
    slides.forEach((s, i) => {
      s.classList.toggle('active', i >= start && i < start + sv);
    });
  }

  function updateDots(forceLayout) {
    // Barra segmentada: solo toggle de clase, no hace falta scroll
    dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentPage);
    });
  }

  function updateCounter() {
    counter.textContent = `${currentPage + 1} / ${totalPages()}`;
  }

  function updateProgress() {
    const pct = ((currentPage + 1) / totalPages()) * 100;
    progress.style.width = `${pct}%`;
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
    currentPage = Math.max(0, Math.min(page, totalPages() - 1));
    applyTranslate(getTranslateForPage(currentPage), animate);
    updateActiveSlides();
    updateDots(forceLayout);
    updateCounter();
    updateProgress();
  }

  function next() { goTo((currentPage + 1) % totalPages()); }
  function prev() { goTo((currentPage - 1 + totalPages()) % totalPages()); }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, 5500);
  }

  // ── Mouse drag
  wrapper.addEventListener('mousedown', e => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartTranslate = getTranslateForPage(currentPage);
    wrapper.classList.add('dragging');
    track.classList.remove('animating');
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    dragCurrentX = e.clientX;
    const delta = dragCurrentX - dragStartX;
    // Rubber-band resistance at edges
    const newX = dragStartTranslate + delta;
    const minX = getTranslateForPage(totalPages() - 1);
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
    const delta = e.clientX - dragStartX;
    const threshold = slideWidth() * 0.2;
    if (delta < -threshold) next();
    else if (delta > threshold) prev();
    else goTo(currentPage); // snap back
    resetAuto();
  });

  // ── Touch drag
  let touchStartX = 0;
  wrapper.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    dragStartTranslate = getTranslateForPage(currentPage);
    track.classList.remove('animating');
  }, { passive: true });

  wrapper.addEventListener('touchmove', e => {
    const delta = e.touches[0].clientX - touchStartX;
    const newX = dragStartTranslate + delta;
    const minX = getTranslateForPage(totalPages() - 1);
    const maxX = 0;
    let bounded = newX;
    if (newX > maxX) bounded = maxX + (newX - maxX) * 0.25;
    if (newX < minX) bounded = minX + (newX - minX) * 0.25;
    track.style.transform = `translateX(${bounded}px)`;
  }, { passive: true });

  wrapper.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    const threshold = slideWidth() * 0.18;
    if (delta < -threshold) next();
    else if (delta > threshold) prev();
    else goTo(currentPage);
    resetAuto();
  });

  prevBtn.addEventListener('click', () => { prev(); resetAuto(); });
  nextBtn.addEventListener('click', () => { next(); resetAuto(); });

  // Pause on hover
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', () => resetAuto());

  // Keyboard navigation when focused
  document.addEventListener('keydown', e => {
    const galleryVisible = wrapper.getBoundingClientRect().top < window.innerHeight && wrapper.getBoundingClientRect().bottom > 0;
    if (!galleryVisible) return;
    if (e.key === 'ArrowRight') { next(); resetAuto(); }
    if (e.key === 'ArrowLeft')  { prev(); resetAuto(); }
  });

  window.addEventListener('resize', () => {
    updateSlideWidths();
    buildDots();
    goTo(Math.min(currentPage, totalPages() - 1), false);
  });

  // ── Precarga de imágenes ─────────────────────────────────────────────────
  // Estrategia: carga eagerly las primeras 3 imágenes (visibles de inmediato),
  // y el resto con un IntersectionObserver en el wrapper que adelanta la carga
  // antes de que el usuario llegue a ellas (rootMargin generoso).
  function precargarImagenes() {
    slides.forEach((slide, idx) => {
      const img = slide.querySelector('img.carousel-img');
      if (!img) return;

      if (idx < 3) {
        // Primeras 3: carga inmediata
        img.removeAttribute('loading');
        img.decoding = 'async';
        if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      } else {
        // Resto: quitar lazy y observar con margen amplio para cargar antes de tiempo
        img.loading = 'eager';
        img.decoding = 'async';
        if (img.dataset.src) {
          const lazyObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(en => {
              if (en.isIntersecting) {
                en.target.src = en.target.dataset.src;
                delete en.target.dataset.src;
                obs.unobserve(en.target);
              }
            });
          }, { rootMargin: '0px 600px 0px 600px' }); // 600px de antelación a cada lado
          lazyObs.observe(img);
        }
      }
    });
  }

  // ── Indicador de carga por slide (skeleton mientras llega la imagen) ───────
  slides.forEach(slide => {
    const img = slide.querySelector('img.carousel-img');
    if (!img) return;
    if (!img.complete || img.naturalWidth === 0) {
      slide.classList.add('img-loading');
      img.addEventListener('load',  () => slide.classList.remove('img-loading'), { once: true });
      img.addEventListener('error', () => slide.classList.remove('img-loading'), { once: true });
    }
  });

  // Init
  updateSlideWidths();
  buildDots();
  precargarImagenes();
  goTo(0, false, true);
  resetAuto();
}

// Polyfill Promise.allSettled para Safari < 13
if (!Promise.allSettled) {
  Promise.allSettled = function(promises) {
    return Promise.all(promises.map(function(p) {
      return Promise.resolve(p).then(
        function(v) { return { status: 'fulfilled', value: v }; },
        function(e) { return { status: 'rejected', reason: e }; }
      );
    }));
  };
}

// ─── FORM BACKEND CONFIG
const FORMSPREE_URL  = 'https://formspree.io/f/xojrlgdl';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdd9Q1gctl-0tXDyU0IGILLSBBh6GRBDoVsuZM8QVMiXlAoHBgABBhJQX-ADUSng-44Q/exec';

async function handleSubmit() {
  const form = document.getElementById('joinForm');
  const btn  = document.getElementById('submitBtn');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  btn.textContent = 'Enviando…';
  btn.disabled = true;
  const data = {
    nombre: form.nombre.value.trim(),
    apellidos: form.apellidos.value.trim(),
    email: form.email.value.trim(),
    telefono: form.telefono.value.trim() || '—',
    mensaje: form.mensaje.value.trim() || '—',
    fecha: new Date().toLocaleDateString('es-ES'),
    hora: new Date().toLocaleTimeString('es-ES'),
  };
  const results = await Promise.allSettled([
    enviarFormspree(data),
    enviarGoogleSheets(data),
  ]);
  const formspreeOk = results[0].status === 'fulfilled' && results[0].value;
  const sheetsOk    = results[1].status === 'fulfilled' && results[1].value;
  document.getElementById('formContent').style.display = 'none';
  document.getElementById('formSuccess').style.display  = 'block';
   
  if (formspreeOk || sheetsOk) {
    // Texto elegante sin emojis brillantes que rompan la estética dorada/oscura
    showNotification('Mensaje enviado con éxito. Nos pondremos en contacto contigo lo antes posible.');
  } else {
    showNotification('Solicitud recibida. Contactaremos contigo en breve.');
  }
}
async function enviarFormspree(data) {
  if (FORMSPREE_URL.includes('TU_ID_AQUI')) return false;
  const res = await fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: `Nueva solicitud de ingreso — ${data.nombre} ${data.apellidos}`,
      nombre: `${data.nombre} ${data.apellidos}`,
      email: data.email, telefono: data.telefono,
      cuerda: data.cuerda, experiencia: data.experiencia,
      mensaje: data.mensaje, fecha: `${data.fecha} ${data.hora}`,
    }),
  });
  return res.ok;
}
async function enviarGoogleSheets(data) {
  if (APPS_SCRIPT_URL.includes('TU_SCRIPT_AQUI')) return false;
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return true;
}
function showNotification(msg) {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 4000);
}
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    mob.classList.remove('open');
    const target = document.querySelector(href);
    if (target) {
      // Fallback para Safari < 15.4 que no soporta scroll suave en scrollIntoView
      if ('scrollBehavior' in document.documentElement.style) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        var top = target.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      history.replaceState(null, '', window.location.pathname);
    }
  });
});
// ─── CUSTOM SELECTS
document.querySelectorAll('.custom-select').forEach(cs => {
  const trigger = cs.querySelector('.custom-select-trigger');
  const options = cs.querySelectorAll('.custom-option');
  const nativeSelect = document.getElementById(cs.dataset.for);

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select.open').forEach(o => {
      if (o !== cs) o.classList.remove('open');
    });
    cs.classList.toggle('open');
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.value;
      const label = opt.textContent.trim();
      trigger.querySelector('span:first-child').textContent = label;
      trigger.classList.remove('placeholder-active');
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      nativeSelect.value = val;
      cs.classList.remove('open');
    });
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select.open').forEach(cs => cs.classList.remove('open'));
});

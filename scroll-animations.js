/**
 * scroll-animations.js — Coro Saudade
 * Añade animaciones al hacer scroll en la web.
 * Incluir con: <script src="scroll-animations.js" defer></script>
 *
 * Animaciones incluidas:
 *  · fade-up        — aparición con subida (ya existe, mejorada)
 *  · parallax       — desplazamiento suave en secciones de fondo
 *  · counter        — números que cuentan hasta su valor al entrar en vista
 *  · line-draw      — líneas decorativas que "se dibujan" al aparecer
 *  · stagger-chars  — títulos que revelan letra a letra
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     1. FADE-UP MEJORADO
     Reemplaza el observer del index.html si
     se incluye este archivo después.
  ───────────────────────────────────────── */
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        // Escalonado por orden dentro del viewport
        const siblings = Array.from(
          entry.target.parentElement?.querySelectorAll('.fade-in') || []
        );
        const idx = siblings.indexOf(entry.target);
        const delay = idx * 90; // ms entre hermanos
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        fadeObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.fade-in').forEach((el) =>
    fadeObserver.observe(el)
  );


  /* ─────────────────────────────────────────
     2. PARALLAX EN SECCIONES
     Mueve elementos con data-parallax="N"
     (N = intensidad, p.ej. 0.15)
  ───────────────────────────────────────── */
  const parallaxEls = document.querySelectorAll('[data-parallax]');

  function applyParallax() {
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      const rect  = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${center * speed}px)`;
    });
  }

  if (parallaxEls.length) {
    window.addEventListener('scroll', applyParallax, { passive: true });
    applyParallax();
  }

  // Aplica automáticamente a las imágenes laterales del hero
  const heroSides = document.querySelectorAll('.hero-side img');
  heroSides.forEach((img, i) => {
    img.dataset.parallax = i === 0 ? '0.08' : '-0.08';
    parallaxEls.length || img.setAttribute('data-parallax-auto', '1');
  });
  if (heroSides.length) {
    function applyHeroParallax() {
      const scrollY = window.scrollY;
      heroSides.forEach((img, i) => {
        const dir   = i === 0 ? 1 : -1;
        const shift = scrollY * 0.06 * dir;
        img.style.transform = `scale(1.04) translateY(${shift}px)`;
      });
    }
    window.addEventListener('scroll', applyHeroParallax, { passive: true });
  }


  /* ─────────────────────────────────────────
     3. CONTADORES ANIMADOS
     Los elementos .stat-number suben desde 0
     hasta su valor real al entrar en vista.
  ───────────────────────────────────────── */
  function animateCounter(el) {
    const raw    = el.textContent.trim();
    const prefix = raw.match(/^[^\d]*/)?.[0] || '';
    const suffix = raw.match(/[^\d]*$/)?.[0] || '';
    const target = parseInt(raw.replace(/\D/g, ''), 10);
    if (isNaN(target)) return;

    const duration = 1400; // ms
    const start    = performance.now();

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);
      el.textContent = prefix + value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('.stat-number').forEach((el) =>
    counterObserver.observe(el)
  );


  /* ─────────────────────────────────────────
     4. LÍNEAS QUE SE DIBUJAN
     Añade la clase .draw-line a cualquier
     elemento hr o .ornament-line para que
     aparezca con una animación de dibujo.
  ───────────────────────────────────────── */
  const lineStyle = document.createElement('style');
  lineStyle.textContent = `
    .ornament-line::before,
    .ornament-line::after {
      transform-origin: left center;
      transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  opacity  0.8s ease;
    }
    .ornament-line.line-hidden::before,
    .ornament-line.line-hidden::after {
      transform: scaleX(0);
      opacity: 0;
    }
    .ornament-line::after {
      transform-origin: right center;
    }
  `;
  document.head.appendChild(lineStyle);

  const lineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('line-hidden');
          lineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('.ornament-line').forEach((el) => {
    el.classList.add('line-hidden');
    lineObserver.observe(el);
  });


  /* ─────────────────────────────────────────
     5. TÍTULOS CON REVEAL DE PALABRAS
     Añade data-reveal a cualquier h2 o h1
     para que las palabras aparezcan una a una.
     El index.html ya tiene los section-title,
     se aplica automáticamente a ellos.
  ───────────────────────────────────────── */
  const revealStyle = document.createElement('style');
  revealStyle.textContent = `
    .reveal-word {
      display: inline-block;
      overflow: hidden;
      vertical-align: bottom;
    }
    .reveal-word-inner {
      display: inline-block;
      transform: translateY(110%);
      opacity: 0;
      transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity  0.65s ease;
    }
    .reveal-word-inner.revealed {
      transform: translateY(0);
      opacity: 1;
    }
  `;
  document.head.appendChild(revealStyle);

  function wrapWords(el) {
    // Preserva nodos em/strong/span hijos
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach((tn) => {
      const words = tn.textContent.split(/(\s+)/);
      const frag  = document.createDocumentFragment();
      words.forEach((w) => {
        if (/^\s+$/.test(w)) {
          frag.appendChild(document.createTextNode(w));
        } else {
          const span  = document.createElement('span');
          span.className = 'reveal-word';
          const inner = document.createElement('span');
          inner.className = 'reveal-word-inner';
          inner.textContent = w;
          span.appendChild(inner);
          frag.appendChild(span);
        }
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const inners = entry.target.querySelectorAll('.reveal-word-inner');
        inners.forEach((inner, i) => {
          setTimeout(() => inner.classList.add('revealed'), i * 60);
        });
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll('.section-title').forEach((el) => {
    wrapWords(el);
    revealObserver.observe(el);
  });


  /* ─────────────────────────────────────────
     6. INDICADOR DE PROGRESO DE SCROLL
     Barra fina dorada en la parte superior
     que muestra cuánto has leído.
  ───────────────────────────────────────── */
  const bar = document.createElement('div');
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 2px;
    width: 0%;
    background: linear-gradient(to right, #a07c18, #c8a93a);
    z-index: 9999;
    pointer-events: none;
    transition: width 0.1s linear;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.body.scrollHeight - window.innerHeight;
    bar.style.width = `${(scrolled / total) * 100}%`;
  }, { passive: true });

})();

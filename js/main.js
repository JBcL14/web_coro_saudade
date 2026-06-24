/* ════════════════════════════════════════════════
   CORO SAUDADE — JavaScript Principal
════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── LOADER ── */
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hidden');
    triggerHeroReveal();
  }, 1800);

  /* ── CURSOR PERSONALIZADO ── */
  const cursor = document.getElementById('cursor');
  const cursorFollower = document.getElementById('cursorFollower');
  let followerX = 0, followerY = 0, mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth follower
  (function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top  = followerY + 'px';
    requestAnimationFrame(animateFollower);
  })();

  // Hover effect on interactive elements
  document.querySelectorAll('a, button, .voice-card, .timeline-card, .gallery-item, .concert-item')
    .forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });


  /* ── NAVEGACIÓN ── */
  const nav     = document.getElementById('nav');
  const burger  = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Scroll → nav scrolled
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveNav();
  }, { passive: true });

  // Burger menu
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on link click
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });

  // Active nav link based on scroll position
  function updateActiveNav() {
    const sections = document.querySelectorAll('.page');
    let currentId = 'inicio';
    sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= 120) currentId = section.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === currentId);
    });
  }


  /* ── REVEAL ON SCROLL ── */
  function triggerHeroReveal() {
    document.querySelectorAll('.hero .reveal').forEach(el => {
      el.classList.add('visible');
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.timeline-card, .voice-card, .rep-card, .highlight-card, .director-spotlight, .join-cta, .concert-item, .gallery-item, .album-card, .contact-block, .contact-form')
    .forEach(el => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });


  /* ══════════════════════════════════════════════
     DATOS — REPERTORIO
  ══════════════════════════════════════════════ */
  const repertorio = [
    { era: 'renacimiento', titulo: 'Lux Aeterna',          compositor: 'Tomás Luis de Victoria', desc: 'Motete a 4 voces. Una de las joyas más brillantes del Renacimiento español.' },
    { era: 'renacimiento', titulo: 'O Magnum Mysterium',   compositor: 'Tomás Luis de Victoria', desc: 'Motete de Navidad de una belleza sobrecogedora y luminosa.' },
    { era: 'renacimiento', titulo: 'Ave Maria',             compositor: 'Josquin Des Prez',       desc: 'Obra capital del Renacimiento europeo, de una textura polifónica sin igual.' },
    { era: 'barroco',      titulo: 'Jesu, Joy of Man\'s Desiring', compositor: 'J.S. Bach',      desc: 'Transcripción coral del famoso coral BWV 147, de una serenidad incomparable.' },
    { era: 'barroco',      titulo: 'Hallelujah',            compositor: 'G.F. Händel',            desc: 'El gran coro del Mesías. Un momento de pura euforia coral que siempre emociona.' },
    { era: 'barroco',      titulo: 'Stabat Mater',          compositor: 'G.B. Pergolesi',         desc: 'Obra de una ternura infinita que combina dolor y esperanza de forma única.' },
    { era: 'romantico',    titulo: 'Requiem (Introito)',    compositor: 'Gabriel Fauré',           desc: 'El movimiento inicial del Requiem más íntimo y luminoso del repertorio romántico.' },
    { era: 'romantico',    titulo: 'In der Stille der Nacht', compositor: 'Johannes Brahms',      desc: 'Lied coral que captura la melancolía y la profundidad del Romanticismo alemán.' },
    { era: 'romantico',    titulo: 'Sure on This Shining Night', compositor: 'Samuel Barber',    desc: 'Coral de una modernidad eterna que mezcla romanticismo tardío con influencias americanas.' },
    { era: 'contemporaneo', titulo: 'O Salutaris',          compositor: 'Ēriks Ešenvalds',        desc: 'El maestro letón contemporáneo en una obra de cristalina belleza y técnica vocal avanzada.' },
    { era: 'contemporaneo', titulo: 'Lux Aurumque',         compositor: 'Eric Whitacre',          desc: 'Icono de la música coral contemporánea. Armonías que crean paisajes sonoros únicos.' },
    { era: 'contemporaneo', titulo: 'Morten Lauridsen: Dirait-on', compositor: 'Morten Lauridsen', desc: 'Del ciclo Les Chansons des Roses, una obra de lirismo francés irresistible.' },
    { era: 'fado',          titulo: 'Estranha Forma de Vida', compositor: 'Amália Rodrigues',     desc: 'El fado de la reina Amália en arreglo coral. La saudade hecha canción colectiva.' },
    { era: 'fado',          titulo: 'Fado Português',        compositor: 'Alain Oulman',           desc: 'Himno del fado tradicional, revisitado para voces mixtas con una emoción única.' },
    { era: 'fado',          titulo: 'Canção do Mar',         compositor: 'Ferrer Trindade',        desc: 'Canción del pueblo portugués que habla de partidas, olas y eternos regresos.' },
  ];

  const eraLabels = {
    renacimiento:  'Renacimiento',
    barroco:       'Barroco',
    romantico:     'Romántico',
    contemporaneo: 'Contemporáneo',
    fado:          'Fado & Folk',
  };

  function renderRepertorio(filter = 'all') {
    const grid = document.getElementById('repertorioGrid');
    grid.innerHTML = '';
    const items = filter === 'all' ? repertorio : repertorio.filter(r => r.era === filter);
    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'rep-card reveal';
      card.innerHTML = `
        <span class="rep-tag">${eraLabels[item.era]}</span>
        <h4>${item.titulo}</h4>
        <p class="rep-composer">${item.compositor}</p>
        <p>${item.desc}</p>
      `;
      grid.appendChild(card);
      // Stagger reveal
      setTimeout(() => {
        revealObserver.observe(card);
      }, i * 40);
    });
  }

  renderRepertorio();

  // Filtros
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderRepertorio(btn.dataset.filter);
    });
  });


  /* ══════════════════════════════════════════════
     DATOS — CONCIERTOS
  ══════════════════════════════════════════════ */
  const conciertos = [
    { dia: '14', mes: 'Jun', titulo: 'Concierto de Primavera', lugar: 'Auditorio Nacional, Madrid', tipo: 'Entradas disponibles' },
    { dia: '28', mes: 'Jun', titulo: 'Festival Coral de Ávila', lugar: 'Catedral de Ávila', tipo: 'Entradas disponibles' },
    { dia: '12', mes: 'Jul', titulo: 'Noches de Música Antigua', lugar: 'El Escorial, Madrid',  tipo: 'Sold out', sold: true },
    { dia: '23', mes: 'Ago', titulo: 'Festival Internacional de Sintra', lugar: 'Palácio Nacional, Sintra', tipo: 'Entradas disponibles' },
    { dia: '20', mes: 'Sep', titulo: 'Apertura Temporada 2024-25', lugar: 'Centro Cultural La Nave, Madrid', tipo: 'Entrada libre' },
    { dia: '15', mes: 'Nov', titulo: 'Concierto Solidario', lugar: 'Teatro Fernández-Shaw, Madrid', tipo: 'Entradas disponibles' },
    { dia: '21', mes: 'Dic', titulo: 'Concierto de Navidad', lugar: 'Basílica de San Miguel, Madrid', tipo: 'Sold out', sold: true },
  ];

  function renderConciertos() {
    const list = document.getElementById('concertList');
    list.innerHTML = '';
    conciertos.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'concert-item reveal';
      item.innerHTML = `
        <div class="concert-date">
          <span class="concert-date-day">${c.dia}</span>
          <span class="concert-date-month">${c.mes}</span>
        </div>
        <div class="concert-info">
          <h4>${c.titulo}</h4>
          <p>📍 ${c.lugar}</p>
        </div>
        <span class="concert-badge${c.sold ? ' sold-out' : ''}">${c.tipo}</span>
      `;
      list.appendChild(item);
      setTimeout(() => revealObserver.observe(item), i * 60);
    });
  }

  renderConciertos();


  /* ══════════════════════════════════════════════
     FORMULARIO DE CONTACTO
  ══════════════════════════════════════════════ */
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    // Validación básica
    const fields = [
      { id: 'name',    msg: 'Por favor, introduce tu nombre.' },
      { id: 'email',   msg: 'Por favor, introduce un email válido.' },
      { id: 'message', msg: 'Por favor, escribe tu mensaje.' },
    ];

    fields.forEach(f => {
      const input = document.getElementById(f.id);
      const group = input.closest('.form-group');
      const error = group.querySelector('.form-error');
      let fieldValid = input.value.trim() !== '';
      if (f.id === 'email') fieldValid = fieldValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      if (!fieldValid) {
        group.classList.add('error');
        error.textContent = f.msg;
        valid = false;
      } else {
        group.classList.remove('error');
        error.textContent = '';
      }
    });

    if (!valid) return;

    // Simulación de envío
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = 'Enviar Mensaje';
      submitBtn.disabled = false;
      formSuccess.classList.add('visible');
      setTimeout(() => formSuccess.classList.remove('visible'), 5000);
    }, 1200);
  });

  // Limpiar error al escribir
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      const group = input.closest('.form-group');
      group.classList.remove('error');
      group.querySelector('.form-error').textContent = '';
    });
  });


  /* ══════════════════════════════════════════════
     SMOOTH SCROLL para anclas internas
  ══════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  /* ══════════════════════════════════════════════
     PARALLAX sutil en el hero
  ══════════════════════════════════════════════ */
  const heroBg = document.querySelector('.hero-bg');
  window.addEventListener('scroll', () => {
    if (!heroBg) return;
    const scrolled = window.scrollY;
    heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
  }, { passive: true });


  /* ══════════════════════════════════════════════
     PARTÍCULAS MUSICALES (notas flotantes en hero)
  ══════════════════════════════════════════════ */
  const hero = document.querySelector('.hero');
  const notes = ['♩', '♪', '♫', '♬', '𝄞', '♭', '♮'];
  let noteInterval;

  function createNote() {
    const note = document.createElement('div');
    note.textContent = notes[Math.floor(Math.random() * notes.length)];
    note.style.cssText = `
      position: absolute;
      left: ${10 + Math.random() * 80}%;
      top: ${20 + Math.random() * 70}%;
      font-size: ${0.8 + Math.random() * 1.2}rem;
      color: rgba(201,168,76,${0.05 + Math.random() * 0.15});
      pointer-events: none;
      z-index: 1;
      animation: noteFloat ${4 + Math.random() * 4}s ease-in-out forwards;
      transform: rotate(${-20 + Math.random() * 40}deg);
    `;
    hero.appendChild(note);
    setTimeout(() => note.remove(), 8000);
  }

  // Inject keyframes for floating notes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes noteFloat {
      0%   { opacity: 0; transform: translateY(0) rotate(var(--r, 0deg)) scale(0.5); }
      20%  { opacity: 1; }
      80%  { opacity: 0.5; }
      100% { opacity: 0; transform: translateY(-60px) rotate(calc(var(--r, 0deg) + 20deg)) scale(1); }
    }
  `;
  document.head.appendChild(style);

  // Start notes after loader
  setTimeout(() => {
    createNote();
    noteInterval = setInterval(createNote, 2500);
  }, 2000);

  // Stop notes when hero is not visible
  const heroObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) {
      clearInterval(noteInterval);
    } else {
      noteInterval = setInterval(createNote, 2500);
    }
  });
  if (hero) heroObserver.observe(hero);


  /* ══════════════════════════════════════════════
     CONTADOR ANIMADO (highlights)
  ══════════════════════════════════════════════ */
  function animateCounter(el, target, suffix = '') {
    const duration = 1500;
    const start = performance.now();
    const isPlus = el.textContent.includes('+');

    (function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = value + (isPlus ? '+' : '') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    })(start);
  }

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const numEl = entry.target.querySelector('.highlight-num');
        if (numEl && !numEl.dataset.animated) {
          numEl.dataset.animated = true;
          const raw = numEl.textContent.replace(/[^0-9]/g, '');
          animateCounter(numEl, parseInt(raw));
        }
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.highlight-card').forEach(card => {
    counterObserver.observe(card);
  });

}); // END DOMContentLoaded

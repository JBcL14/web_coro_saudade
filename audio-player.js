/**
 * audio-player.js — Coro Saudade
 * Reproduce canciones aleatorias desde la carpeta /canciones (invisible).
 * Incluir con: <script src="audio-player.js" defer></script>
 *
 * ⚠️  Pon los archivos de audio en: canciones/
 *     Edita el array CANCIONES con los nombres de tus archivos.
 */

(function () {
  'use strict';

  // ── EDITA ESTA LISTA con tus archivos de audio ──────────────────────────
  const CANCIONES = [
    'canciones/cancion1.mp3',
  ];
  // ────────────────────────────────────────────────────────────────────────

  if (!CANCIONES.length) return;

  // Mezcla aleatoria (Fisher-Yates)
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let lista   = shuffle(CANCIONES);
  let indice  = 0;
  const audio = new Audio();
  audio.volume = 0.5;

  function cargarSiguiente() {
    audio.src = lista[indice];
    audio.load();
  }

  function reproducir() {
    audio.play().catch(() => {
      // Autoplay bloqueado: espera interacción del usuario
      const reanudar = () => {
        audio.play();
        document.removeEventListener('click', reanudar);
        document.removeEventListener('keydown', reanudar);
      };
      document.addEventListener('click',   reanudar, { once: true });
      document.addEventListener('keydown', reanudar, { once: true });
    });
  }

  audio.addEventListener('ended', () => {
    indice++;
    if (indice >= lista.length) {
      lista  = shuffle(CANCIONES); // nueva mezcla al acabar el ciclo
      indice = 0;
    }
    cargarSiguiente();
    reproducir();
  });

  cargarSiguiente();
  reproducir();

})();

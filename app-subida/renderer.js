/* ═══════════════════════════════════════════════════════════════════
   renderer.js — Saudade Medios (interfaz)
   Va en archivo externo porque la CSP del index.html (default-src
   'self') bloquea los scripts inline. Habla con el proceso principal
   a través de window.api (ver preload.js).

   Dos páginas: "Fotos y vídeos" (carruseles en R2) y "Conciertos"
   (agenda de la web, guardada también en R2 vía /api/agenda).
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Configuración común ──────────────────────────────────────────────────
  var inputUrl = document.getElementById('url');
  var inputToken = document.getElementById('token');
  var btnGuardar = document.getElementById('btnGuardar');
  var mensajeConfig = document.getElementById('mensajeConfig');

  // ── Página de medios ─────────────────────────────────────────────────────
  var btnElegir = document.getElementById('btnElegir');
  var btnSubir = document.getElementById('btnSubir');
  var btnActualizar = document.getElementById('btnActualizar');
  var seleccion = document.getElementById('seleccion');
  var mensaje = document.getElementById('mensaje');

  var rutasElegidas = [];

  // ── Página de conciertos ─────────────────────────────────────────────────
  var btnAnadirConcierto = document.getElementById('btnAnadirConcierto');
  var btnActualizarAgenda = document.getElementById('btnActualizarAgenda');
  var mensajeConcierto = document.getElementById('mensajeConcierto');

  // ── Utilidades ───────────────────────────────────────────────────────────
  function avisarEn(elemento, texto, clase) {
    elemento.textContent = texto;
    elemento.className = 'mensaje' + (clase ? ' ' + clase : '');
  }
  function avisar(texto, clase) { avisarEn(mensaje, texto, clase); }
  function avisarConcierto(texto, clase) { avisarEn(mensajeConcierto, texto, clase); }

  function guardarConfig() {
    return window.api.guardarConfig({ url: inputUrl.value.trim(), token: inputToken.value.trim() });
  }

  // ── Pestañas ─────────────────────────────────────────────────────────────
  var tabMedios = document.getElementById('tabMedios');
  var tabConciertos = document.getElementById('tabConciertos');
  var paginaMedios = document.getElementById('paginaMedios');
  var paginaConciertos = document.getElementById('paginaConciertos');

  function mostrarPagina(cual) {
    var esMedios = cual === 'medios';
    paginaMedios.classList.toggle('oculta', !esMedios);
    paginaConciertos.classList.toggle('oculta', esMedios);
    tabMedios.classList.toggle('activa', esMedios);
    tabConciertos.classList.toggle('activa', !esMedios);
  }

  tabMedios.addEventListener('click', function () { mostrarPagina('medios'); });
  tabConciertos.addEventListener('click', function () {
    mostrarPagina('conciertos');
    if (inputUrl.value.trim()) cargarAgenda();
  });

  // ═════════════════════ FOTOS Y VÍDEOS ═════════════════════

  function nombreDeRuta(ruta) {
    return ruta.split(/[\\/]/).pop();
  }

  function pintarSeleccion() {
    seleccion.textContent = rutasElegidas.length
      ? rutasElegidas.map(nombreDeRuta).join('\n')
      : 'Ningún archivo seleccionado.';
  }

  // Convierte la fila en un campo de edición para renombrar el archivo.
  // (Electron no soporta prompt(), así que se edita en la propia fila.)
  function editarNombre(li, nombre, prefijo) {
    li.innerHTML = '';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'renombrar';
    input.value = nombre.replace(/\.\w+$/, '');
    var btnOk = document.createElement('button');
    btnOk.textContent = 'Guardar';
    var btnNo = document.createElement('button');
    btnNo.textContent = 'Cancelar';

    function confirmarCambio() {
      var nuevo = input.value.trim();
      if (!nuevo) { avisar('El nombre no puede estar vacío.', 'error'); return; }
      btnOk.disabled = true;
      window.api.renombrar(prefijo + nombre, nuevo)
        .then(function (res) {
          avisar('Renombrado a: ' + res.renombrado, 'ok');
          cargarLista();
        })
        .catch(function (err) {
          avisar(err.message, 'error');
          cargarLista();
        });
    }

    btnOk.addEventListener('click', confirmarCambio);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') confirmarCambio();
      if (e.key === 'Escape') cargarLista();
    });
    btnNo.addEventListener('click', function () { cargarLista(); });

    li.appendChild(input);
    li.appendChild(btnOk);
    li.appendChild(btnNo);
    input.focus();
    input.select();
  }

  function pintarLista(elemento, nombres, prefijo, borrable) {
    if (!nombres.length) {
      elemento.innerHTML = '<li class="vacio">No hay archivos todavía.</li>';
      return;
    }
    elemento.innerHTML = '';
    nombres.forEach(function (nombre) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.textContent = nombre;
      li.appendChild(span);
      if (borrable) {
        var btnRen = document.createElement('button');
        btnRen.textContent = 'Renombrar';
        btnRen.addEventListener('click', function () { editarNombre(li, nombre, prefijo); });
        li.appendChild(btnRen);
        var btn = document.createElement('button');
        btn.textContent = 'Borrar';
        btn.className = 'peligro';
        btn.addEventListener('click', function () { borrar(prefijo + nombre); });
        li.appendChild(btn);
      } else {
        var aviso = document.createElement('span');
        aviso.className = 'vacio';
        aviso.textContent = 'del repositorio';
        li.appendChild(aviso);
      }
      elemento.appendChild(li);
    });
    if (!borrable) {
      var pie = document.createElement('li');
      pie.className = 'vacio';
      pie.textContent = 'Estos archivos vienen del repositorio git, no del bucket R2: se sustituyen automáticamente en cuanto subas los primeros archivos.';
      elemento.appendChild(pie);
    }
  }

  function cargarLista() {
    window.api.listar()
      .then(function (datos) {
        var origen = datos.origen || {};
        pintarLista(document.getElementById('listaImagenes'), datos.images || [], 'images/', origen.images !== 'estatico');
        pintarLista(document.getElementById('listaVideos'), datos.videos || [], 'videos/', origen.videos !== 'estatico');
      })
      .catch(function (err) {
        avisar('No se pudo cargar la lista: ' + err.message, 'error');
      });
  }

  function borrar(clave) {
    window.api.confirmar('¿Borrar ' + clave + ' del bucket R2?').then(function (ok) {
      if (!ok) return;
      window.api.borrar(clave)
        .then(function () {
          avisar('Borrado: ' + clave, 'ok');
          cargarLista();
        })
        .catch(function (err) { avisar(err.message, 'error'); });
    });
  }

  btnGuardar.addEventListener('click', function () {
    guardarConfig()
      .then(function () {
        avisarEn(mensajeConfig, 'Configuración guardada.', 'ok');
        cargarLista();
        cargarAgenda();
      })
      .catch(function (err) { avisarEn(mensajeConfig, err.message, 'error'); });
  });

  btnElegir.addEventListener('click', function () {
    window.api.elegir().then(function (rutas) {
      if (rutas.length) rutasElegidas = rutas;
      pintarSeleccion();
    });
  });

  btnActualizar.addEventListener('click', function () {
    avisar('Actualizando listas…');
    window.api.listar()
      .then(function () { avisar(''); cargarLista(); })
      .catch(function (err) { avisar('No se pudo cargar la lista: ' + err.message, 'error'); });
  });

  btnSubir.addEventListener('click', function () {
    if (!inputToken.value.trim()) { avisar('Introduce la clave de acceso.', 'error'); return; }
    if (!rutasElegidas.length) { avisar('Elige al menos un archivo.', 'error'); return; }

    btnSubir.disabled = true;
    avisar('Subiendo… (los vídeos grandes pueden tardar)');

    guardarConfig()
      .then(function () { return window.api.subir(rutasElegidas); })
      .then(function (res) {
        var texto = 'Subidos: ' + (res.subidos.length ? res.subidos.join(', ') : 'ninguno');
        if (res.rechazados && res.rechazados.length) {
          texto += '\nRechazados: ' + res.rechazados.map(function (x) { return x.nombre + ' (' + x.motivo + ')'; }).join(', ');
        }
        avisar(texto, res.subidos.length ? 'ok' : 'error');
        rutasElegidas = [];
        pintarSeleccion();
        cargarLista();
      })
      .catch(function (err) { avisar(err.message, 'error'); })
      .finally(function () { btnSubir.disabled = false; });
  });

  // ═════════════════════ CONCIERTOS ═════════════════════

  function textoEvento(ev) {
    var partes = [ev.fecha, ev.titulo, ev.lugar];
    if (ev.hora) partes.push(ev.hora + ' h');
    if (ev.tipo) partes.push('[' + ev.tipo + ']');
    return partes.join(' · ');
  }

  function pintarAgenda(elemento, eventos, seccion) {
    if (!eventos.length) {
      elemento.innerHTML = '<li class="vacio">No hay conciertos en esta lista.</li>';
      return;
    }
    elemento.innerHTML = '';
    eventos.forEach(function (ev, indice) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.textContent = textoEvento(ev);
      li.appendChild(span);
      var btn = document.createElement('button');
      btn.textContent = 'Borrar';
      btn.className = 'peligro';
      btn.addEventListener('click', function () { borrarConcierto(seccion, indice, ev.titulo); });
      li.appendChild(btn);
      elemento.appendChild(li);
    });
  }

  function cargarAgenda() {
    window.api.agendaListar()
      .then(function (datos) {
        pintarAgenda(document.getElementById('listaProximos'), datos.proximos || [], 'proximos');
        pintarAgenda(document.getElementById('listaDestacados'), datos.destacados || [], 'destacados');
      })
      .catch(function (err) {
        avisarConcierto('No se pudo cargar la agenda: ' + err.message, 'error');
      });
  }

  function borrarConcierto(seccion, indice, titulo) {
    window.api.confirmar('¿Borrar el concierto «' + titulo + '» de la agenda?').then(function (ok) {
      if (!ok) return;
      window.api.agendaBorrar(seccion, indice)
        .then(function () {
          avisarConcierto('Concierto borrado.', 'ok');
          cargarAgenda();
        })
        .catch(function (err) { avisarConcierto(err.message, 'error'); });
    });
  }

  btnActualizarAgenda.addEventListener('click', function () {
    avisarConcierto('Actualizando…');
    window.api.agendaListar()
      .then(function () { avisarConcierto(''); cargarAgenda(); })
      .catch(function (err) { avisarConcierto('No se pudo cargar la agenda: ' + err.message, 'error'); });
  });

  btnAnadirConcierto.addEventListener('click', function () {
    var datos = {
      seccion: document.getElementById('cSeccion').value,
      fecha: document.getElementById('cFecha').value,
      hora: document.getElementById('cHora').value,
      titulo: document.getElementById('cTitulo').value.trim(),
      lugar: document.getElementById('cLugar').value.trim(),
      tipo: document.getElementById('cTipo').value.trim(),
      descripcion: document.getElementById('cDescripcion').value.trim(),
      destacado: document.getElementById('cDestacado').checked
    };

    // Los mismos campos obligatorios que en el Excel/JSON original
    if (!datos.fecha) { avisarConcierto('La fecha es obligatoria.', 'error'); return; }
    if (!datos.titulo) { avisarConcierto('El título es obligatorio.', 'error'); return; }
    if (!datos.lugar) { avisarConcierto('El lugar es obligatorio.', 'error'); return; }
    if (!datos.tipo) { avisarConcierto('El tipo es obligatorio.', 'error'); return; }
    if (!inputToken.value.trim()) { avisarConcierto('Introduce la clave de acceso arriba.', 'error'); return; }

    btnAnadirConcierto.disabled = true;
    avisarConcierto('Guardando…');

    guardarConfig()
      .then(function () { return window.api.agendaAnadir(datos); })
      .then(function (res) {
        avisarConcierto('Añadido «' + res.anadido.titulo + '» (' + res.anadido.fecha + ').', 'ok');
        document.getElementById('cTitulo').value = '';
        document.getElementById('cDescripcion').value = '';
        document.getElementById('cDestacado').checked = false;
        cargarAgenda();
      })
      .catch(function (err) { avisarConcierto(err.message, 'error'); })
      .finally(function () { btnAnadirConcierto.disabled = false; });
  });

  // ── Al arrancar: cargar configuración guardada y, si hay URL, las listas ──
  window.api.leerConfig().then(function (cfg) {
    inputUrl.value = cfg.url;
    inputToken.value = cfg.token;
    if (cfg.url) {
      cargarLista();
      cargarAgenda();
    }
    console.log('[Saudade Medios] interfaz lista');
  });
})();

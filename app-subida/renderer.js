/* ═══════════════════════════════════════════════════════════════════
   renderer.js — Saudade Medios (interfaz)
   Va en archivo externo porque la CSP del index.html (default-src
   'self') bloquea los scripts inline. Habla con el proceso principal
   a través de window.api (ver preload.js).
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var inputUrl = document.getElementById('url');
  var inputToken = document.getElementById('token');
  var btnGuardar = document.getElementById('btnGuardar');
  var btnElegir = document.getElementById('btnElegir');
  var btnSubir = document.getElementById('btnSubir');
  var btnActualizar = document.getElementById('btnActualizar');
  var seleccion = document.getElementById('seleccion');
  var mensaje = document.getElementById('mensaje');

  var rutasElegidas = [];

  function avisar(texto, clase) {
    mensaje.textContent = texto;
    mensaje.className = clase || '';
  }

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
    window.api.guardarConfig({ url: inputUrl.value.trim(), token: inputToken.value })
      .then(function () {
        avisar('Configuración guardada.', 'ok');
        cargarLista();
      })
      .catch(function (err) { avisar(err.message, 'error'); });
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
    if (!inputToken.value) { avisar('Introduce la clave de acceso.', 'error'); return; }
    if (!rutasElegidas.length) { avisar('Elige al menos un archivo.', 'error'); return; }

    btnSubir.disabled = true;
    avisar('Subiendo… (los vídeos grandes pueden tardar)');

    window.api.guardarConfig({ url: inputUrl.value.trim(), token: inputToken.value })
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

  // Al arrancar: cargar configuración guardada y, si hay URL, la lista
  window.api.leerConfig().then(function (cfg) {
    inputUrl.value = cfg.url;
    inputToken.value = cfg.token;
    if (cfg.url) cargarLista();
    console.log('[Saudade Medios] interfaz lista');
  });
})();

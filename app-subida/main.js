/* ═══════════════════════════════════════════════════════════════════
   main.js — Saudade Medios (proceso principal de Electron)

   Toda la red se hace aquí (no en el renderer) para evitar problemas
   de CORS: la app habla con las Pages Functions de la web
   (/api/carrusel y /api/subir) igual que lo hace subir.html.

   La configuración (URL de la web + clave UPLOAD_TOKEN) se guarda en
   config.json dentro de la carpeta de datos de usuario de la app.
   ═══════════════════════════════════════════════════════════════════ */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Configuración persistente ──────────────────────────────────────────────
function rutaConfig() {
  return path.join(app.getPath('userData'), 'config.json');
}

function leerConfig() {
  try {
    const datos = JSON.parse(fs.readFileSync(rutaConfig(), 'utf8'));
    return { url: datos.url || '', token: datos.token || '' };
  } catch (e) {
    return { url: '', token: '' };
  }
}

function guardarConfig(cfg) {
  fs.writeFileSync(rutaConfig(), JSON.stringify({ url: cfg.url || '', token: cfg.token || '' }));
}

// Quita barras finales para poder concatenar rutas con seguridad
function baseUrl() {
  const cfg = leerConfig();
  if (!cfg.url) throw new Error('Configura primero la URL de la web (p. ej. https://tu-proyecto.pages.dev)');
  return cfg.url.replace(/\/+$/, '');
}

async function comoJson(r) {
  let datos;
  try { datos = await r.json(); } catch (e) { datos = {}; }
  if (!r.ok) throw new Error(datos.error || 'Error HTTP ' + r.status);
  return datos;
}

// ── Canales IPC que usa la interfaz (via preload.js) ───────────────────────
ipcMain.handle('config:leer', () => leerConfig());

ipcMain.handle('config:guardar', (evento, cfg) => {
  guardarConfig(cfg);
  return leerConfig();
});

ipcMain.handle('medios:listar', async () => {
  const r = await fetch(baseUrl() + '/api/carrusel?_=' + Date.now());
  return comoJson(r);
});

ipcMain.handle('medios:elegir', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Elegir imágenes y vídeos',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Imágenes y vídeos', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'avif', 'mp4', 'webm', 'mov', 'm4v'] },
      { name: 'Imágenes', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'avif'] },
      { name: 'Vídeos', extensions: ['mp4', 'webm', 'mov', 'm4v'] }
    ]
  });
  return res.canceled ? [] : res.filePaths;
});

ipcMain.handle('medios:subir', async (evento, rutas) => {
  const cfg = leerConfig();
  const form = new FormData();
  for (const ruta of rutas) {
    const datos = fs.readFileSync(ruta);
    form.append('archivos', new Blob([datos]), path.basename(ruta));
  }
  const r = await fetch(baseUrl() + '/api/subir', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + cfg.token },
    body: form
  });
  return comoJson(r);
});

ipcMain.handle('medios:borrar', async (evento, clave) => {
  const cfg = leerConfig();
  const r = await fetch(baseUrl() + '/api/subir?clave=' + encodeURIComponent(clave), {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + cfg.token }
  });
  return comoJson(r);
});

// ── Ventana principal ──────────────────────────────────────────────────────
function crearVentana() {
  const ventana = new BrowserWindow({
    width: 820,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  ventana.loadFile('index.html');
}

app.whenReady().then(() => {
  crearVentana();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

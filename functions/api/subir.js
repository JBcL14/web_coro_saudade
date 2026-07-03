/* ═══════════════════════════════════════════════════════════════════
   functions/api/subir.js — Cloudflare Pages Function
   POST   /api/subir            → sube archivos al bucket R2 (multipart)
   DELETE /api/subir?clave=...  → borra un objeto del bucket

   Protegido con la variable secreta UPLOAD_TOKEN (Pages → Settings →
   Environment variables). Las peticiones deben llevar la cabecera:
     Authorization: Bearer <UPLOAD_TOKEN>

   Las imágenes se guardan como  images/<nombre>
   y los vídeos como            videos/<nombre>
   según la extensión del archivo.
   ═══════════════════════════════════════════════════════════════════ */

const EXT_IMAGEN = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'avif'];
const EXT_VIDEO  = ['mp4', 'webm', 'mov', 'm4v'];

const TIPOS = {
  webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4'
};

function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function autorizado(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return Boolean(env.UPLOAD_TOKEN) && auth === 'Bearer ' + env.UPLOAD_TOKEN;
}

// Nombre de archivo seguro: sin acentos, espacios → guiones, minúsculas
function limpiarNombre(nombre) {
  return nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!autorizado(request, env)) return json({ error: 'No autorizado' }, 401);
  if (!env.MEDIA) return json({ error: 'Falta el binding R2 "MEDIA" en la configuración de Pages' }, 500);

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ error: 'Se esperaba un formulario multipart con archivos' }, 400);
  }

  const archivos = form.getAll('archivos').filter(a => typeof a !== 'string');
  if (archivos.length === 0) return json({ error: 'No se ha enviado ningún archivo' }, 400);

  const subidos = [];
  const rechazados = [];

  for (const archivo of archivos) {
    const nombre = limpiarNombre(archivo.name);
    const ext = nombre.includes('.') ? nombre.split('.').pop() : '';

    let carpeta = null;
    if (EXT_IMAGEN.includes(ext)) carpeta = 'images/';
    else if (EXT_VIDEO.includes(ext)) carpeta = 'videos/';

    if (!carpeta || !nombre.replace(/\.\w+$/, '')) {
      rechazados.push({ nombre: archivo.name, motivo: 'Extensión no admitida (' + [...EXT_IMAGEN, ...EXT_VIDEO].join(', ') + ')' });
      continue;
    }

    const clave = carpeta + nombre;
    await env.MEDIA.put(clave, archivo.stream(), {
      httpMetadata: { contentType: archivo.type || TIPOS[ext] || 'application/octet-stream' }
    });
    subidos.push(clave);
  }

  return json({ subidos, rechazados });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!autorizado(request, env)) return json({ error: 'No autorizado' }, 401);
  if (!env.MEDIA) return json({ error: 'Falta el binding R2 "MEDIA" en la configuración de Pages' }, 500);

  const clave = new URL(request.url).searchParams.get('clave') || '';
  if (!/^(images|videos)\/[^/]+$/.test(clave)) {
    return json({ error: 'Clave no válida; debe ser images/<archivo> o videos/<archivo>' }, 400);
  }

  await env.MEDIA.delete(clave);
  return json({ borrado: clave });
}

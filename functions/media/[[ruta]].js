/* ═══════════════════════════════════════════════════════════════════
   functions/media/[[ruta]].js — Cloudflare Pages Function
   GET /media/images/<archivo>   →  objeto R2  images/<archivo>
   GET /media/videos/<archivo>   →  objeto R2  videos/<archivo>

   Sirve los archivos del bucket R2 (binding "MEDIA"). Soporta
   peticiones Range (necesario para que los vídeos se puedan buscar).
   Si el archivo no está en R2, cae a los estáticos del repo
   (assets/images/carrusel/ y assets/videos/carrusel/).
   ═══════════════════════════════════════════════════════════════════ */

const TIPOS = {
  webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4'
};

// Interpreta una cabecera "Range: bytes=a-b" (un solo rango)
function parseRange(cabecera, tamano) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(cabecera || '');
  if (!m || (!m[1] && !m[2])) return null;
  let offset, length;
  if (m[1]) {
    offset = parseInt(m[1], 10);
    const fin = m[2] ? Math.min(parseInt(m[2], 10), tamano - 1) : tamano - 1;
    length = fin - offset + 1;
  } else {
    length = Math.min(parseInt(m[2], 10), tamano);
    offset = tamano - length;
  }
  if (offset < 0 || offset >= tamano || length <= 0) return null;
  return { offset, length };
}

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const ruta = (params.ruta || []).join('/'); // p. ej. "images/foto.webp"

  if (!/^(images|videos)\/[^/]+$/.test(ruta)) {
    return new Response('No encontrado', { status: 404 });
  }

  if (env.MEDIA) {
    const rangoCabecera = request.headers.get('Range');
    const ext = ruta.split('.').pop().toLowerCase();

    if (rangoCabecera) {
      const cabeza = await env.MEDIA.head(ruta);
      if (cabeza) {
        const rango = parseRange(rangoCabecera, cabeza.size);
        if (!rango) {
          return new Response('Rango no satisfacible', {
            status: 416,
            headers: { 'Content-Range': 'bytes */' + cabeza.size }
          });
        }
        const objeto = await env.MEDIA.get(ruta, { range: rango });
        return new Response(objeto.body, {
          status: 206,
          headers: {
            'Content-Type': objeto.httpMetadata?.contentType || TIPOS[ext] || 'application/octet-stream',
            'Content-Length': String(rango.length),
            'Content-Range': 'bytes ' + rango.offset + '-' + (rango.offset + rango.length - 1) + '/' + cabeza.size,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'ETag': objeto.httpEtag
          }
        });
      }
    } else {
      const objeto = await env.MEDIA.get(ruta);
      if (objeto) {
        return new Response(objeto.body, {
          headers: {
            'Content-Type': objeto.httpMetadata?.contentType || TIPOS[ext] || 'application/octet-stream',
            'Content-Length': String(objeto.size),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'ETag': objeto.httpEtag
          }
        });
      }
    }
  }

  // Respaldo: archivo estático del repo (los que ya están en git)
  const estatica = ruta.startsWith('images/')
    ? '/assets/images/carrusel/' + ruta.slice('images/'.length)
    : '/assets/videos/carrusel/' + ruta.slice('videos/'.length);
  return env.ASSETS.fetch(new Request(new URL(estatica, request.url), request));
}

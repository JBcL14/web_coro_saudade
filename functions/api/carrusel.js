/* ═══════════════════════════════════════════════════════════════════
   functions/api/carrusel.js — Cloudflare Pages Function
   GET /api/carrusel

   Devuelve { images: [...], videos: [...] } con los nombres de archivo
   que hay en el bucket R2 (binding "MEDIA"):
     - imágenes bajo la clave  images/<nombre>
     - vídeos   bajo la clave  videos/<nombre>

   Si el bucket está vacío (o no hay binding), usa como respaldo el
   assets/carrusel.json estático del repo, para que la web siga
   funcionando exactamente igual que ahora hasta que subas medios a R2.
   ═══════════════════════════════════════════════════════════════════ */

export async function onRequestGet(context) {
  const { env, request } = context;
  // "origen" indica de dónde sale cada lista: 'r2' (borrable desde la app
  // de subida) o 'estatico' (archivos del repo git, no borrables desde R2).
  const datos = { images: [], videos: [], origen: { images: 'r2', videos: 'r2' } };

  if (env.MEDIA) {
    try {
      const [imgs, vids] = await Promise.all([
        env.MEDIA.list({ prefix: 'images/', limit: 1000 }),
        env.MEDIA.list({ prefix: 'videos/', limit: 1000 })
      ]);
      datos.images = imgs.objects.map(o => o.key.slice('images/'.length)).filter(Boolean);
      datos.videos = vids.objects.map(o => o.key.slice('videos/'.length)).filter(Boolean);
    } catch (e) {
      // Si R2 falla se sigue con el respaldo estático
    }
  }

  // Respaldo: el JSON estático del repo rellena lo que falte
  if (datos.images.length === 0 || datos.videos.length === 0) {
    try {
      const r = await env.ASSETS.fetch(new URL('/assets/carrusel.json', request.url));
      if (r.ok) {
        const estatico = await r.json();
        if (datos.images.length === 0 && Array.isArray(estatico.images)) {
          datos.images = estatico.images;
          datos.origen.images = 'estatico';
        }
        if (datos.videos.length === 0 && Array.isArray(estatico.videos)) {
          datos.videos = estatico.videos;
          datos.origen.videos = 'estatico';
        }
      }
    } catch (e) { /* sin respaldo disponible */ }
  }

  return new Response(JSON.stringify(datos), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

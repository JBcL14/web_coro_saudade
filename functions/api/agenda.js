/* ═══════════════════════════════════════════════════════════════════
   functions/api/agenda.js — Cloudflare Pages Function
   GET    /api/agenda   → devuelve la agenda (JSON con proximos y
                          destacados). Sale del objeto R2
                          datos/agenda.json; si no existe, del
                          assets/agenda.json estático del repo.
   POST   /api/agenda   → añade un concierto (protegido con
                          UPLOAD_TOKEN). Cuerpo JSON:
                          { seccion: 'proximos'|'destacados',
                            fecha: 'AAAA-MM-DD', titulo, lugar,
                            hora?, descripcion?, tipo, destacado? }
   DELETE /api/agenda?seccion=...&indice=N → borra un concierto.

   La primera escritura copia la agenda actual (estática) a R2 y a
   partir de ahí el bucket es la fuente de verdad, igual que con los
   carruseles. Los campos derivados (dia, mes, mesLargo, anio) se
   calculan aquí a partir de la fecha.
   ═══════════════════════════════════════════════════════════════════ */

const CLAVE_R2 = 'datos/agenda.json';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function autorizado(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return Boolean(env.UPLOAD_TOKEN) && auth === 'Bearer ' + env.UPLOAD_TOKEN;
}

// Carga la agenda: primero R2, si no existe el estático del repo
async function cargarAgenda(env, request) {
  if (env.MEDIA) {
    const objeto = await env.MEDIA.get(CLAVE_R2);
    if (objeto) {
      return { agenda: await objeto.json(), origen: 'r2' };
    }
  }
  try {
    const r = await env.ASSETS.fetch(new URL('/assets/agenda.json', request.url));
    if (r.ok) return { agenda: await r.json(), origen: 'estatico' };
  } catch (e) { /* sin respaldo */ }
  return { agenda: { anio: new Date().getFullYear(), proximos: [], destacados: [] }, origen: 'vacio' };
}

async function guardarAgenda(env, agenda) {
  agenda.generado = new Date().toISOString();
  await env.MEDIA.put(CLAVE_R2, JSON.stringify(agenda, null, 2), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const { agenda, origen } = await cargarAgenda(env, request);
  agenda.origen = origen;
  return json(agenda);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!autorizado(request, env)) return json({ error: 'No autorizado' }, 401);
  if (!env.MEDIA) return json({ error: 'Falta el binding R2 "MEDIA" en la configuración de Pages' }, 500);

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ error: 'Se esperaba JSON con los datos del concierto' }, 400);
  }

  const seccion = cuerpo.seccion === 'destacados' ? 'destacados' : 'proximos';
  const fecha = String(cuerpo.fecha || '').trim();
  const titulo = String(cuerpo.titulo || '').trim();
  const lugar = String(cuerpo.lugar || '').trim();
  const tipo = String(cuerpo.tipo || '').trim();

  // Campos obligatorios (los mismos que en el Excel/JSON original)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return json({ error: 'La fecha es obligatoria y debe tener formato AAAA-MM-DD' }, 400);
  if (!titulo) return json({ error: 'El título es obligatorio' }, 400);
  if (!lugar) return json({ error: 'El lugar es obligatorio' }, 400);
  if (!tipo) return json({ error: 'El tipo es obligatorio (p. ej. Concierto, Colaboración, Destacado)' }, 400);

  const anio = parseInt(m[1], 10);
  const mesIdx = parseInt(m[2], 10) - 1;
  const dia = parseInt(m[3], 10);
  if (mesIdx < 0 || mesIdx > 11 || dia < 1 || dia > 31) {
    return json({ error: 'La fecha no es válida' }, 400);
  }

  const evento = {
    fecha: fecha,
    dia: dia,
    mes: MESES_CORTOS[mesIdx],
    mesLargo: MESES_LARGOS[mesIdx],
    anio: anio,
    titulo: titulo,
    lugar: lugar,
    hora: String(cuerpo.hora || '').trim(),
    descripcion: String(cuerpo.descripcion || '').trim(),
    tipo: tipo,
    destacado: seccion === 'destacados' ? true : Boolean(cuerpo.destacado)
  };

  const { agenda } = await cargarAgenda(env, request);
  if (!Array.isArray(agenda.proximos)) agenda.proximos = [];
  if (!Array.isArray(agenda.destacados)) agenda.destacados = [];

  agenda[seccion].push(evento);
  // Próximos: del más cercano al más lejano. Destacados: del más reciente al más antiguo.
  agenda.proximos.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
  agenda.destacados.sort(function (a, b) { return a.fecha > b.fecha ? -1 : 1; });

  await guardarAgenda(env, agenda);
  return json({ anadido: evento, seccion: seccion });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!autorizado(request, env)) return json({ error: 'No autorizado' }, 401);
  if (!env.MEDIA) return json({ error: 'Falta el binding R2 "MEDIA" en la configuración de Pages' }, 500);

  const params = new URL(request.url).searchParams;
  const seccion = params.get('seccion') === 'destacados' ? 'destacados' : 'proximos';
  const indice = parseInt(params.get('indice') || '', 10);

  const { agenda } = await cargarAgenda(env, request);
  const lista = Array.isArray(agenda[seccion]) ? agenda[seccion] : [];

  if (isNaN(indice) || indice < 0 || indice >= lista.length) {
    return json({ error: 'Índice no válido' }, 400);
  }

  const eliminado = lista.splice(indice, 1)[0];
  await guardarAgenda(env, agenda);
  return json({ borrado: eliminado, seccion: seccion });
}

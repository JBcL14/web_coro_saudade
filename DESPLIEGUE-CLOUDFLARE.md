# Despliegue en Cloudflare Pages + R2

Guía para publicar la web y conectar el bucket R2 donde se suben las
imágenes y vídeos de los carruseles.

## Cómo funciona

- La web es estática (raíz del repo). Las **Pages Functions** de la
  carpeta `functions/` añaden tres rutas:
  - `GET /api/carrusel` — lista las imágenes (`images/…`) y vídeos
    (`videos/…`) del bucket R2 y devuelve el JSON que lee
    `carrusel-loader.js`. Si el bucket está vacío, usa
    `assets/carrusel.json` como respaldo.
  - `GET /media/images/<archivo>` y `GET /media/videos/<archivo>` —
    sirven los archivos desde R2 (con soporte de Range para vídeos).
    Si el archivo no está en R2, sirven el estático del repo.
  - `POST/DELETE /api/subir` — sube o borra archivos del bucket.
    Protegido con la variable secreta `UPLOAD_TOKEN`.
- `subir.html` es la aplicación de subida: pide la clave
  (`UPLOAD_TOKEN`), sube archivos y permite borrarlos.
- Mientras no subas nada a R2, la web se ve exactamente igual que
  ahora (usa los archivos del repo). En cuanto haya archivos en R2,
  los carruseles muestran los del bucket.

## Pasos

1. **Crear el bucket R2**
   - Cloudflare Dashboard → R2 → *Create bucket* → nombre:
     `coro-saudade-media` (el mismo que en `wrangler.toml`).
   - No hace falta hacerlo público: los archivos se sirven a través
     de `/media/` con la Function.

2. **Crear el proyecto de Pages**
   - Dashboard → Workers & Pages → *Create* → *Pages* →
     *Connect to Git* → elige este repo y la rama que quieras
     desplegar (p. ej. `main` tras hacer merge de esta rama).
   - Build command: *(vacío)* · Build output directory: `/` (raíz).
   - Al detectar `wrangler.toml`, Pages aplica el binding R2 `MEDIA`
     automáticamente. Si no, añádelo a mano en
     *Settings → Bindings → R2 bucket*: nombre de variable `MEDIA`,
     bucket `coro-saudade-media`.

3. **Definir la clave de subida**
   - *Settings → Variables and Secrets* → *Add* → tipo **Secret**:
     - Nombre: `UPLOAD_TOKEN`
     - Valor: una clave larga que solo conozcáis vosotros.
   - Redespliega el proyecto para que se aplique.

4. **Subir imágenes y vídeos**

   Hay dos formas equivalentes:

   **a) Aplicación de escritorio** (carpeta `app-subida/`): instala
   `Saudade Medios Setup <versión>.exe`, introduce la URL de la web y
   la clave `UPLOAD_TOKEN`, y sube/borra archivos desde el programa.
   Ver `app-subida/README.md` para compilar el instalador.

   **b) Página web**: abre `https://<tu-proyecto>.pages.dev/subir.html`.
   - Introduce la clave, selecciona los archivos y pulsa *Subir*.
   - Extensiones admitidas — imágenes: webp, jpg, jpeg, png, gif,
     avif · vídeos: mp4, webm, mov, m4v.
   - Límite: ~95 MB por archivo (límite de Cloudflare por petición).
   - Desde la misma página se pueden borrar archivos del bucket.

## Notas

- El orden de los carruseles es alfabético por nombre de archivo
  (usa prefijos tipo `01-`, `02-`… si quieres controlar el orden).
- Los nombres se normalizan al subir: sin acentos ni espacios y en
  minúsculas.
- El flujo antiguo de GitHub (carpeta `assets/images/staging/` +
  workflow `convertir-webp.yml`) sigue funcionando como respaldo,
  pero con R2 ya no es necesario.

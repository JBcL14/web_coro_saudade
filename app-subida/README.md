# Saudade Medios — aplicación de escritorio

Aplicación de escritorio (Electron) para subir imágenes y vídeos a los
carruseles de la web del Coro Saudade. Hace lo mismo que `subir.html`,
pero como programa instalable en Windows.

## Uso

1. Instala la app con el instalador `Saudade Medios Setup <versión>.exe`.
2. Ábrela y rellena:
   - **Dirección de la web**: la URL del proyecto de Cloudflare Pages
     (p. ej. `https://tu-proyecto.pages.dev` o el dominio propio).
   - **Clave de acceso**: el valor del secreto `UPLOAD_TOKEN`
     configurado en Cloudflare Pages.
3. Pulsa *Guardar configuración* (se recuerda entre sesiones).
4. *Elegir archivos…* → selecciona imágenes/vídeos → *Subir*.
   Aparecen automáticamente en los carruseles de la web.
5. Desde las listas puedes borrar archivos del bucket.

## Compilar el instalador

Requiere Node.js 18 o superior:

```
cd app-subida
npm install
npm run dist
```

El instalador queda en `app-subida/dist/Saudade Medios Setup <versión>.exe`.

Para probar la app sin instalar: `npm start`.

Nota: el instalador no está firmado digitalmente, así que Windows
SmartScreen puede avisar la primera vez ("Más información" → "Ejecutar
de todas formas").

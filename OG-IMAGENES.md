# Imágenes para compartir (Open Graph)

Cada tema y cada documento tienen su **propia imagen** de vista previa (la que
sale al pegar el enlace en Telegram/WhatsApp). Se generan "fotografiando" una
página del propio sitio, así que **lo que ves editando es exactamente la imagen
final** — sin límites raros de CSS y con la misma tipografía del sitio.

## Cómo tocar el diseño a tu gusto

1. Arranca el sitio en local:
   ```
   pnpm dev
   ```
2. Abre la vista previa en el navegador:
   - Un tema:      `http://localhost:5173/og-preview?type=tema&slug=derechos_y_obligaciones`
   - Un documento: `http://localhost:5173/og-preview?type=documento&slug=docs-estatutos-estatutos-la-borda`
   - Sin `slug` sale un ejemplo por defecto.
3. Edita el diseño en **`src/lib/components/OgCard.svelte`**. Al principio del
   `<style>` hay un bloque de "Ajustes rápidos" (colores, fuente, tamaños). Es
   CSS normal y recarga en vivo.

## Cómo hornear los PNG

Una sola vez, instala el navegador headless:
```
pnpm add -D playwright
pnpm exec playwright install chromium
```

Cada vez que cambies la plantilla o añadas temas/documentos:
```
pnpm dev            # en una terminal
pnpm og:gen         # en otra
```
Esto escribe los PNG (1200×630) en `static/og/temas/` y `static/og/documentos/`.

> Genera en tu Mac a propósito: Chromium usa la fuente de sistema *Iowan Old
> Style*, la misma del sitio, así que la imagen sale idéntica a la web.

## Publicar

Los PNG son **assets estáticos que se commitean** (el build solo los copia; no
se ejecuta Playwright en Netlify). El flujo completo:
```
pnpm og:gen                 # regenera imágenes
git add static/og && git commit -m "Regenera imágenes OG"
pnpm run deploy
```

Al probar la vista previa social, usa un validador que refresque caché
(p. ej. opengraph.xyz o el de cada red), porque Telegram/WhatsApp cachean el OG
con fuerza.

## Notas

- El `<head>` (título, descripción, `og:image`) lo emite `src/routes/+layout.svelte`
  a partir del `seo` de cada página; las rutas de imagen se fijan en `src/lib/seo.ts`
  (`topicSeo`, `documentSeo`).
- La página `/og-preview` y el endpoint `/og-preview/data.json` son herramientas
  de trabajo (`prerender = false`), no páginas públicas.
- Si añades un tema o documento nuevo y **no** ejecutas `pnpm og:gen`, esa página
  usará la imagen por defecto (`static/thumbnail-og.jpg`) hasta que regeneres.

# El Buen Vivir Commons

Atlas estático de gobernanza cooperativa construido con SvelteKit.

## Ingesta de documentos

La Fase 6 detecta documentos fuente en estas carpetas:

- `docs/leyes`
- `docs/estatutos`
- `docs/rri`
- `docs/guias`
- `docs/otros`

Ejecuta la ingesta con:

```sh
npm run ingest
```

El script actualiza `src/content/documents/documents.json` con documentos `pdf`, `txt`, `md` y `docx`. Infiere `slug`, `title`, `fileName`, `sourcePath`, `type`, `projectName`, `jurisdiction`, `year`, `language`, `tags`, `contentHash`, `ingestionStatus` y `needsReview`.

Los metadatos ya existentes se preservan para no sobrescribir edición manual. Solo se recalculan campos de sistema de la ingesta como `contentHash`, `ingestionStatus`, `needsReview` y `lastProcessedAt`.

Esta fase no modifica `src/content/topics`.

## Extracción de texto

La Fase 7 extrae texto cuando es posible y nunca forma parte del build estático. Ejecuta la extracción manualmente con:

```sh
npm run extract
```

El script lee `src/content/documents/documents.json` y escribe los textos en `src/content/generated/extracted/{documentSlug}.txt`. También genera `src/content/generated/extraction-report.json` y actualiza `extractionStatus`, `extractionError` si aplica, y `lastProcessedAt` en `documents.json`.

Formatos soportados:

- `.txt` directo
- `.md` directo
- `.pdf` mediante `pdf-parse` cuando es posible

Si junto a un PDF existe un `.txt` con el mismo `slug` del documento o con el mismo nombre base del archivo, se usa ese `.txt` como override. No se hace OCR y los fallos de PDF se registran por documento sin romper la ejecución.

El script se salta automáticamente si se ejecuta con `NETLIFY=true`, para evitar extracción durante builds de Netlify.

## Validación

```sh
npm run validate:content
npm run check
npm run build
```

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

## División en secciones

La Fase 8 convierte los textos extraídos en secciones o artículos citables sin tocar `src/content/topics` ni `src/content/documents/documents.json`.

```sh
npm run split
```

El script lee `src/content/generated/extracted/*.txt` y genera `src/content/generated/sections/{documentSlug}.sections.json`. Cada sección contiene `id`, `documentSlug`, `heading`, `text`, `order` y `possibleTopics: []`.

Los encabezados se detectan con patrones como `Artículo 1`, `Artículo 1.`, `Art. 1`, `Article 1`, `CAPÍTULO`, `CAPITULO`, `TÍTULO`, `Sección`, `Capítol` y `Article`. Si no se detectan encabezados, se genera una sección única de fallback.

También se genera `src/content/generated/split-report.json` con número de secciones, longitud media y warnings para documentos con pocas secciones o secciones demasiado largas.

## Índice temático heurístico

La Fase 9 sugiere referencias automáticas por tema sin modificar contenido curado.

```sh
npm run build:index
```

El script lee `taxonomy/topics.json`, `src/content/generated/sections/*.sections.json` y `src/content/documents/documents.json`. Usa `keywords` y `aliases` de la taxonomía con pesos simples y umbral mínimo para generar `src/content/generated/topic-references.json`.

Cada referencia automática incluye `topicSlug`, `documentSlug`, `projectName` si existe, `documentTitle`, `documentType`, `articleOrSection`, `excerpt`, `sourcePath`, `tags`, `confidence` y `reviewStatus: auto`.

No se generan summaries jurídicos ni `suggestedClause`. La UI muestra estas referencias separadas de las referencias curadas con el estado `Referencia automática sin revisar`.

## Pipeline completo

La Fase 10 unifica las etapas automáticas en un flujo manual, robusto y auditable:

```sh
npm run content:pipeline
```

El pipeline ejecuta en orden `ingest`, `extract`, `split`, `build:index` y `validate:content`. Si una etapa emite warnings, el flujo continúa. Si una etapa falla de forma crítica, el pipeline se detiene, escribe `src/content/generated/pipeline-report.json` y devuelve error.

El reporte incluye fecha, duración, etapas ejecutadas, éxito/error por etapa, warnings principales y resumen de documentos, secciones y referencias.

Este pipeline no se ejecuta durante `npm run build` y no modifica `src/content/topics`.

## Validación

```sh
npm run validate:content
npm run check
npm run build
```

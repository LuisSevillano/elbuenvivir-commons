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

Esta fase no extrae texto de PDFs ni modifica `src/content/topics`.

## Validación

```sh
npm run validate:content
npm run check
npm run build
```

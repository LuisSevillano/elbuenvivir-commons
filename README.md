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
pnpm ingest
```

El script actualiza `src/content/documents/documents.json` con documentos `pdf`, `txt`, `md` y `docx`. Infiere `slug`, `title`, `fileName`, `sourcePath`, `type`, `projectName`, `jurisdiction`, `year`, `language`, `tags`, `contentHash`, `ingestionStatus` y `needsReview`.

Los metadatos ya existentes se preservan para no sobrescribir edición manual. Solo se recalculan campos de sistema de la ingesta como `contentHash`, `ingestionStatus`, `needsReview` y `lastProcessedAt`.

Esta fase no modifica `src/content/topics`.

## Extracción de texto

La Fase 7 extrae texto cuando es posible y nunca forma parte del build estático. Ejecuta la extracción manualmente con:

```sh
pnpm extract
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
pnpm split
```

El script lee `src/content/generated/extracted/*.txt` y genera `src/content/generated/sections/{documentSlug}.sections.json`. Cada sección contiene `id`, `documentSlug`, `heading`, `text`, `order` y `possibleTopics: []`.

Los encabezados se detectan con patrones como `Artículo 1`, `Artículo 1.`, `Art. 1`, `Article 1`, `CAPÍTULO`, `CAPITULO`, `TÍTULO`, `Sección`, `Capítol` y `Article`. Si no se detectan encabezados, se genera una sección única de fallback.

También se genera `src/content/generated/split-report.json` con número de secciones, longitud media y warnings para documentos con pocas secciones o secciones demasiado largas.

## Índice temático heurístico

La Fase 9 sugiere referencias automáticas por tema sin modificar contenido curado.

```sh
pnpm build:index
```

El script lee `taxonomy/topics.json`, `src/content/generated/sections/*.sections.json` y `src/content/documents/documents.json`. Usa `keywords` y `aliases` de la taxonomía con pesos simples y umbral mínimo para generar `src/content/generated/topic-references.json`.

Cada referencia automática incluye `topicSlug`, `documentSlug`, `projectName` si existe, `documentTitle`, `documentType`, `articleOrSection`, `excerpt`, `sourcePath`, `tags`, `confidence` y `reviewStatus: auto`.

No se generan summaries jurídicos ni `suggestedClause`. La UI muestra estas referencias separadas de las referencias curadas con el estado `Referencia automática sin revisar`.

## Pipeline completo

La Fase 10 unifica las etapas automáticas en un flujo manual, robusto y auditable:

```sh
pnpm content:pipeline
```

El pipeline ejecuta en orden `ingest`, `extract`, `split`, `build:index` y `validate:content`. Si una etapa emite warnings, el flujo continúa. Si una etapa falla de forma crítica, el pipeline se detiene, escribe `src/content/generated/pipeline-report.json` y devuelve error.

El reporte incluye fecha, duración, etapas ejecutadas, éxito/error por etapa, warnings principales y resumen de documentos, secciones y referencias.

Este pipeline no se ejecuta durante `pnpm build` y no modifica `src/content/topics`.

## Síntesis sustantiva por tema

La Fase 19 mejora `pnpm generate:syntheses` para construir síntesis comparadas a partir del contenido real de los extractos, sin APIs externas ni IA. El script detecta conceptos sustantivos por familia temática y por temas principales como `baja_socio`, `aportaciones_obligatorias`, `uso_espacios_comunes`, `toma_decisiones` y `estatutos_vs_rri`.

```sh
pnpm generate:syntheses
```

La salida sigue escribiéndose en `src/content/generated/syntheses/{topicSlug}.generated.json`, pero el contenido evita frases de metadatos y prioriza observaciones prácticas: soluciones encontradas, diferencias entre enfoques, riesgos deducibles, ubicación razonable entre Estatutos/RRI y decisiones concretas para El Buen Vivir. Si no hay extractos claros, el script lo indica de forma prudente en lugar de rellenar con conclusiones genéricas.

La Fase 21 añade mejora selectiva para `desigualdad_aportaciones`, `disolucion`, `reservas_estancias_pernoctas` y `expulsion_socio`. Estos temas incorporan tratamientos específicos y pueden apoyarse en temas relacionados como evidencia indirecta, marcada expresamente en la síntesis para mantener trazabilidad sin inventar referencias directas.

## Auditoría de calidad de síntesis

La Fase 20 genera un informe de calidad editorial para detectar síntesis débiles, genéricas o poco útiles:

```sh
pnpm audit:syntheses
```

La salida se escribe en `src/content/generated/synthesis-quality-report.json` y `docs/reports/synthesis-quality-report.md`.

## Evidence-First Governance Intelligence

La Fase 27 transforma la herramienta desde generación automática de contenido hacia análisis fundamentado de evidencia documental. La prioridad es grounding, precisión y trazabilidad sobre cada afirmación.

```sh
pnpm build:evidence
```

El script analiza 6 temas prioritarios (`invitados`, `reservas_estancias_pernoctas`, `desigualdad_aportaciones`, `baja_socio`, `toma_decisiones`, `uso_espacios_comunes`) y clasifica cada claim en uno de estos tipos:

| Tipo | Significado | UI |
|------|-------------|-----|
| `explicit` | El concepto aparece de forma literal en encabezados y texto de secciones documentales. | Fondo verde. |
| `inferred` | El concepto se detecta por contexto, ventanas de palabras o coocurrencias, sin mención explícita directa. | Fondo amarillo. |
| `recommendation` | Afirmación editorial o de orientación práctica, no directamente extraída de las fuentes. | Fondo azul. |
| `weak_evidence` | Solo 1–2 referencias, puntuación baja o proyecto único. No debe presentarse como práctica establecida. | Fondo rojo. |
| `conflicting` | Enfoques incompatibles detectados entre distintos proyectos para una misma cuestión. | Fondo púrpura. |

### Principios del enfoque

- **No aparentar certeza**: cada afirmación importante se clasifica explícitamente.
- **Trazabilidad**: cada claim lleva sus referencias documentales de soporte.
- **Conflicting approaches**: se detectan activamente enfoques incompatibles entre proyectos (ej: invitados con uso libre vs autorización previa vs límites anuales vs prohibición en periodos).
- **Snippets ultra relevantes**: máximo 1–4 párrafos, centrados en la afirmación concreta.
- **Relevance scoring**: positivo por concepto explícito, heading relevante, coocurrencia contextual, densidad temática y proximidad entre conceptos; negativo por contaminación semántica y conceptos jurídicos ambiguos.
- **Separación clara**: lo detectado documentalmente, lo inferido y lo recomendado aparecen separados visual y estructuralmente.
- **Si no hay evidencia suficiente**: se declara como "Evidencia limitada" en lugar de rellenar con generalizaciones.

### Límites

- No usa IA externa, embeddings, RAG, chat ni APIs.
- No inventa acuerdos: si falta evidencia documental, el modelo lo indica como débil o ausente.
- La calidad depende de la extracción y división en secciones de los documentos fuente.
- Los enfoques contradictorios se detectan por agrupación de conceptos, no por análisis semántico profundo.
- 6 temas priorizados; el resto no dispone de capa de evidencia.

## Decision Intelligence

La Fase 24 añade una capa de modelos de decisión cooperativa. No sustituye al índice temático ni a las síntesis: construye una lectura más práctica a partir de secciones reales, preguntando qué problema organizativo aparece, qué modelos de solución pueden compararse y qué evidencia documental sostiene cada observación.

```sh
pnpm build:decision-models
```

El script escribe `src/content/generated/decision-models/{topicSlug}.json` y `src/content/generated/decision-models-report.json`. Los temas priorizados son `invitados`, `reservas_estancias_pernoctas`, `uso_espacios_comunes`, `desigualdad_aportaciones`, `baja_socio`, `toma_decisiones`, `convivencia` y `conflictos_y_mediacion`.

Cada modelo se organiza alrededor de `DecisionQuestion`: pregunta real, importancia práctica, enfoques detectados, tradeoffs, recomendaciones, proyectos relacionados, ubicación probable entre Estatutos/RRI y extractos trazables. Los `SolutionApproach` solo se muestran cuando hay extractos que activan los conceptos asociados.

La detección usa matching contextual, no simple presencia de keywords. Para conceptos ambiguos como `reserva`, exige proximidad con términos como estancia, habitación, calendario, invitados, noche, pernocta, espacio, uso o disponibilidad. También aplica exclusiones contextuales para evitar ruido como fondo de reserva, reserva legal, reserva contable o capital social. El sistema puntúa coocurrencias dentro de ventanas de palabras y descarta secciones que no alcanzan evidencia mínima.

La capa de evidencia (Fase 27) complementa los modelos de decisión clasificando cada claim por tipo de evidencia, pero no depende de ellos.

Límites importantes:

- No usa IA externa, embeddings ni APIs.
- No inventa acuerdos: si faltan extractos claros, el modelo lo declara como evidencia insuficiente.
- Los enfoques son patrones editoriales apoyados en evidencia, no asesoramiento jurídico definitivo.
- La calidad depende de la extracción, la división en secciones y la cobertura real de los documentos fuente.

## Validación

```sh
pnpm validate:content
pnpm check
pnpm build
```

## Deploy en Netlify

El proyecto incluye `netlify.toml` con `pnpm build` como comando de build y `build` como directorio publicado.

Deploy preview:

```sh
pnpm deploy:netlify
```

Deploy a producción:

```sh
pnpm deploy:netlify:prod
```

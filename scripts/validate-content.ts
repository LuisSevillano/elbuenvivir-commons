import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const root = process.cwd();
const topicDir = join(root, 'src/content/topics');
const documentsPath = join(root, 'src/content/documents/documents.json');
const generatedReferencesPath = join(root, 'src/content/generated/topic-references.json');
const generatedSectionsDir = join(root, 'src/content/generated/sections');
const splitReportPath = join(root, 'src/content/generated/split-report.json');
const taxonomyPath = join(root, 'taxonomy/topics.json');

const allowedCategories = new Set([
  'identidad_juridica',
  'socios',
  'economico',
  'gobernanza',
  'convivencia',
  'uso_espacios',
  'disciplina',
  'cuidados',
  'ciclo_vida',
  'legal',
  'otros'
]);
const allowedIngestionStatuses = new Set(['pending', 'ok', 'needs_review']);
const allowedExtractionStatuses = new Set(['not_started', 'ok', 'partial', 'failed', 'unsupported']);

const errors: string[] = [];
const warnings: string[] = [];

function readJson<T>(path: string): T | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    errors.push(`JSON inválido o no legible: ${relative(path)} (${String(error)})`);
    return undefined;
  }
}

function relative(path: string): string {
  return path.replace(`${root}/`, '');
}

function isRecord(value: JsonValue | unknown): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, JsonValue>, field: string, context: string): string | undefined {
  const value = record[field];

  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${context}: falta campo string obligatorio "${field}"`);
    return undefined;
  }

  return value;
}

function arrayField(record: Record<string, JsonValue>, field: string, context: string): JsonValue[] {
  const value = record[field];

  if (!Array.isArray(value)) {
    errors.push(`${context}: falta array obligatorio "${field}"`);
    return [];
  }

  return value;
}

function validateUnique(slugs: string[], context: string): void {
  const seen = new Set<string>();

  for (const slug of slugs) {
    if (seen.has(slug)) {
      errors.push(`${context}: slug duplicado "${slug}"`);
    }
    seen.add(slug);
  }
}

function validateExcerptLength(record: Record<string, JsonValue>, context: string): void {
  const excerpt = record.excerpt;

  if (typeof excerpt === 'string' && excerpt.length > 1200) {
    warnings.push(`${context}: excerpt demasiado largo (${excerpt.length} caracteres)`);
  }
}

const documents = readJson<JsonValue[]>(documentsPath) ?? [];
const documentSlugs = new Set<string>();

if (!Array.isArray(documents)) {
  errors.push('src/content/documents/documents.json debe ser un array');
} else {
  const slugs: string[] = [];

  for (const [index, document] of documents.entries()) {
    const context = `documents[${index}]`;

    if (!isRecord(document)) {
      errors.push(`${context}: debe ser un objeto`);
      continue;
    }

    const slug = stringField(document, 'slug', context);
    stringField(document, 'title', context);
    stringField(document, 'fileName', context);
    const sourcePath = stringField(document, 'sourcePath', context);
    stringField(document, 'type', context);
    const contentHash = stringField(document, 'contentHash', context);
    const ingestionStatus = stringField(document, 'ingestionStatus', context);
    const extractionStatus = document.extractionStatus;
    arrayField(document, 'tags', context);

    if (slug) {
      slugs.push(slug);
      documentSlugs.add(slug);
    }

    if (sourcePath && !existsSync(join(root, sourcePath))) {
      errors.push(`${context}: sourcePath no existe: ${sourcePath}`);
    }

    if (contentHash && !/^[a-f0-9]{64}$/.test(contentHash)) {
      errors.push(`${context}: contentHash debe ser sha256 hexadecimal`);
    }

    if (ingestionStatus && !allowedIngestionStatuses.has(ingestionStatus)) {
      errors.push(`${context}: ingestionStatus no reconocido "${ingestionStatus}"`);
    }

    if (document.needsReview !== undefined && typeof document.needsReview !== 'boolean') {
      errors.push(`${context}: needsReview debe ser boolean`);
    }

    if (extractionStatus !== undefined) {
      if (typeof extractionStatus !== 'string' || !allowedExtractionStatuses.has(extractionStatus)) {
        errors.push(`${context}: extractionStatus no reconocido "${String(extractionStatus)}"`);
      }
    }

    if (document.extractionError !== undefined && typeof document.extractionError !== 'string') {
      errors.push(`${context}: extractionError debe ser string`);
    }
  }

  validateUnique(slugs, 'documents.json');
}

const topicFiles = existsSync(topicDir)
  ? readdirSync(topicDir).filter((file) => file.endsWith('.json')).toSorted()
  : [];
const topicSlugs = new Set<string>();

for (const file of topicFiles) {
  const path = join(topicDir, file);
  const topic = readJson<Record<string, JsonValue>>(path);
  const context = `topics/${file}`;

  if (!topic || !isRecord(topic)) {
    errors.push(`${context}: debe ser un objeto`);
    continue;
  }

  const slug = stringField(topic, 'slug', context);
  stringField(topic, 'title', context);
  stringField(topic, 'shortDescription', context);
  const category = stringField(topic, 'category', context);
  arrayField(topic, 'minimumContents', context);
  const legalBasis = arrayField(topic, 'legalBasis', context);
  const projectReferences = arrayField(topic, 'projectReferences', context);
  arrayField(topic, 'decisionsForBuenVivir', context);
  arrayField(topic, 'risks', context);
  stringField(topic, 'status', context);

  if (slug) {
    topicSlugs.add(slug);
    if (file !== `${slug}.json`) {
      warnings.push(`${context}: el nombre de archivo no coincide con el slug "${slug}"`);
    }
  }

  if (category && !allowedCategories.has(category)) {
    errors.push(`${context}: categoría no reconocida "${category}"`);
  }

  if (!isRecord(topic.governancePlacement)) {
    errors.push(`${context}: falta objeto governancePlacement`);
  } else {
    stringField(topic.governancePlacement, 'recommendedPrimaryLocation', `${context}.governancePlacement`);
    arrayField(topic.governancePlacement, 'rationale', `${context}.governancePlacement`);
    arrayField(topic.governancePlacement, 'shouldBeInStatutes', `${context}.governancePlacement`);
    arrayField(topic.governancePlacement, 'shouldBeInRRI', `${context}.governancePlacement`);
  }

  for (const [index, reference] of [...legalBasis, ...projectReferences].entries()) {
    const referenceContext = `${context}.references[${index}]`;

    if (!isRecord(reference)) {
      errors.push(`${referenceContext}: debe ser un objeto`);
      continue;
    }

    const documentSlug = stringField(reference, 'documentSlug', referenceContext);
    const sourcePath = stringField(reference, 'sourcePath', referenceContext);

    if (documentSlug && !documentSlugs.has(documentSlug)) {
      errors.push(`${referenceContext}: documentSlug inexistente "${documentSlug}"`);
    }

    if (sourcePath && !existsSync(join(root, sourcePath))) {
      errors.push(`${referenceContext}: sourcePath no existe: ${sourcePath}`);
    }

    validateExcerptLength(reference, referenceContext);
  }

  if (topic.suggestedClause !== undefined) {
    if (!isRecord(topic.suggestedClause)) {
      errors.push(`${context}: suggestedClause debe ser objeto SuggestedClause`);
    } else {
      const text = stringField(topic.suggestedClause, 'text', `${context}.suggestedClause`);
      const disclaimer = stringField(topic.suggestedClause, 'disclaimer', `${context}.suggestedClause`);
      stringField(topic.suggestedClause, 'status', `${context}.suggestedClause`);

      if (text && disclaimer && !disclaimer.toLowerCase().includes('revisar jurídicamente')) {
        errors.push(`${context}.suggestedClause: el disclaimer debe indicar revisión jurídica`);
      }
    }
  }
}

validateUnique([...topicSlugs], 'topics');

const taxonomy = readJson<JsonValue[]>(taxonomyPath) ?? [];
const taxonomySlugSet = new Set<string>();

if (!Array.isArray(taxonomy)) {
  errors.push('taxonomy/topics.json debe ser un array');
} else {
  const taxonomySlugs: string[] = [];

  for (const [index, item] of taxonomy.entries()) {
    const context = `taxonomy[${index}]`;

    if (!isRecord(item)) {
      errors.push(`${context}: debe ser un objeto`);
      continue;
    }

    const slug = stringField(item, 'slug', context);
    stringField(item, 'title', context);
    const category = stringField(item, 'category', context);
    const status = stringField(item, 'status', context);

    if (slug) {
      taxonomySlugs.push(slug);
      taxonomySlugSet.add(slug);
    }

    if (category && !allowedCategories.has(category)) {
      errors.push(`${context}: categoría no reconocida "${category}"`);
    }

    if (status && !['active', 'planned', 'merged'].includes(status)) {
      errors.push(`${context}: status no reconocido "${status}"`);
    }

    if (status === 'merged' && typeof item.mergedInto !== 'string') {
      errors.push(`${context}: los temas merged deben declarar mergedInto`);
    }
  }

  validateUnique(taxonomySlugs, 'taxonomy/topics.json');

  for (const slug of topicSlugs) {
    if (!taxonomySlugSet.has(slug)) {
      warnings.push(`topics/${slug}.json: no existe en taxonomy/topics.json`);
    }
  }
}

const generatedReferences = readJson<{ references?: JsonValue[] }>(generatedReferencesPath);

if (!generatedReferences || !Array.isArray(generatedReferences.references)) {
  errors.push('src/content/generated/topic-references.json debe contener { "references": [] }');
} else {
  for (const [index, reference] of generatedReferences.references.entries()) {
    const context = `generated.references[${index}]`;

    if (!isRecord(reference)) {
      errors.push(`${context}: debe ser un objeto`);
      continue;
    }

    const topicSlug = stringField(reference, 'topicSlug', context);
    const documentSlug = stringField(reference, 'documentSlug', context);
    stringField(reference, 'excerpt', context);
    const reviewStatus = stringField(reference, 'reviewStatus', context);

    if (topicSlug && !taxonomySlugSet.has(topicSlug)) {
      errors.push(`${context}: topicSlug inexistente en taxonomy/topics.json "${topicSlug}"`);
    }

    if (documentSlug && !documentSlugs.has(documentSlug)) {
      errors.push(`${context}: documentSlug inexistente "${documentSlug}"`);
    }

    if (reviewStatus !== 'auto') {
      warnings.push(`${context}: las referencias generadas deberían empezar con reviewStatus "auto"`);
    }

    validateExcerptLength(reference, context);
  }
}

if (existsSync(generatedSectionsDir)) {
  const sectionFiles = readdirSync(generatedSectionsDir)
    .filter((file) => file.endsWith('.sections.json'))
    .toSorted();

  for (const file of sectionFiles) {
    const sections = readJson<JsonValue[]>(join(generatedSectionsDir, file));
    const expectedDocumentSlug = file.replace(/\.sections\.json$/, '');

    if (!Array.isArray(sections)) {
      errors.push(`generated/sections/${file}: debe ser un array`);
      continue;
    }

    for (const [index, section] of sections.entries()) {
      const context = `generated/sections/${file}[${index}]`;

      if (!isRecord(section)) {
        errors.push(`${context}: debe ser un objeto`);
        continue;
      }

      stringField(section, 'id', context);
      const documentSlug = stringField(section, 'documentSlug', context);
      stringField(section, 'heading', context);
      stringField(section, 'text', context);
      arrayField(section, 'possibleTopics', context);

      if (documentSlug && documentSlug !== expectedDocumentSlug) {
        errors.push(`${context}: documentSlug no coincide con el archivo`);
      }

      if (documentSlug && !documentSlugs.has(documentSlug)) {
        errors.push(`${context}: documentSlug inexistente "${documentSlug}"`);
      }

      if (typeof section.order !== 'number' || !Number.isInteger(section.order) || section.order < 1) {
        errors.push(`${context}: order debe ser entero positivo`);
      }
    }
  }
}

if (existsSync(splitReportPath)) {
  const splitReport = readJson<Record<string, JsonValue>>(splitReportPath);

  if (!splitReport || !isRecord(splitReport)) {
    errors.push('src/content/generated/split-report.json debe ser un objeto');
  } else {
    arrayField(splitReport, 'documents', 'src/content/generated/split-report.json');
    arrayField(splitReport, 'warnings', 'src/content/generated/split-report.json');
  }
}

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log(`Content validation passed (${topicFiles.length} topics, ${documents.length} documents).`);

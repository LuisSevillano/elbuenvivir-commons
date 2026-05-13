import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  ExtractedSection,
  GeneratedTopicReference,
  SourceDocument,
  TaxonomyTopic
} from '../src/lib/content/types';

interface ResearchPackOptions {
  maxReferences: number;
  excludeLowConfidence: boolean;
  sectionExcerptLength: number;
}

const root = process.cwd();
const taxonomyPath = join(root, 'taxonomy/topics.json');
const documentsPath = join(root, 'src/content/documents/documents.json');
const referencesPath = join(root, 'src/content/generated/topic-references.json');
const sectionsDir = join(root, 'src/content/generated/sections');
const outputDir = join(root, 'src/content/research-packs');
const defaultMaxReferences = 20;
const defaultSectionExcerptLength = 1800;
const confidenceRank: Record<GeneratedTopicReference['confidence'], number> = {
  high: 3,
  medium: 2,
  low: 1
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function optionValue(name: string): string | undefined {
  const prefixed = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefixed))?.slice(prefixed.length);
}

function booleanOption(name: string, envName: string): boolean {
  return process.argv.includes(`--${name}`) || process.env[envName] === 'true';
}

function options(): ResearchPackOptions {
  const maxReferences = Number(optionValue('max') ?? process.env.RESEARCH_PACK_MAX_REFERENCES ?? defaultMaxReferences);
  const sectionExcerptLength = Number(
    optionValue('excerpt-length') ?? process.env.RESEARCH_PACK_EXCERPT_LENGTH ?? defaultSectionExcerptLength
  );

  return {
    maxReferences: Number.isFinite(maxReferences) && maxReferences > 0 ? Math.floor(maxReferences) : defaultMaxReferences,
    excludeLowConfidence: booleanOption('exclude-low-confidence', 'RESEARCH_PACK_EXCLUDE_LOW_CONFIDENCE'),
    sectionExcerptLength: Number.isFinite(sectionExcerptLength) && sectionExcerptLength > 0
      ? Math.floor(sectionExcerptLength)
      : defaultSectionExcerptLength
  };
}

function readSections(): ExtractedSection[] {
  if (!existsSync(sectionsDir)) {
    return [];
  }

  return readdirSync(sectionsDir)
    .filter((file) => file.endsWith('.sections.json'))
    .toSorted()
    .flatMap((file) => readJson<ExtractedSection[]>(join(sectionsDir, file)));
}

function cleanMarkdown(value: string): string {
  return value.replace(/\r\n?/g, '\n').trim();
}

function inline(value: string | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() || 'No disponible';
}

function truncate(value: string, maxLength: number): string {
  const normalized = cleanMarkdown(value).replace(/\n{3,}/g, '\n\n');

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}\n\n[Extracto truncado automáticamente]`;
}

function topicDescription(topic: TaxonomyTopic): string {
  const keywords = topic.keywords?.slice(0, 6).join(', ') || 'sin keywords configuradas';
  const status = topic.status === 'active' ? 'tema activo' : 'tema planificado';

  return `${topic.title} es un ${status} de la categoría ${topic.category}. Este dossier reúne referencias automáticas asociadas a sus keywords: ${keywords}.`;
}

function keyQuestions(topic: TaxonomyTopic): string[] {
  const aliases = topic.aliases?.slice(0, 3).join(', ');
  const keywords = topic.keywords?.slice(0, 5).join(', ');

  return [
    `Qué secciones mencionan explícitamente el tema "${topic.title}"?`,
    `Qué documentos o proyectos concentran más referencias automáticas sobre este tema?`,
    `Qué diferencias aparecen entre tipos de documento, jurisdicciones o proyectos?`,
    `Qué referencias parecen útiles para revisión humana y cuáles pueden ser ruido heurístico?`,
    aliases ? `Los aliases (${aliases}) apuntan a las mismas reglas que las keywords principales?` : undefined,
    keywords ? `Las keywords (${keywords}) aparecen en contexto sustantivo o solo incidental?` : undefined
  ].filter((question): question is string => question !== undefined);
}

function sectionForReference(
  reference: GeneratedTopicReference,
  sectionsByDocument: Map<string, ExtractedSection[]>
): ExtractedSection | undefined {
  const sections = sectionsByDocument.get(reference.documentSlug) ?? [];

  if (reference.articleOrSection) {
    const byHeading = sections.find((section) => section.heading === reference.articleOrSection);

    if (byHeading) {
      return byHeading;
    }
  }

  const normalizedExcerpt = reference.excerpt.replace(/\s+/g, ' ').slice(0, 120);
  return sections.find((section) => section.text.replace(/\s+/g, ' ').includes(normalizedExcerpt));
}

function groupedReferences(
  references: GeneratedTopicReference[],
  documentsBySlug: Map<string, SourceDocument>
): [string, GeneratedTopicReference[]][] {
  const groups = new Map<string, GeneratedTopicReference[]>();

  for (const reference of references) {
    const document = documentsBySlug.get(reference.documentSlug);
    const groupName = document?.projectName || reference.documentTitle;
    const key = `${groupName}||${reference.documentSlug}`;
    const current = groups.get(key) ?? [];
    current.push(reference);
    groups.set(key, current);
  }

  return [...groups.entries()].map(([key, value]) => [key.split('||')[0], value]);
}

function referencesForTopic(
  topicSlug: string,
  references: GeneratedTopicReference[],
  packOptions: ResearchPackOptions
): GeneratedTopicReference[] {
  return references
    .filter((reference) => reference.topicSlug === topicSlug)
    .filter((reference) => !packOptions.excludeLowConfidence || reference.confidence !== 'low')
    .toSorted(
      (a, b) =>
        confidenceRank[b.confidence] - confidenceRank[a.confidence] ||
        (b.score ?? 0) - (a.score ?? 0) ||
        a.documentTitle.localeCompare(b.documentTitle, 'es')
    )
    .slice(0, packOptions.maxReferences);
}

function renderReference(
  reference: GeneratedTopicReference,
  index: number,
  documentsBySlug: Map<string, SourceDocument>,
  sectionsByDocument: Map<string, ExtractedSection[]>,
  packOptions: ResearchPackOptions
): string {
  const document = documentsBySlug.get(reference.documentSlug);
  const section = sectionForReference(reference, sectionsByDocument);
  const extract = section?.text ?? reference.excerpt;

  return [
    `### Referencia ${index}`,
    '',
    `- Documento: ${reference.documentTitle}`,
    `- Slug documento: \`${reference.documentSlug}\``,
    `- Tipo: ${reference.documentType}`,
    `- Jurisdicción: ${inline(document?.jurisdiction)}`,
    `- Proyecto: ${inline(reference.projectName ?? document?.projectName)}`,
    `- Sección/artículo: ${inline(reference.articleOrSection)}`,
    `- Ruta fuente: \`${reference.sourcePath}\``,
    `- Confidence: ${reference.confidence}`,
    `- Score: ${reference.score ?? 'No disponible'}`,
    `- Review status: ${reference.reviewStatus}`,
    '',
    '> Referencia automática sin revisar. No usar como conclusión jurídica sin revisión humana.',
    '',
    'Extracto relevante:',
    '',
    '```text',
    truncate(extract, packOptions.sectionExcerptLength),
    '```',
    ''
  ].join('\n');
}

function renderPack(
  topic: TaxonomyTopic,
  topicReferences: GeneratedTopicReference[],
  documentsBySlug: Map<string, SourceDocument>,
  sectionsByDocument: Map<string, ExtractedSection[]>,
  packOptions: ResearchPackOptions
): string {
  const lines: string[] = [
    `# Research pack: ${topic.title}`,
    '',
    'Metadata:',
    '',
    `- Topic slug: \`${topic.slug}\``,
    `- Categoría: ${topic.category}`,
    `- Estado taxonómico: ${topic.status}`,
    `- Referencias incluidas: ${topicReferences.length}`,
    `- Máximo configurado: ${packOptions.maxReferences}`,
    `- Excluir low confidence: ${packOptions.excludeLowConfidence ? 'sí' : 'no'}`,
    '',
    '## Descripción breve',
    '',
    topicDescription(topic),
    '',
    'Este dossier contiene extractos automáticos para análisis posterior. No contiene resúmenes jurídicos ni conclusiones generadas.',
    '',
    '## Preguntas clave',
    '',
    ...keyQuestions(topic).map((question) => `- ${question}`),
    '',
    '## Referencias agrupadas por proyecto/documento',
    ''
  ];

  if (topicReferences.length === 0) {
    lines.push('No hay referencias automáticas para este tema con la configuración actual.', '');
    return lines.join('\n');
  }

  let referenceIndex = 1;

  for (const [groupName, references] of groupedReferences(topicReferences, documentsBySlug)) {
    lines.push(`## ${groupName}`, '');

    for (const reference of references) {
      lines.push(renderReference(reference, referenceIndex, documentsBySlug, sectionsByDocument, packOptions));
      lines.push('---', '');
      referenceIndex += 1;
    }
  }

  return `${lines.join('\n').trim()}\n`;
}

const packOptions = options();
const taxonomy = readJson<TaxonomyTopic[]>(taxonomyPath).filter((topic) => topic.status !== 'merged');
const documents = readJson<SourceDocument[]>(documentsPath);
const references = readJson<{ references: GeneratedTopicReference[] }>(referencesPath).references;
const sections = readSections();
const documentsBySlug = new Map(documents.map((document) => [document.slug, document]));
const sectionsByDocument = new Map<string, ExtractedSection[]>();

for (const section of sections) {
  const current = sectionsByDocument.get(section.documentSlug) ?? [];
  current.push(section);
  sectionsByDocument.set(section.documentSlug, current);
}

mkdirSync(outputDir, { recursive: true });

for (const topic of taxonomy) {
  const topicReferences = referencesForTopic(topic.slug, references, packOptions);
  const outputPath = join(outputDir, `${topic.slug}.md`);
  writeFileSync(outputPath, renderPack(topic, topicReferences, documentsBySlug, sectionsByDocument, packOptions));
}

console.log(`Generated ${taxonomy.length} research pack(s).`);
console.log('Wrote src/content/research-packs/*.md.');

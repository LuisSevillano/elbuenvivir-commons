import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';

import type { DocumentType, SourceDocument } from '../src/lib/content/types';

type IngestedDocument = SourceDocument & {
  contentHash: string;
  ingestionStatus: 'ok' | 'needs_review';
  needsReview: boolean;
  lastProcessedAt: string;
};

const root = process.cwd();
const docsRoot = join(root, 'docs');
const documentsPath = join(root, 'src/content/documents/documents.json');
const sourceDirs: { dir: string; type: DocumentType }[] = [
  { dir: 'leyes', type: 'ley' },
  { dir: 'estatutos', type: 'estatutos' },
  { dir: 'rri', type: 'rri' },
  { dir: 'guias', type: 'guia' },
  { dir: 'otros', type: 'otro' }
];
const supportedExtensions = new Set(['.pdf', '.txt', '.md', '.docx']);
const languageHints = new Map<SourceDocument['language'], RegExp>([
  ['ca', /(^|[-_\s])(ca|cat|catala|catalan)([-_\s]|$)/i],
  ['gl', /(^|[-_\s])(gl|galego|gallego)([-_\s]|$)/i],
  ['eu', /(^|[-_\s])(eu|eus|euskera|euskara)([-_\s]|$)/i],
  ['en', /(^|[-_\s])(en|eng|english|ingles)([-_\s]|$)/i],
  ['es', /(^|[-_\s])(es|esp|castellano|spanish|espanol|español)([-_\s]|$)/i]
]);

function readDocuments(): SourceDocument[] {
  if (!existsSync(documentsPath)) {
    return [];
  }

  return JSON.parse(readFileSync(documentsPath, 'utf8')) as SourceDocument[];
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(entryPath);
    }

    return entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase()) ? [entryPath] : [];
  });
}

function toSourcePath(path: string): string {
  return relative(root, path).split(sep).join('/');
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function titleFromFileName(fileName: string): string {
  const baseName = basename(fileName, extname(fileName));
  return baseName
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function inferProjectName(sourcePath: string): string | undefined {
  const parts = sourcePath.split('/').slice(2, -1).filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  return titleFromFileName(parts.at(-1) ?? '');
}

function inferJurisdiction(value: string): string | undefined {
  const normalized = slugify(value);
  const matches: [RegExp, string][] = [
    [/\b(espana|estado|estatal|ley-cooperativas)\b/, 'España'],
    [/\b(catalunya|cataluna|barcelona|girona|lleida|tarragona)\b/, 'Catalunya'],
    [/\b(madrid)\b/, 'Madrid'],
    [/\b(andalu(cia|sia)|sevilla|granada|malaga|cordoba|cadiz|huelva|jaen|almeria)\b/, 'Andalucía'],
    [/\b(valencia|valenciana|castellon|alicante)\b/, 'Comunitat Valenciana'],
    [/\b(euskadi|pais-vasco|bizkaia|gipuzkoa|araba)\b/, 'Euskadi'],
    [/\b(galicia|galiza|coruna|ourense|lugo|pontevedra)\b/, 'Galicia'],
    [/\b(balears|baleares|mallorca|menorca|ibiza)\b/, 'Illes Balears'],
    [/\b(canarias|tenerife|gran-canaria)\b/, 'Canarias']
  ];

  return matches.find(([pattern]) => pattern.test(normalized))?.[1];
}

function inferLanguage(value: string): SourceDocument['language'] {
  for (const [language, pattern] of languageHints.entries()) {
    if (pattern.test(value)) {
      return language;
    }
  }

  return 'es';
}

function inferYear(value: string): number | undefined {
  const year = value.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/)?.[1];
  return year ? Number(year) : undefined;
}

function inferTags(sourcePath: string, type: DocumentType): string[] {
  const normalized = slugify(sourcePath);
  const tags = new Set<string>([type]);
  const keywordTags: [RegExp, string][] = [
    [/\b(cooperativa|cooperativas)\b/, 'cooperativas'],
    [/\b(vivienda|habitatge|covivienda|cohousing)\b/, 'vivienda'],
    [/\b(cesion-uso|cesion-de-uso|cessio-us)\b/, 'cesion_uso'],
    [/\b(estatutos|estatuts)\b/, 'estatutos'],
    [/\b(reglamento|rri|regim-intern|regimen-interno)\b/, 'rri'],
    [/\b(guia|manual)\b/, 'guia'],
    [/\b(ley|decreto|normativa)\b/, 'normativa']
  ];

  for (const [pattern, tag] of keywordTags) {
    if (pattern.test(normalized)) {
      tags.add(tag);
    }
  }

  return [...tags].toSorted();
}

function hashFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function hasMissingData(document: SourceDocument): boolean {
  return !document.projectName || !document.jurisdiction || !document.year || !document.language;
}

function inferDocument(path: string, type: DocumentType): IngestedDocument {
  const sourcePath = toSourcePath(path);
  const fileName = basename(path);
  const fileStem = basename(fileName, extname(fileName));
  const inferred: SourceDocument = {
    slug: slugify(sourcePath.replace(/\.[^.]+$/, '')),
    title: titleFromFileName(fileName),
    fileName,
    sourcePath,
    type,
    projectName: inferProjectName(sourcePath),
    jurisdiction: inferJurisdiction(sourcePath),
    year: inferYear(sourcePath),
    language: inferLanguage(fileStem),
    tags: inferTags(sourcePath, type),
    extractionStatus: 'not_started'
  };

  return {
    ...inferred,
    contentHash: hashFile(path),
    ingestionStatus: hasMissingData(inferred) ? 'needs_review' : 'ok',
    needsReview: hasMissingData(inferred),
    lastProcessedAt: new Date().toISOString()
  };
}

function mergeDocuments(inferred: IngestedDocument, existing?: SourceDocument): IngestedDocument {
  const merged = {
    ...inferred,
    ...existing,
    contentHash: inferred.contentHash,
    ingestionStatus: hasMissingData({ ...inferred, ...existing }) ? 'needs_review' : 'ok',
    needsReview: hasMissingData({ ...inferred, ...existing }),
    lastProcessedAt: inferred.lastProcessedAt
  };

  return merged;
}

const existingDocuments = readDocuments();
const existingBySourcePath = new Map(existingDocuments.map((document) => [document.sourcePath, document]));
const seenSourcePaths = new Set<string>();
const ingestedDocuments = sourceDirs.flatMap(({ dir, type }) =>
  walk(join(docsRoot, dir)).map((path) => {
    const inferred = inferDocument(path, type);
    seenSourcePaths.add(inferred.sourcePath);
    return mergeDocuments(inferred, existingBySourcePath.get(inferred.sourcePath));
  })
);
const missingExistingDocuments = existingDocuments
  .filter((document) => !seenSourcePaths.has(document.sourcePath))
  .map((document) => ({
    ...document,
    ingestionStatus: 'needs_review' as const,
    needsReview: true
  }));
const nextDocuments = [...ingestedDocuments, ...missingExistingDocuments].toSorted((a, b) =>
  a.slug.localeCompare(b.slug, 'es')
);

writeFileSync(documentsPath, `${JSON.stringify(nextDocuments, null, 2)}\n`);

console.log(`Ingested ${ingestedDocuments.length} document(s).`);
console.log(`Preserved ${missingExistingDocuments.length} existing document(s) not found under docs/.`);
console.log(`Wrote ${toSourcePath(documentsPath)}.`);

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import type { DocumentType, ExtractedSection, SourceDocument } from '../src/lib/content/types';

type SplitMethod =
  | 'heading:legal'
  | 'heading:statutes'
  | 'heading:rri'
  | 'heading:guide'
  | 'heading:generic'
  | 'fallback:numbered-headings'
  | 'fallback:page-markers'
  | 'fallback:paragraph-chunks'
  | 'fallback:character-chunks'
  | 'fallback:whole-document';

interface DraftSection {
  heading: string;
  text: string;
  splitMethod: SplitMethod;
  sourceRangeLabel?: string;
}

interface SplitMetrics {
  documentSlug: string;
  documentType: DocumentType | 'unknown';
  sectionCount: number;
  averageLength: number;
  longestSectionLength: number;
  longSectionsRemaining: number;
  fallbackSections: number;
  improvedByFallback: boolean;
  lengthDistribution: LengthDistribution;
  warnings: string[];
}

interface LengthDistribution {
  under2k: number;
  from2kTo5k: number;
  from5kTo10k: number;
  from10kTo15k: number;
  over15k: number;
}

interface WorstDocumentSummary {
  documentSlug: string;
  documentType: DocumentType | 'unknown';
  sectionCount: number;
  longestSectionLength: number;
  longSectionsRemaining: number;
  fallbackSections: number;
  warnings: string[];
}

interface SplitReport {
  generatedAt: string;
  documentsTotal: number;
  sectionsTotal: number;
  averageSectionsPerDocument: number;
  averageSectionLength: number;
  improvedDocuments: number;
  longSectionsRemaining: number;
  fallbackSections: number;
  lengthDistribution: LengthDistribution;
  worstDocuments: WorstDocumentSummary[];
  documents: SplitMetrics[];
  warnings: string[];
}

const root = process.cwd();
const extractedDir = join(root, 'src/content/generated/extracted');
const sectionsDir = join(root, 'src/content/generated/sections');
const reportPath = join(root, 'src/content/generated/split-report.json');
const documentsPath = join(root, 'src/content/documents/documents.json');
const fewSectionsThreshold = 3;
const longSectionThreshold = 15_000;
const fallbackChunkTarget = 9_000;
const fallbackChunkMax = 14_000;

const pageMarkerPattern = /^\s*(?:[-–—]{1,3}\s*)?(?:p(?:á|a)g(?:ina|\.)?|page)?\s*\d+\s*(?:de|of|\/)?\s*\d*\s*(?:[-–—]{1,3})?\s*$/iu;

const legalHeadingPattern = /^\s*(?:(?:libro|t[ií]tulo|cap[ií]tulo|cap[ií]tol|secci[oó]n)\s+[ivxlcdm\d]+\b.*|(?:art(?:í|i)culo|art\.|article)\s+\d+[\w.ºª)\-]*\b.*|apartado\s+\d+\b.*|disposici[oó]n\s+(?:adicional|transitoria|derogatoria|final)\b.*|anex[oa]\b.*)\s*$/iu;
const statuteHeadingPattern = /^\s*(?:(?:t[ií]tulo|cap[ií]tulo|secci[oó]n|cap[ií]tol)\s+[ivxlcdm\d]+\b.*|(?:art(?:í|i)culo|art\.|article)\s+\d+[\w.ºª)\-]*\b.*|apartado\s+\d+\b.*|disposici[oó]n\s+(?:adicional|transitoria|derogatoria|final)\b.*|anex[oa]\b.*)\s*$/iu;
const numberedHeadingPattern = /^\s*(?:\d{1,2}(?:\.\d{1,2}){0,4}\.?|\d{1,2}\s*\/|[a-z]\))\s+\S.{2,160}$/iu;
const indexEntryPattern = /^\s*(?:\d{1,2}(?:\.\d{1,2}){0,4}\s+)?\S.{3,150}\s+\.{2,}\s*\d+\s*$/u;
const uppercaseHeadingPattern = /^\s*(?!.*\.{2,})(?=.{5,140}$)[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9\s,;:()\/\-]{4,}\s*$/u;

function emptyDistribution(): LengthDistribution {
  return { under2k: 0, from2kTo5k: 0, from5kTo10k: 0, from10kTo15k: 0, over15k: 0 };
}

function addLength(distribution: LengthDistribution, length: number): void {
  if (length < 2_000) {
    distribution.under2k += 1;
  } else if (length < 5_000) {
    distribution.from2kTo5k += 1;
  } else if (length < 10_000) {
    distribution.from5kTo10k += 1;
  } else if (length <= longSectionThreshold) {
    distribution.from10kTo15k += 1;
  } else {
    distribution.over15k += 1;
  }
}

function mergeDistributions(items: LengthDistribution[]): LengthDistribution {
  return items.reduce((total, item) => ({
    under2k: total.under2k + item.under2k,
    from2kTo5k: total.from2kTo5k + item.from2kTo5k,
    from5kTo10k: total.from5kTo10k + item.from5kTo10k,
    from10kTo15k: total.from10kTo15k + item.from10kTo15k,
    over15k: total.over15k + item.over15k
  }), emptyDistribution());
}

function sectionId(documentSlug: string, order: number): string {
  return `${documentSlug}--section-${String(order).padStart(4, '0')}`;
}

function textFiles(): string[] {
  if (!existsSync(extractedDir)) {
    return [];
  }

  return readdirSync(extractedDir)
    .filter((file) => file.endsWith('.txt'))
    .toSorted()
    .map((file) => join(extractedDir, file));
}

function loadDocumentsBySlug(): Map<string, SourceDocument> {
  if (!existsSync(documentsPath)) {
    return new Map();
  }

  const documents = JSON.parse(readFileSync(documentsPath, 'utf8')) as SourceDocument[];
  return new Map(documents.map((document) => [document.slug, document]));
}

function normalizeLine(line: string): string {
  return line.replace(/[ \t]+/g, ' ').trim();
}

function isLikelyHeading(line: string, documentType: DocumentType | 'unknown'): boolean {
  const trimmed = normalizeLine(line);

  if (trimmed.length < 4 || trimmed.length > 180) {
    return false;
  }

  if (indexEntryPattern.test(trimmed)) {
    return documentType === 'guia' || documentType === 'otro' || documentType === 'unknown';
  }

  if (documentType === 'ley') {
    return legalHeadingPattern.test(trimmed) || numberedHeadingPattern.test(trimmed);
  }

  if (documentType === 'estatutos' || documentType === 'rri' || documentType === 'modelo') {
    return statuteHeadingPattern.test(trimmed) || numberedHeadingPattern.test(trimmed);
  }

  if (documentType === 'guia') {
    return legalHeadingPattern.test(trimmed) || numberedHeadingPattern.test(trimmed) || uppercaseHeadingPattern.test(trimmed);
  }

  return legalHeadingPattern.test(trimmed) || numberedHeadingPattern.test(trimmed) || uppercaseHeadingPattern.test(trimmed);
}

function headingMethod(documentType: DocumentType | 'unknown'): SplitMethod {
  if (documentType === 'ley') {
    return 'heading:legal';
  }
  if (documentType === 'estatutos' || documentType === 'modelo') {
    return 'heading:statutes';
  }
  if (documentType === 'rri') {
    return 'heading:rri';
  }
  if (documentType === 'guia') {
    return 'heading:guide';
  }
  return 'heading:generic';
}

function stripIndexDots(line: string): string {
  return normalizeLine(line).replace(/\s+\.{2,}\s*\d+\s*$/u, '');
}

function removeRepeatedChrome(lines: string[], documentType: DocumentType | 'unknown'): string[] {
  const counts = new Map<string, number>();

  for (const line of lines) {
    const trimmed = normalizeLine(line);
    if (trimmed.length >= 3 && trimmed.length <= 120 && !isLikelyHeading(trimmed, documentType)) {
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  }

  return lines.filter((line) => {
    const trimmed = normalizeLine(line);
    const count = counts.get(trimmed) ?? 0;

    if (count < 4) {
      return true;
    }

    return !(pageMarkerPattern.test(trimmed) || trimmed.length < 45 || /www\.|@|p(?:á|a)gina|page|\d+\s+(?:de|of)\s+\d+/iu.test(trimmed));
  });
}

function normalizeText(text: string, documentType: DocumentType | 'unknown'): string {
  const withoutBrokenWords = text
    .replace(/\r\n?/g, '\n')
    .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\n([a-záéíóúüñ])/g, '$1$2');
  const lines = removeRepeatedChrome(withoutBrokenWords.split('\n'), documentType).map((line) => line.replace(/[ \t]+/g, ' ').trimEnd());

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function inferPageRange(text: string): string | undefined {
  const pages = [...text.matchAll(/(?:^|\n)\s*(?:[-–—]{1,3}\s*)?(?:p(?:á|a)g(?:ina|\.)?|page)?\s*(\d+)\s*(?:de|of|\/)?\s*\d*\s*(?:[-–—]{1,3})?\s*(?=\n|$)/giu)]
    .map((match) => Number(match[1]))
    .filter((page) => Number.isFinite(page));

  if (pages.length === 0) {
    return undefined;
  }

  const first = pages[0];
  const last = pages[pages.length - 1];
  return first === last ? `p. ${first}` : `pp. ${first}-${last}`;
}

function toExtractedSections(documentSlug: string, drafts: DraftSection[]): ExtractedSection[] {
  return drafts.map((draft, index) => {
    const qualityWarning = draft.text.length > longSectionThreshold
      ? `Long section remaining (${draft.text.length} characters)`
      : undefined;

    return {
      id: sectionId(documentSlug, index + 1),
      documentSlug,
      heading: draft.heading,
      text: draft.text,
      order: index + 1,
      possibleTopics: [],
      splitMethod: draft.splitMethod,
      qualityWarning,
      sourceRangeLabel: draft.sourceRangeLabel
    };
  });
}

function splitByHeadings(text: string, documentType: DocumentType | 'unknown'): DraftSection[] {
  const lines = text.split('\n');
  const sections: DraftSection[] = [];
  let currentHeading = 'Documento completo';
  let currentLines: string[] = [];

  function pushSection(): void {
    const sectionText = currentLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    if (sectionText.length === 0) {
      return;
    }

    sections.push({
      heading: currentHeading,
      text: sectionText,
      splitMethod: headingMethod(documentType),
      sourceRangeLabel: inferPageRange(sectionText)
    });
  }

  for (const line of lines) {
    const trimmed = normalizeLine(line);

    if (isLikelyHeading(trimmed, documentType)) {
      pushSection();
      currentHeading = stripIndexDots(trimmed);
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  pushSection();

  return sections;
}

function splitLongSection(section: DraftSection, documentType: DocumentType | 'unknown'): DraftSection[] {
  if (section.text.length <= longSectionThreshold) {
    return [section];
  }

  const numbered = splitByFallbackHeadings(section);
  if (numbered.length > 1) {
    return numbered.flatMap((item) => splitLongSection(item, documentType));
  }

  const byPages = splitByPages(section);
  if (byPages.length > 1) {
    return byPages.flatMap((item) => splitLongSection(item, documentType));
  }

  const byParagraphs = splitByParagraphs(section);
  if (byParagraphs.length > 1) {
    return byParagraphs.flatMap((item) => item.text.length > longSectionThreshold ? splitByCharacters(item) : [item]);
  }

  return splitByCharacters(section);
}

function splitByFallbackHeadings(section: DraftSection): DraftSection[] {
  const parts = splitByBoundary(section.text, (line) => {
    const trimmed = normalizeLine(line);
    return numberedHeadingPattern.test(trimmed) || legalHeadingPattern.test(trimmed) || uppercaseHeadingPattern.test(trimmed);
  }, 'fallback:numbered-headings', section.heading);

  return parts.length > 1 ? parts : [section];
}

function splitByPages(section: DraftSection): DraftSection[] {
  const chunks = section.text.split(/(?=\n\s*(?:[-–—]{1,3}\s*)?(?:p(?:á|a)g(?:ina|\.)?|page)?\s*\d+\s*(?:de|of|\/)\s*\d+\s*(?:[-–—]{1,3})?\s*\n)/iu)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length <= 1) {
    return [section];
  }

  return chunks.map((chunk, index) => ({
    heading: `${section.heading} · páginas ${index + 1}`,
    text: chunk,
    splitMethod: 'fallback:page-markers',
    sourceRangeLabel: inferPageRange(chunk)
  }));
}

function splitByParagraphs(section: DraftSection): DraftSection[] {
  const paragraphs = section.text.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean);

  if (paragraphs.length <= 1) {
    return [section];
  }

  const chunks: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    if (currentLength >= fallbackChunkTarget && current.length > 0) {
      chunks.push(current.join('\n\n'));
      current = [];
      currentLength = 0;
    }

    current.push(paragraph);
    currentLength += paragraph.length + 2;
  }

  if (current.length > 0) {
    chunks.push(current.join('\n\n'));
  }

  if (chunks.length <= 1) {
    return [section];
  }

  return chunks.map((chunk, index) => ({
    heading: `${section.heading} · fragmento ${index + 1}`,
    text: chunk,
    splitMethod: 'fallback:paragraph-chunks',
    sourceRangeLabel: inferPageRange(chunk)
  }));
}

function splitByCharacters(section: DraftSection): DraftSection[] {
  const chunks: DraftSection[] = [];

  for (let start = 0; start < section.text.length; start += fallbackChunkMax) {
    const chunk = section.text.slice(start, start + fallbackChunkMax).trim();
    if (chunk.length > 0) {
      chunks.push({
        heading: `${section.heading} · fragmento ${chunks.length + 1}`,
        text: chunk,
        splitMethod: 'fallback:character-chunks',
        sourceRangeLabel: inferPageRange(chunk)
      });
    }
  }

  return chunks.length > 0 ? chunks : [section];
}

function splitByBoundary(text: string, isBoundary: (line: string) => boolean, method: SplitMethod, parentHeading: string): DraftSection[] {
  const lines = text.split('\n');
  const sections: DraftSection[] = [];
  let currentHeading = parentHeading;
  let currentLines: string[] = [];

  function pushSection(): void {
    const sectionText = currentLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    if (sectionText.length === 0) {
      return;
    }

    sections.push({
      heading: currentHeading,
      text: sectionText,
      splitMethod: method,
      sourceRangeLabel: inferPageRange(sectionText)
    });
  }

  for (const line of lines) {
    const trimmed = normalizeLine(line);
    if (isBoundary(trimmed)) {
      pushSection();
      currentHeading = stripIndexDots(trimmed);
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  pushSection();
  return sections;
}

function splitText(documentSlug: string, text: string, documentType: DocumentType | 'unknown'): ExtractedSection[] {
  const normalizedText = normalizeText(text, documentType);

  if (normalizedText.length === 0) {
    return toExtractedSections(documentSlug, [{
      heading: 'Documento completo',
      text: '',
      splitMethod: 'fallback:whole-document'
    }]);
  }

  const initialSections = splitByHeadings(normalizedText, documentType);
  const sections = (initialSections.length > 0 ? initialSections : [{
    heading: 'Documento completo',
    text: normalizedText,
    splitMethod: 'fallback:whole-document' as const,
    sourceRangeLabel: inferPageRange(normalizedText)
  }]).flatMap((section) => splitLongSection(section, documentType));

  return toExtractedSections(documentSlug, sections);
}

function metricsFor(documentSlug: string, documentType: DocumentType | 'unknown', sections: ExtractedSection[]): SplitMetrics {
  const lengths = sections.map((section) => section.text.length);
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  const averageLength = sections.length > 0 ? Math.round(totalLength / sections.length) : 0;
  const longestSectionLength = Math.max(0, ...lengths);
  const longSectionsRemaining = lengths.filter((length) => length > longSectionThreshold).length;
  const fallbackSections = sections.filter((section) => section.splitMethod?.startsWith('fallback:')).length;
  const lengthDistribution = emptyDistribution();
  const warnings: string[] = [];

  for (const length of lengths) {
    addLength(lengthDistribution, length);
  }

  if (sections.length < fewSectionsThreshold) {
    warnings.push(`Few sections detected (${sections.length})`);
  }

  if (longSectionsRemaining > 0) {
    warnings.push(`Long sections remaining (${longSectionsRemaining}; longest ${longestSectionLength} characters)`);
  }

  return {
    documentSlug,
    documentType,
    sectionCount: sections.length,
    averageLength,
    longestSectionLength,
    longSectionsRemaining,
    fallbackSections,
    improvedByFallback: fallbackSections > 0,
    lengthDistribution,
    warnings
  };
}

function worstScore(metrics: SplitMetrics): number {
  return (metrics.longSectionsRemaining * 100_000) + metrics.longestSectionLength - (metrics.sectionCount * 250);
}

mkdirSync(sectionsDir, { recursive: true });

const documentsBySlug = loadDocumentsBySlug();
const files = textFiles();
const metrics: SplitMetrics[] = [];
let sectionsTotal = 0;
let totalSectionLength = 0;

for (const file of files) {
  const documentSlug = basename(file, extname(file));
  const documentType = documentsBySlug.get(documentSlug)?.type ?? 'unknown';
  const sections = splitText(documentSlug, readFileSync(file, 'utf8'), documentType);
  const outputPath = join(sectionsDir, `${documentSlug}.sections.json`);

  sectionsTotal += sections.length;
  totalSectionLength += sections.reduce((total, section) => total + section.text.length, 0);
  metrics.push(metricsFor(documentSlug, documentType, sections));
  writeFileSync(outputPath, `${JSON.stringify(sections, null, 2)}\n`);
}

const reportWarnings = metrics.flatMap((item) => item.warnings.map((warning) => `${item.documentSlug}: ${warning}`));
const worstDocuments = metrics
  .toSorted((a, b) => worstScore(b) - worstScore(a))
  .slice(0, 10)
  .map((item) => ({
    documentSlug: item.documentSlug,
    documentType: item.documentType,
    sectionCount: item.sectionCount,
    longestSectionLength: item.longestSectionLength,
    longSectionsRemaining: item.longSectionsRemaining,
    fallbackSections: item.fallbackSections,
    warnings: item.warnings
  }));
const report: SplitReport = {
  generatedAt: new Date().toISOString(),
  documentsTotal: files.length,
  sectionsTotal,
  averageSectionsPerDocument: files.length > 0 ? Math.round((sectionsTotal / files.length) * 100) / 100 : 0,
  averageSectionLength: sectionsTotal > 0 ? Math.round(totalSectionLength / sectionsTotal) : 0,
  improvedDocuments: metrics.filter((item) => item.improvedByFallback).length,
  longSectionsRemaining: metrics.reduce((total, item) => total + item.longSectionsRemaining, 0),
  fallbackSections: metrics.reduce((total, item) => total + item.fallbackSections, 0),
  lengthDistribution: mergeDistributions(metrics.map((item) => item.lengthDistribution)),
  worstDocuments,
  documents: metrics,
  warnings: reportWarnings
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

for (const warning of reportWarnings) {
  console.warn(`WARN ${warning}`);
}

console.log(`Split ${files.length} document(s) into ${sectionsTotal} section(s).`);
console.log(`Wrote src/content/generated/split-report.json.`);

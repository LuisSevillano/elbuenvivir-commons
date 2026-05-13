import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import type { ExtractedSection } from '../src/lib/content/types';

interface SplitMetrics {
  documentSlug: string;
  sectionCount: number;
  averageLength: number;
  longestSectionLength: number;
  warnings: string[];
}

interface SplitReport {
  generatedAt: string;
  documentsTotal: number;
  sectionsTotal: number;
  averageSectionsPerDocument: number;
  averageSectionLength: number;
  documents: SplitMetrics[];
  warnings: string[];
}

const root = process.cwd();
const extractedDir = join(root, 'src/content/generated/extracted');
const sectionsDir = join(root, 'src/content/generated/sections');
const reportPath = join(root, 'src/content/generated/split-report.json');
const fewSectionsThreshold = 3;
const longSectionThreshold = 25_000;
const headingPattern = /^\s*((?:Art(?:í|i)culo|Art\.|Article)\s+\d+[\w.ºª)\-]*.*|(?:CAP[IÍ]TULO|T[IÍ]TULO|Secci[oó]n|Cap[ií]tol|Article)\b.*)\s*$/iu;

function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n').trim();
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

function isHeading(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.length < 4 || trimmed.length > 180) {
    return false;
  }

  return headingPattern.test(trimmed);
}

function splitText(documentSlug: string, text: string): ExtractedSection[] {
  const normalizedText = normalizeText(text);
  const lines = normalizedText.split('\n');
  const sections: ExtractedSection[] = [];
  let currentHeading = 'Documento completo';
  let currentLines: string[] = [];

  function pushSection(): void {
    const sectionText = normalizeText(currentLines.join('\n'));

    if (sectionText.length === 0) {
      return;
    }

    const order = sections.length + 1;
    sections.push({
      id: sectionId(documentSlug, order),
      documentSlug,
      heading: currentHeading,
      text: sectionText,
      order,
      possibleTopics: []
    });
  }

  for (const line of lines) {
    if (isHeading(line)) {
      pushSection();
      currentHeading = line.trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  pushSection();

  if (sections.length === 0) {
    return [
      {
        id: sectionId(documentSlug, 1),
        documentSlug,
        heading: 'Documento completo',
        text: normalizedText,
        order: 1,
        possibleTopics: []
      }
    ];
  }

  return sections;
}

function metricsFor(documentSlug: string, sections: ExtractedSection[]): SplitMetrics {
  const lengths = sections.map((section) => section.text.length);
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  const averageLength = sections.length > 0 ? Math.round(totalLength / sections.length) : 0;
  const longestSectionLength = Math.max(0, ...lengths);
  const warnings: string[] = [];

  if (sections.length < fewSectionsThreshold) {
    warnings.push(`Few sections detected (${sections.length})`);
  }

  if (longestSectionLength > longSectionThreshold) {
    warnings.push(`Long section detected (${longestSectionLength} characters)`);
  }

  return {
    documentSlug,
    sectionCount: sections.length,
    averageLength,
    longestSectionLength,
    warnings
  };
}

mkdirSync(sectionsDir, { recursive: true });

const files = textFiles();
const metrics: SplitMetrics[] = [];
let sectionsTotal = 0;
let totalSectionLength = 0;

for (const file of files) {
  const documentSlug = basename(file, extname(file));
  const sections = splitText(documentSlug, readFileSync(file, 'utf8'));
  const outputPath = join(sectionsDir, `${documentSlug}.sections.json`);

  sectionsTotal += sections.length;
  totalSectionLength += sections.reduce((total, section) => total + section.text.length, 0);
  metrics.push(metricsFor(documentSlug, sections));
  writeFileSync(outputPath, `${JSON.stringify(sections, null, 2)}\n`);
}

const reportWarnings = metrics.flatMap((item) => item.warnings.map((warning) => `${item.documentSlug}: ${warning}`));
const report: SplitReport = {
  generatedAt: new Date().toISOString(),
  documentsTotal: files.length,
  sectionsTotal,
  averageSectionsPerDocument: files.length > 0 ? Math.round((sectionsTotal / files.length) * 100) / 100 : 0,
  averageSectionLength: sectionsTotal > 0 ? Math.round(totalSectionLength / sectionsTotal) : 0,
  documents: metrics,
  warnings: reportWarnings
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

for (const warning of reportWarnings) {
  console.warn(`WARN ${warning}`);
}

console.log(`Split ${files.length} document(s) into ${sectionsTotal} section(s).`);
console.log(`Wrote src/content/generated/split-report.json.`);

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';

import { PDFParse } from 'pdf-parse';

import type { SourceDocument } from '../src/lib/content/types';

type ExtractionStatus = NonNullable<SourceDocument['extractionStatus']>;

interface ExtractionReportEntry {
  documentSlug: string;
  sourcePath: string;
  outputPath?: string;
  status: ExtractionStatus;
  method: 'text' | 'markdown' | 'pdf' | 'pdf_txt_override' | 'unsupported' | 'missing_source';
  characterCount: number;
  error?: string;
}

interface ExtractionReport {
  generatedAt: string;
  documentsTotal: number;
  extracted: number;
  failed: number;
  unsupported: number;
  entries: ExtractionReportEntry[];
}

const root = process.cwd();
const documentsPath = join(root, 'src/content/documents/documents.json');
const outputDir = join(root, 'src/content/generated/extracted');
const reportPath = join(root, 'src/content/generated/extraction-report.json');

if (process.env.NETLIFY === 'true') {
  console.log('Skipping text extraction on Netlify.');
  process.exit(0);
}

function readDocuments(): SourceDocument[] {
  return JSON.parse(readFileSync(documentsPath, 'utf8')) as SourceDocument[];
}

function relativePath(path: string): string {
  return path.replace(`${root}/`, '');
}

function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[\t ]+\n/g, '\n').trim();
}

function textOverridePath(document: SourceDocument, sourcePath: string): string | undefined {
  const dir = dirname(sourcePath);
  const baseNamePath = join(dir, `${basename(sourcePath, extname(sourcePath))}.txt`);
  const slugPath = join(dir, `${document.slug}.txt`);

  if (existsSync(slugPath)) {
    return slugPath;
  }

  if (existsSync(baseNamePath)) {
    return baseNamePath;
  }

  return undefined;
}

async function extractPdfText(path: string): Promise<string> {
  const parser = new PDFParse({ data: readFileSync(path) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocument(document: SourceDocument): Promise<ExtractionReportEntry> {
  const sourcePath = join(root, document.sourcePath);
  const extension = extname(document.fileName).toLowerCase();
  const outputPath = join(outputDir, `${document.slug}.txt`);

  if (!existsSync(sourcePath)) {
    return {
      documentSlug: document.slug,
      sourcePath: document.sourcePath,
      status: 'failed',
      method: 'missing_source',
      characterCount: 0,
      error: `Source file not found: ${document.sourcePath}`
    };
  }

  try {
    let text = '';
    let method: ExtractionReportEntry['method'];

    if (extension === '.txt') {
      text = readFileSync(sourcePath, 'utf8');
      method = 'text';
    } else if (extension === '.md') {
      text = readFileSync(sourcePath, 'utf8');
      method = 'markdown';
    } else if (extension === '.pdf') {
      const overridePath = textOverridePath(document, sourcePath);

      if (overridePath) {
        text = readFileSync(overridePath, 'utf8');
        method = 'pdf_txt_override';
      } else {
        text = await extractPdfText(sourcePath);
        method = 'pdf';
      }
    } else {
      return {
        documentSlug: document.slug,
        sourcePath: document.sourcePath,
        status: 'unsupported',
        method: 'unsupported',
        characterCount: 0,
        error: `Unsupported extension: ${extension || 'none'}`
      };
    }

    const normalizedText = normalizeText(text);

    if (normalizedText.length === 0) {
      return {
        documentSlug: document.slug,
        sourcePath: document.sourcePath,
        status: 'partial',
        method,
        characterCount: 0,
        error: 'No extractable text found'
      };
    }

    writeFileSync(outputPath, `${normalizedText}\n`);

    return {
      documentSlug: document.slug,
      sourcePath: document.sourcePath,
      outputPath: relativePath(outputPath),
      status: 'ok',
      method,
      characterCount: normalizedText.length
    };
  } catch (error) {
    return {
      documentSlug: document.slug,
      sourcePath: document.sourcePath,
      status: 'failed',
      method: extension === '.pdf' ? 'pdf' : 'unsupported',
      characterCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const documents = readDocuments();
const processedAt = new Date().toISOString();
const entries: ExtractionReportEntry[] = [];
const updatedDocuments: SourceDocument[] = [];

mkdirSync(outputDir, { recursive: true });

for (const document of documents) {
  const entry = await extractDocument(document);

  entries.push(entry);
  updatedDocuments.push({
    ...document,
    extractionStatus: entry.status,
    ...(entry.error ? { extractionError: entry.error } : { extractionError: undefined }),
    lastProcessedAt: processedAt
  });
}

const report: ExtractionReport = {
  generatedAt: processedAt,
  documentsTotal: entries.length,
  extracted: entries.filter((entry) => entry.status === 'ok').length,
  failed: entries.filter((entry) => entry.status === 'failed').length,
  unsupported: entries.filter((entry) => entry.status === 'unsupported').length,
  entries
};

writeFileSync(documentsPath, `${JSON.stringify(updatedDocuments, null, 2)}\n`);
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Extracted ${report.extracted}/${report.documentsTotal} document(s).`);
console.log(`Failed ${report.failed} document(s), unsupported ${report.unsupported} document(s).`);
console.log(`Wrote ${relativePath(reportPath)}.`);

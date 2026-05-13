import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface StageReport {
  name: string;
  command: string;
  success: boolean;
  durationMs: number;
  warnings: string[];
  error?: string;
}

interface PipelineSummary {
  documents: {
    total: number;
    extracted: number;
    extractionFailed: number;
    needsReview: number;
  };
  sections: {
    total: number;
    averageLength: number;
  };
  references: {
    total: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}

interface PipelineReport {
  generatedAt: string;
  durationMs: number;
  stages: StageReport[];
  success: boolean;
  warnings: string[];
  summary: PipelineSummary;
}

type JsonRecord = Record<string, unknown>;

const root = process.cwd();
const reportPath = join(root, 'src/content/generated/pipeline-report.json');
const documentsPath = join(root, 'src/content/documents/documents.json');
const extractionReportPath = join(root, 'src/content/generated/extraction-report.json');
const splitReportPath = join(root, 'src/content/generated/split-report.json');
const referencesPath = join(root, 'src/content/generated/topic-references.json');
const stages = [
  { name: 'ingest', command: 'npm run ingest' },
  { name: 'extract', command: 'npm run extract' },
  { name: 'split', command: 'npm run split' },
  { name: 'build:index', command: 'npm run build:index' },
  { name: 'validate:content', command: 'npm run validate:content' }
];

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) {
    return fallback;
  }

  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberField(record: JsonRecord, field: string): number {
  return typeof record[field] === 'number' ? record[field] : 0;
}

function warningLines(output: string): string[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('WARN '))
    .map((line) => line.replace(/^WARN\s+/, ''));
}

function runStage(name: string, command: string): StageReport {
  const startedAt = Date.now();
  const [executable, ...args] = command.split(' ');
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: 'utf8'
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';

  if (stdout.trim()) {
    process.stdout.write(stdout);
  }

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }

  return {
    name,
    command,
    success: result.status === 0,
    durationMs: Date.now() - startedAt,
    warnings: warningLines(`${stdout}\n${stderr}`),
    ...(result.status === 0
      ? {}
      : { error: stderr.trim() || stdout.trim() || `Command exited with status ${String(result.status)}` })
  };
}

function buildSummary(): PipelineSummary {
  const documents = readJson<JsonRecord[]>(documentsPath, []);
  const extractionReport = readJson<JsonRecord>(extractionReportPath, {});
  const splitReport = readJson<JsonRecord>(splitReportPath, {});
  const references = readJson<{ references?: JsonRecord[] }>(referencesPath, { references: [] }).references ?? [];

  return {
    documents: {
      total: documents.length,
      extracted: numberField(extractionReport, 'extracted'),
      extractionFailed: numberField(extractionReport, 'failed'),
      needsReview: documents.filter((document) => isRecord(document) && document.needsReview === true).length
    },
    sections: {
      total: numberField(splitReport, 'sectionsTotal'),
      averageLength: numberField(splitReport, 'averageSectionLength')
    },
    references: {
      total: references.length,
      highConfidence: references.filter((reference) => reference.confidence === 'high').length,
      mediumConfidence: references.filter((reference) => reference.confidence === 'medium').length,
      lowConfidence: references.filter((reference) => reference.confidence === 'low').length
    }
  };
}

function writeReport(report: PipelineReport): void {
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

const startedAt = Date.now();
const stageReports: StageReport[] = [];
let success = true;

for (const stage of stages) {
  console.log(`\n== ${stage.command} ==`);
  const result = runStage(stage.name, stage.command);
  stageReports.push(result);

  if (!result.success) {
    success = false;
    break;
  }
}

const report: PipelineReport = {
  generatedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  stages: stageReports,
  success,
  warnings: stageReports.flatMap((stage) => stage.warnings).slice(0, 50),
  summary: buildSummary()
};

writeReport(report);

console.log(`\nWrote src/content/generated/pipeline-report.json.`);

if (!success) {
  process.exit(1);
}

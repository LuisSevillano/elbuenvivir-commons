import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ExtractedSection, GeneratedTopicReference, SourceDocument, TaxonomyTopic } from '../src/lib/content/types';

interface WeightedTerm {
  term: string;
  normalizedTerm: string;
  weight: number;
  source: 'keyword' | 'alias';
}

interface TermMatch {
  term: string;
  weightedScore: number;
  matches: number;
}

interface ScoredReference extends GeneratedTopicReference {
  score: number;
  sectionOrder: number;
  rawScore: number;
  matchedTerms: TermMatch[];
}

interface TopicIndexReportEntry {
  topicSlug: string;
  references: number;
  candidates: number;
  topKeywords: { term: string; hits: number; weightedScore: number }[];
  noiseWarning?: string;
}

interface TopicIndexReport {
  generatedAt: string;
  referencesTotal: number;
  maxReferencesPerTopic: number;
  maxReferencesPerDocumentPerTopic: number;
  minimumScore: number;
  referencesByTopic: TopicIndexReportEntry[];
  noisyTopics: string[];
  topicsWithoutReferences: string[];
}

const root = process.cwd();
const taxonomyPath = join(root, 'taxonomy/topics.json');
const documentsPath = join(root, 'src/content/documents/documents.json');
const sectionsDir = join(root, 'src/content/generated/sections');
const referencesPath = join(root, 'src/content/generated/topic-references.json');
const reportPath = join(root, 'src/content/generated/topic-index-report.json');
const minimumScore = 8;
const maxReferencesPerTopic = 18;
const maxReferencesPerDocumentPerTopic = 3;
const noiseCandidateMultiplier = 5;
const excerptLength = 420;
const shortSectionThreshold = 180;
const longSectionThreshold = 20_000;

const stopwords = new Set([
  'acta',
  'acuerdo',
  'acuerdos',
  'administracion',
  'articulo',
  'asamblea',
  'capitulo',
  'cooperativa',
  'cooperativas',
  'derecho',
  'derechos',
  'disposicion',
  'estatuto',
  'estatutos',
  'general',
  'inscripcion',
  'junta',
  'ley',
  'norma',
  'normas',
  'obligacion',
  'obligaciones',
  'persona',
  'personas',
  'regimen',
  'registro',
  'reglamento',
  'seccion',
  'social',
  'sociedad',
  'socio',
  'socia',
  'socias',
  'socios'
]);

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function cleanText(value: string): string {
  return normalize(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[^a-z0-9ñç\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWeakTerm(term: string): boolean {
  const normalizedTerm = cleanText(term);
  return !normalizedTerm.includes(' ') && stopwords.has(normalizedTerm);
}

function countTerm(text: string, term: string): number {
  if (term.length < 3 || isWeakTerm(term)) {
    return 0;
  }

  const pattern = new RegExp(`(^|\\W)${escapeRegExp(cleanText(term))}($|\\W)`, 'g');
  return [...text.matchAll(pattern)].length;
}

function keywordWeight(topic: TaxonomyTopic, keyword: string, fallback: number): number {
  return topic.keywordWeights?.[keyword] ?? topic.keywordWeights?.[cleanText(keyword)] ?? fallback;
}

function termsFor(topic: TaxonomyTopic): WeightedTerm[] {
  const terms = new Map<string, WeightedTerm>();

  for (const keyword of topic.keywords ?? []) {
    const normalizedTerm = cleanText(keyword);

    if (normalizedTerm.length < 3 || isWeakTerm(keyword)) {
      continue;
    }

    const fallbackWeight = normalizedTerm.includes(' ') ? 5 : 2;
    const weight = keywordWeight(topic, keyword, fallbackWeight);
    const existing = terms.get(normalizedTerm);

    if (!existing || weight > existing.weight) {
      terms.set(normalizedTerm, { term: keyword, normalizedTerm, weight, source: 'keyword' });
    }
  }

  for (const alias of topic.aliases ?? []) {
    const normalizedTerm = cleanText(alias);

    if (normalizedTerm.length < 3 || isWeakTerm(alias)) {
      continue;
    }
    const fallbackWeight = normalizedTerm.includes(' ') ? 4 : 2;
    const weight = keywordWeight(topic, alias, fallbackWeight);
    const existing = terms.get(normalizedTerm);

    if (!existing || weight > existing.weight) {
      terms.set(normalizedTerm, { term: alias, normalizedTerm, weight, source: 'alias' });
    }
  }

  return [...terms.values()];
}

function negativeTermsFor(topic: TaxonomyTopic): string[] {
  return (topic.negativeKeywords ?? []).map(cleanText).filter((term) => term.length >= 3);
}

function lengthMultiplier(section: ExtractedSection): number {
  const length = section.text.length;

  if (length < shortSectionThreshold) {
    return 0.55;
  }

  if (length > longSectionThreshold) {
    return 0.55;
  }

  if (length > 10_000) {
    return 0.75;
  }

  return 1;
}

function scoreSection(
  section: ExtractedSection,
  terms: WeightedTerm[],
  negativeTerms: string[]
): { score: number; rawScore: number; matchedTerms: TermMatch[] } {
  const heading = cleanText(section.heading);
  const text = cleanText(section.text);
  const matchedTerms: TermMatch[] = [];
  let rawScore = 0;

  for (const term of terms) {
    const headingMatches = countTerm(heading, term.normalizedTerm);
    const textMatches = countTerm(text, term.normalizedTerm);
    const matches = headingMatches + textMatches;

    if (matches === 0) {
      continue;
    }

    const weightedScore = headingMatches * term.weight * 4 + Math.min(textMatches, 6) * term.weight;
    rawScore += weightedScore;
    matchedTerms.push({ term: term.term, weightedScore, matches });
  }

  const negativePenalty = negativeTerms.reduce((total, term) => total + Math.min(countTerm(text, term), 4) * 4, 0);
  const score = Math.max(0, Math.round((rawScore - negativePenalty) * lengthMultiplier(section)));

  return {
    score,
    rawScore,
    matchedTerms: matchedTerms.toSorted((a, b) => b.weightedScore - a.weightedScore)
  };
}

function confidenceRank(confidence: GeneratedTopicReference['confidence']): number {
  return { high: 3, medium: 2, low: 1 }[confidence];
}

function confidenceFor(score: number): GeneratedTopicReference['confidence'] {
  if (score >= 24) {
    return 'high';
  }

  if (score >= 14) {
    return 'medium';
  }

  return 'low';
}

function excerptFor(section: ExtractedSection, terms: WeightedTerm[]): string {
  const text = section.text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedText = normalize(text);
  const firstMatch = terms
    .map(({ normalizedTerm }) => normalizedTerm)
    .filter((term) => term.length >= 3)
    .map((term) => normalizedText.indexOf(term))
    .filter((index) => index >= 0)
    .toSorted((a, b) => a - b)[0];
  const start = firstMatch === undefined ? 0 : Math.max(0, firstMatch - 120);
  const excerpt = text.slice(start, start + excerptLength).trim();

  return `${start > 0 ? '...' : ''}${excerpt}${start + excerptLength < text.length ? '...' : ''}`;
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

function dedupeKey(reference: ScoredReference): string {
  const normalizedExcerpt = cleanText(reference.excerpt)
    .split(' ')
    .filter((word) => !stopwords.has(word))
    .slice(0, 28)
    .join(' ');

  return `${reference.topicSlug}:${reference.documentSlug}:${normalizedExcerpt}`;
}

function limitPerDocument(references: ScoredReference[]): ScoredReference[] {
  const counts = new Map<string, number>();

  return references.filter((reference) => {
    const currentCount = counts.get(reference.documentSlug) ?? 0;

    if (currentCount >= maxReferencesPerDocumentPerTopic) {
      return false;
    }

    counts.set(reference.documentSlug, currentCount + 1);
    return true;
  });
}

function topKeywordReport(references: ScoredReference[]): TopicIndexReportEntry['topKeywords'] {
  const totals = new Map<string, { hits: number; weightedScore: number }>();

  for (const reference of references) {
    for (const matchedTerm of reference.matchedTerms) {
      const current = totals.get(matchedTerm.term) ?? { hits: 0, weightedScore: 0 };
      current.hits += matchedTerm.matches;
      current.weightedScore += matchedTerm.weightedScore;
      totals.set(matchedTerm.term, current);
    }
  }

  return [...totals.entries()]
    .map(([term, value]) => ({ term, ...value }))
    .toSorted((a, b) => b.weightedScore - a.weightedScore || b.hits - a.hits)
    .slice(0, 8);
}

const taxonomy = readJson<TaxonomyTopic[]>(taxonomyPath).filter((topic) => topic.status !== 'merged');
const documents = readJson<SourceDocument[]>(documentsPath);
const documentsBySlug = new Map(documents.map((document) => [document.slug, document]));
const sections = readSections();
const references: ScoredReference[] = [];
const reportEntries: TopicIndexReportEntry[] = [];

for (const topic of taxonomy) {
  const terms = termsFor(topic);
  const negativeTerms = negativeTermsFor(topic);

  if (terms.length === 0) {
    reportEntries.push({ topicSlug: topic.slug, references: 0, candidates: 0, topKeywords: [] });
    continue;
  }

  const candidates = sections
    .map((section) => ({ section, ...scoreSection(section, terms, negativeTerms) }))
    .filter(({ score }) => score >= minimumScore)
    .map(({ section, score, rawScore, matchedTerms }): ScoredReference | undefined => {
      const document = documentsBySlug.get(section.documentSlug);

      if (!document) {
        return undefined;
      }

      return {
        topicSlug: topic.slug,
        documentSlug: document.slug,
        ...(document.projectName ? { projectName: document.projectName } : {}),
        documentTitle: document.title,
        documentType: document.type,
        articleOrSection: section.heading,
        excerpt: excerptFor(section, terms),
        sourcePath: document.sourcePath,
        tags: [...new Set([...document.tags, topic.category])].toSorted(),
        confidence: confidenceFor(score),
        reviewStatus: 'auto',
        score,
        sectionOrder: section.order,
        rawScore,
        matchedTerms
      };
    })
    .filter((reference): reference is ScoredReference => reference !== undefined)
    .toSorted(
      (a, b) =>
        confidenceRank(b.confidence) - confidenceRank(a.confidence) ||
        b.score - a.score ||
        a.documentSlug.localeCompare(b.documentSlug, 'es') ||
        a.sectionOrder - b.sectionOrder
    );
  const seen = new Set<string>();
  const deduped = candidates.filter((reference) => {
    const key = dedupeKey(reference);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
  const selected = limitPerDocument(deduped).slice(0, maxReferencesPerTopic);
  const noiseWarning = candidates.length > maxReferencesPerTopic * noiseCandidateMultiplier
    ? `High candidate volume (${candidates.length}) before filtering`
    : undefined;

  references.push(...selected);
  reportEntries.push({
    topicSlug: topic.slug,
    references: selected.length,
    candidates: candidates.length,
    topKeywords: topKeywordReport(selected),
    ...(noiseWarning ? { noiseWarning } : {})
  });
}

const outputReferences: GeneratedTopicReference[] = references
  .toSorted(
    (a, b) =>
      a.topicSlug.localeCompare(b.topicSlug, 'es') ||
      confidenceRank(b.confidence) - confidenceRank(a.confidence) ||
      b.score - a.score
  )
  .map(({ sectionOrder: _sectionOrder, rawScore: _rawScore, matchedTerms: _matchedTerms, ...reference }) => reference);
const report: TopicIndexReport = {
  generatedAt: new Date().toISOString(),
  referencesTotal: outputReferences.length,
  maxReferencesPerTopic,
  maxReferencesPerDocumentPerTopic,
  minimumScore,
  referencesByTopic: reportEntries,
  noisyTopics: reportEntries.filter((entry) => entry.noiseWarning).map((entry) => entry.topicSlug),
  topicsWithoutReferences: reportEntries.filter((entry) => entry.references === 0).map((entry) => entry.topicSlug)
};

writeFileSync(referencesPath, `${JSON.stringify({ references: outputReferences }, null, 2)}\n`);
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Generated ${outputReferences.length} automatic topic reference(s).`);
console.log(`Wrote src/content/generated/topic-references.json.`);
console.log(`Wrote src/content/generated/topic-index-report.json.`);

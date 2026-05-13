import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ExtractedSection, GeneratedTopicReference, SourceDocument, TaxonomyTopic } from '../src/lib/content/types';

interface ScoredReference extends GeneratedTopicReference {
  score: number;
  sectionOrder: number;
}

const root = process.cwd();
const taxonomyPath = join(root, 'taxonomy/topics.json');
const documentsPath = join(root, 'src/content/documents/documents.json');
const sectionsDir = join(root, 'src/content/generated/sections');
const referencesPath = join(root, 'src/content/generated/topic-references.json');
const minimumScore = 5;
const maxReferencesPerTopic = 30;
const excerptLength = 420;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countTerm(text: string, term: string): number {
  const normalizedTerm = normalize(term).trim();

  if (normalizedTerm.length < 3) {
    return 0;
  }

  const pattern = new RegExp(`(^|\\W)${escapeRegExp(normalizedTerm)}($|\\W)`, 'g');
  return [...text.matchAll(pattern)].length;
}

function termsFor(topic: TaxonomyTopic): { term: string; weight: number }[] {
  const terms = new Map<string, number>();

  for (const keyword of topic.keywords ?? []) {
    terms.set(keyword, Math.max(terms.get(keyword) ?? 0, keyword.includes(' ') ? 4 : 2));
  }

  for (const alias of topic.aliases ?? []) {
    terms.set(alias, Math.max(terms.get(alias) ?? 0, alias.includes(' ') ? 3 : 2));
  }

  return [...terms.entries()].map(([term, weight]) => ({ term, weight }));
}

function scoreSection(section: ExtractedSection, terms: { term: string; weight: number }[]): number {
  const heading = normalize(section.heading);
  const text = normalize(section.text);
  let score = 0;

  for (const { term, weight } of terms) {
    const headingMatches = countTerm(heading, term);
    const textMatches = countTerm(text, term);
    score += headingMatches * weight * 3;
    score += Math.min(textMatches, 8) * weight;
  }

  return score;
}

function confidenceFor(score: number): GeneratedTopicReference['confidence'] {
  if (score >= 18) {
    return 'high';
  }

  if (score >= 10) {
    return 'medium';
  }

  return 'low';
}

function excerptFor(section: ExtractedSection, terms: { term: string; weight: number }[]): string {
  const text = section.text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedText = normalize(text);
  const firstMatch = terms
    .map(({ term }) => normalize(term).trim())
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

const taxonomy = readJson<TaxonomyTopic[]>(taxonomyPath).filter((topic) => topic.status !== 'merged');
const documents = readJson<SourceDocument[]>(documentsPath);
const documentsBySlug = new Map(documents.map((document) => [document.slug, document]));
const sections = readSections();
const references: ScoredReference[] = [];

for (const topic of taxonomy) {
  const terms = termsFor(topic);

  if (terms.length === 0) {
    continue;
  }

  const scoredTopicReferences = sections
    .map((section) => ({ section, score: scoreSection(section, terms) }))
    .filter(({ score }) => score >= minimumScore)
    .map(({ section, score }): ScoredReference | undefined => {
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
        sectionOrder: section.order
      };
    })
    .filter((reference): reference is ScoredReference => reference !== undefined)
    .toSorted((a, b) => b.score - a.score || a.documentSlug.localeCompare(b.documentSlug, 'es') || a.sectionOrder - b.sectionOrder)
    .slice(0, maxReferencesPerTopic);

  references.push(...scoredTopicReferences);
}

const outputReferences: GeneratedTopicReference[] = references
  .toSorted((a, b) => a.topicSlug.localeCompare(b.topicSlug, 'es') || b.score - a.score)
  .map(({ score: _score, sectionOrder: _sectionOrder, ...reference }) => reference);

writeFileSync(referencesPath, `${JSON.stringify({ references: outputReferences }, null, 2)}\n`);

console.log(`Generated ${outputReferences.length} automatic topic reference(s).`);
console.log(`Wrote src/content/generated/topic-references.json.`);

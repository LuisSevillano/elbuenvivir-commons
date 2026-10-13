import decisionsData from '$content/decisions/rri.json';
import rriData from '$content/consolidated/rri.json';

export type RriArticleStatus = 'current' | 'pending';
export type RriDecisionStatus = 'approved' | 'pending' | 'legal_review' | 'transitional' | 'discarded';

export interface RriDecision {
  id: string;
  status: RriDecisionStatus;
  scope: 'rri' | 'operations';
  summary: string;
  source: string;
}

export interface RriArticle {
  id: string;
  number: number;
  title: string;
  status: RriArticleStatus;
  paragraphs: string[];
  pendingItems?: string[];
  decisionIds: string[];
  topicSlugs: string[];
}

export interface RriChapter {
  id: string;
  number: string;
  title: string;
  articles: RriArticle[];
}

export interface RriDraft {
  title: string;
  preambleTitle: string;
  preamble: string[];
  chapters: RriChapter[];
}

const allowedDecisionStatuses = new Set<RriDecisionStatus>([
  'approved',
  'pending',
  'legal_review',
  'transitional',
  'discarded'
]);
const allowedArticleStatuses = new Set<RriArticleStatus>(['current', 'pending']);

function validateRriDraft(draft: RriDraft, decisions: RriDecision[]): void {
  const decisionMap = new Map(decisions.map((decision) => [decision.id, decision]));
  const chapterIds = new Set<string>();
  const chapterNumbers = new Set<string>();
  const articleIds = new Set<string>();
  const articleNumbers = new Set<number>();

  for (const decision of decisions) {
    if (!allowedDecisionStatuses.has(decision.status)) {
      throw new Error(`Estado de decisión RRI no válido: ${decision.id}`);
    }
  }

  for (const chapter of draft.chapters) {
    if (chapterIds.has(chapter.id)) throw new Error(`Capítulo RRI duplicado: ${chapter.id}`);
    if (chapterNumbers.has(chapter.number)) throw new Error(`Número de capítulo RRI duplicado: ${chapter.number}`);
    chapterIds.add(chapter.id);
    chapterNumbers.add(chapter.number);

    for (const article of chapter.articles) {
      if (articleIds.has(article.id)) throw new Error(`Artículo RRI duplicado: ${article.id}`);
      if (articleNumbers.has(article.number)) throw new Error(`Número de artículo RRI duplicado: ${article.number}`);
      if (!allowedArticleStatuses.has(article.status)) {
        throw new Error(`Estado de artículo RRI no válido: ${article.id}`);
      }
      if (article.status === 'pending' && !article.pendingItems?.length) {
        throw new Error(`El artículo pendiente ${article.id} debe explicar qué falta por decidir`);
      }

      articleIds.add(article.id);
      articleNumbers.add(article.number);

      for (const decisionId of article.decisionIds) {
        const decision = decisionMap.get(decisionId);
        if (!decision) throw new Error(`Decisión RRI desconocida: ${decisionId}`);
        if (decision.status === 'discarded') {
          throw new Error(`Una decisión descartada no puede aparecer en el borrador: ${decisionId}`);
        }
        if (decision.status === 'transitional') {
          throw new Error(`Un acuerdo transitorio no puede convertirse en artículo del RRI: ${decisionId}`);
        }
        if ((decision.status === 'pending' || decision.status === 'legal_review') && article.status !== 'pending') {
          throw new Error(`El artículo ${article.id} debe figurar como pendiente por la decisión ${decisionId}`);
        }
      }
    }
  }

  const orderedNumbers = [...articleNumbers].toSorted((a, b) => a - b);
  orderedNumbers.forEach((number, index) => {
    if (number !== index + 1) throw new Error(`La numeración del RRI salta del artículo ${index} al ${number}`);
  });
}

export function loadRriDraft(): RriDraft {
  const draft = rriData as RriDraft;
  const decisions = (decisionsData as { decisions: RriDecision[] }).decisions;
  validateRriDraft(draft, decisions);
  return draft;
}

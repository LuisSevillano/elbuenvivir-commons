import type { ConsultableTopic, ValidatedTopicStatus } from './types';

export const publicEditorialStatuses: ValidatedTopicStatus[] = [
  'reviewed',
  'exploratory',
  'insufficient_evidence',
  'evidencia_insuficiente'
];

export const editorialPolicy = {
  reviewed: {
    requirement: 'Validated topic with substantive editorial review.',
    publicUse: 'Can guide decisions with prudent recommendations and document traceability.'
  },
  exploratory: {
    requirement: 'Curated topic or explicit editorial review.',
    publicUse: 'Can open questions and show provisional indications, not conclusions.'
  },
  insufficient_evidence: {
    requirement: 'Editorial review concludes that the current corpus is not enough.',
    publicUse: 'Can only show limits, open questions and what not to conclude.'
  },
  hidden: {
    requirement: 'Generated-only or not editorially admitted.',
    publicUse: 'Not part of the public product.'
  }
} as const;

export function isPublicEditorialStatus(status: ValidatedTopicStatus): boolean {
  return publicEditorialStatuses.includes(status);
}

export function canShowDecisionModels(topic: ConsultableTopic): boolean {
  return topic.editorialStatus === 'reviewed';
}

export function canShowSuggestedClauses(topic: ConsultableTopic): boolean {
  return topic.editorialStatus === 'reviewed';
}

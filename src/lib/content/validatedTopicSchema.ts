import type { ValidatedTopicStatus } from './types';

export const validatedTopicStatuses = ['reviewed', 'exploratory', 'insufficient_evidence'] as const;

export const validatedTopicStatusLabels: Record<ValidatedTopicStatus, string> = {
  reviewed: 'Revisado',
  exploratory: 'Exploratorio',
  insufficient_evidence: 'Evidencia insuficiente'
};

export const validatedTopicSchema = {
  status: validatedTopicStatuses,
  editorialSummary: 'string[]',
  decisionQuestions: 'Array<string | { id?, question, whyItMatters?, detectedApproaches?, recommendationsForBuenVivir? }>',
  supportedFindings: 'Array<{ id?, statement, summary?, references? }>',
  unsupportedClaims: 'Array<{ id?, claimId?, statement?, reason?, decisionQuestionIds?, approachNames?, referenceIds? }>',
  recommendationsForBuenVivir: 'string[]',
  statutesVsRRI: '{ statutes: string[], rri: string[], notes?: string[] }',
  referencesToUse: 'string[]',
  referencesToAvoid: 'string[]'
} as const;

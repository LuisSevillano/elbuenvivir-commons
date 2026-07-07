export type DocumentType = 'ley' | 'estatutos' | 'rri' | 'guia' | 'modelo' | 'otro';

export type TopicCategory =
  | 'identidad_juridica'
  | 'socios'
  | 'economico'
  | 'gobernanza'
  | 'convivencia'
  | 'uso_espacios'
  | 'disciplina'
  | 'cuidados'
  | 'ciclo_vida'
  | 'legal'
  | 'otros';

export type TopicStatus = 'draft' | 'reviewed' | 'needs_legal_review';
export type ReviewStatus = 'auto' | 'reviewed' | 'rejected';
export type Confidence = 'high' | 'medium' | 'low';
export type EvidenceLevel = 'high' | 'medium' | 'low';
export type ValidatedTopicStatus = 'reviewed' | 'exploratory' | 'insufficient_evidence' | 'evidencia_insuficiente' | 'hidden';

export interface SourceDocument {
  slug: string;
  title: string;
  fileName: string;
  sourcePath: string;
  type: DocumentType;
  projectName?: string;
  jurisdiction?: string;
  year?: number;
  language?: 'es' | 'ca' | 'gl' | 'eu' | 'en';
  tags: string[];
  notes?: string;
  originalUrl?: string;
  googleDriveFileId?: string;
  googleDriveUrl?: string;
  previewUrl?: string;
  ingestionStatus?: 'pending' | 'ok' | 'needs_review';
  extractionStatus?: 'not_started' | 'ok' | 'partial' | 'failed' | 'unsupported';
  extractionError?: string;
  contentHash?: string;
  lastProcessedAt?: string;
  needsReview?: boolean;
}

export interface SuggestedClause {
  text: string;
  disclaimer: string;
  status: 'placeholder' | 'draft' | 'reviewed' | 'needs_legal_review';
}

export interface SourceRef {
  documentSlug: string;
  sourcePath: string;
  page?: number;
  pageRange?: string;
  articleOrSection?: string;
  excerpt?: string;
  confidence?: Confidence;
  reviewStatus?: ReviewStatus;
}

export interface LegalBasis extends SourceRef {
  title: string;
  summary: string;
}

export interface ProjectReference extends SourceRef {
  projectName: string;
  documentTitle: string;
  documentType: DocumentType;
  summary: string;
  excerpt: string;
  tags: string[];
}

export interface LegalRequirementRow {
  aspect: string;
  law: string;
  requirement: string;
  margin?: string;
}

export interface DossierCitation {
  documentSlug: string;
  label: string;
  excerpt: string;
}

export interface ComparisonColumn {
  key: string;
  label: string;
}

export interface ComparisonRow {
  project: string;
  cells: Record<string, string>;
  note?: string;
  /** Verbatim clause text from the project's estatutos/RRI, so it can be read directly. */
  excerpt?: string;
  /** Article or section the excerpt comes from, e.g. "Artículo 13 — Baja obligatoria". */
  articleOrSection?: string;
  /** Document slug to link to the full source document (e.g. docs-estatutos-estatutos-axuntase). */
  documentSlug?: string;
}

export interface ProposalArticle {
  target: 'estatutos' | 'rri';
  heading: string;
  text: string;
  note?: string;
}

/**
 * Structured "at a glance" dossier for a topic: what the law requires,
 * how other cooperatives resolved it, and a tailored drafting proposal.
 */
export interface TopicDossier {
  legal: {
    intro: string[];
    requirements: LegalRequirementRow[];
    citations?: DossierCitation[];
  };
  comparison: {
    intro?: string;
    columns: ComparisonColumn[];
    rows: ComparisonRow[];
    note?: string;
  };
  proposal: {
    rationale: string[];
    articles: ProposalArticle[];
    openDecisions: string[];
    disclaimer: string;
  };
}

export interface GovernanceTopic {
  slug: string;
  title: string;
  shortDescription: string;
  category: TopicCategory;
  minimumContents: string[];
  legalBasis: LegalBasis[];
  projectReferences: ProjectReference[];
  decisionsForBuenVivir: string[];
  risks: string[];
  dossier?: TopicDossier;
  governancePlacement: {
    recommendedPrimaryLocation: 'estatutos' | 'rri' | 'mixed' | 'case_by_case';
    rationale: string[];
    shouldBeInStatutes: string[];
    shouldBeInRRI: string[];
    canBeDeferredInitially?: string[];
    risksIfPlacedInStatutes?: string[];
    risksIfPlacedInRRI?: string[];
  };
  relatedTopics?: {
    topicSlug: string;
    relationship: 'develops' | 'depends_on' | 'complements' | 'limits' | 'operationalizes';
    explanation?: string;
  }[];
  suggestedClause?: SuggestedClause;
  status: TopicStatus;
}

export interface ConsultableTopic extends GovernanceTopic {
  aliases: string[];
  availability: {
    hasCuratedTopic: boolean;
    hasSynthesis: boolean;
    hasReferences: boolean;
    hasResearchPack: boolean;
    hasEditorialReview: boolean;
    hasValidatedTopic: boolean;
  };
  availabilityBadge: 'Análisis amplio' | 'Análisis disponible' | 'Información limitada' | 'Pocas referencias';
  editorialStatus: ValidatedTopicStatus;
  referenceCount: number;
  documentCount: number;
  projectCount: number;
}

export interface SolutionApproach {
  name: string;
  summary: string;
  characteristics: string[];
  advantages: string[];
  risks: string[];
  suitableFor: string[];
  detectedInProjects: string[];
  evidenceLevel: EvidenceLevel;
}

export interface DecisionQuestion {
  id: string;
  question: string;
  whyItMatters: string[];
  detectedApproaches: SolutionApproach[];
  commonTradeoffs: string[];
  recommendationsForBuenVivir: string[];
  relatedExtracts: string[];
  relatedProjects: string[];
  suggestedPlacement: {
    statutes: string[];
    rri: string[];
  };
}

export interface DecisionModelExtract {
  id: string;
  documentSlug: string;
  documentTitle: string;
  documentType: DocumentType;
  projectName?: string;
  sourcePath: string;
  articleOrSection?: string;
  excerpt: string;
  matchedConcepts: string[];
  score: number;
}

export interface TopicDecisionModel {
  topicSlug: string;
  generatedAt: string;
  decisionQuestions: DecisionQuestion[];
  practicalPatterns: string[];
  commonTradeoffs: string[];
  frequentRisks: string[];
  recommendationsForBuenVivir: string[];
  suggestedPlacement: {
    statutes: string[];
    rri: string[];
  };
  relevantProjects: string[];
  extracts: DecisionModelExtract[];
  limits: string[];
}

export interface ValidatedDecisionQuestion {
  id?: string;
  question: string;
  whyItMatters?: string[];
  detectedApproaches?: SolutionApproach[];
  commonTradeoffs?: string[];
  recommendationsForBuenVivir?: string[];
  relatedExtracts?: string[];
  relatedProjects?: string[];
  suggestedPlacement?: {
    statutes?: string[];
    rri?: string[];
  };
}

export interface ValidatedFinding {
  id?: string;
  statement: string;
  summary?: string;
  references?: string[];
}

export interface UnsupportedClaim {
  id?: string;
  claimId?: string;
  statement?: string;
  reason?: string;
  decisionQuestionIds?: string[];
  approachNames?: string[];
  referenceIds?: string[];
}

export interface ValidatedTopic {
  slug: string;
  status: ValidatedTopicStatus;
  editorialSummary: string[];
  decisionQuestions: Array<string | ValidatedDecisionQuestion>;
  supportedFindings: ValidatedFinding[];
  unsupportedClaims: UnsupportedClaim[];
  recommendationsForBuenVivir: string[];
  statutesVsRRI: {
    statutes: string[];
    rri: string[];
    notes?: string[];
  };
  referencesToUse: string[];
  referencesToAvoid: string[];
}

export interface EditorialReview {
  slug: string;
  content: string;
}

export interface GeneratedTopicDraft extends GovernanceTopic {
  draftStatus: 'generated_not_curated';
  generatedFrom?: {
    generated: true;
    curated: false;
    sourceResearchPack: string;
    evidenceCount: number;
    highConfidenceEvidence: number;
    mediumConfidenceEvidence: number;
    lowConfidenceEvidence: number;
    evidence: {
      documentSlug: string;
      documentTitle: string;
      documentType: DocumentType | string;
      articleOrSection?: string;
      confidence?: Confidence | string;
      excerpt: string;
    }[];
  };
}

export interface GeneratedTopicSynthesis {
  slug: string;
  generatedAt: string;
  generatedFrom: {
    researchPack: string;
    referencesCount: number;
    documents: string[];
  };
  summary: {
    overview: string[];
    commonPatterns: string[];
    majorDifferences: string[];
    commonRisks: string[];
    commonTradeoffs: string[];
  };
  governancePlacement: {
    usuallyInStatutes: string[];
    usuallyInRRI: string[];
    mixedApproaches: string[];
    notes: string[];
  };
  recommendationsForBuenVivir: {
    minimalApproach: string[];
    flexibleApproach: string[];
    pointsToDecideSoon: string[];
    pointsThatCanWait: string[];
  };
  detectedTensions: string[];
  notableProjects: {
    projectName: string;
    notableBecause: string;
    references: string[];
  }[];
  legalWarnings: string[];
  generatedDisclaimer: string;
  status: 'generated' | 'needs_legal_review';
}

export interface ExtractedSection {
  id: string;
  documentSlug: string;
  heading: string;
  text: string;
  order: number;
  possibleTopics: string[];
  splitMethod?: string;
  qualityWarning?: string;
  sourceRangeLabel?: string;
}

export interface GeneratedTopicReference {
  topicSlug: string;
  documentSlug: string;
  documentTitle: string;
  documentType: DocumentType;
  projectName?: string;
  sourcePath: string;
  articleOrSection?: string;
  excerpt: string;
  confidence: Confidence;
  reviewStatus: ReviewStatus;
  score?: number;
  tags: string[];
}

export type EvidenceClaimType = 'explicit' | 'inferred' | 'recommendation' | 'weak_evidence' | 'conflicting';

export type EvidenceHealth = 'strong' | 'moderate' | 'weak' | 'insufficient';

export interface EvidenceClaim {
  id: string;
  statement: string;
  evidenceType: EvidenceClaimType;
  confidence: Confidence;
  supportingReferences: string[];
  contradictoryReferences?: string[];
  explanation?: string;
}

export interface EvidenceExtract {
  id: string;
  claimId: string;
  documentSlug: string;
  documentTitle: string;
  documentType: DocumentType;
  projectName?: string;
  sourcePath: string;
  articleOrSection?: string;
  snippet: string;
  score: number;
  relevanceFactors: {
    explicit: boolean;
    headingRelevant: boolean;
    contextualCooccurrence: boolean;
    topicDensity: boolean;
    conceptProximity: boolean;
  };
  contaminationFlags?: string[];
}

export interface ConflictingApproach {
  id: string;
  question: string;
  approaches: string[];
  summary: string;
  projectReferences: string[];
}

export interface EvidenceTopicLayer {
  topicSlug: string;
  generatedAt: string;
  claims: EvidenceClaim[];
  conflictingApproaches: ConflictingApproach[];
  evidenceSummary: {
    totalClaims: number;
    explicitCount: number;
    inferredCount: number;
    recommendationCount: number;
    weakEvidenceCount: number;
    conflictingCount: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
  };
  extracts: EvidenceExtract[];
  nonSubstantiveFiltered: number;
  evidenceHealth: EvidenceHealth;
}

export interface TaxonomyTopic {
  slug: string;
  title: string;
  category: TopicCategory;
  description?: string;
  status: 'active' | 'planned' | 'merged';
  aliases?: string[];
  keywords?: string[];
  negativeKeywords?: string[];
  keywordWeights?: Record<string, number>;
  mergedInto?: string;
}

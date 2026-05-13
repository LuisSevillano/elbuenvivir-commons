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

export interface ExtractedSection {
  id: string;
  documentSlug: string;
  heading: string;
  text: string;
  order: number;
  possibleTopics: string[];
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
  tags: string[];
}

export interface TaxonomyTopic {
  slug: string;
  title: string;
  category: TopicCategory;
  status: 'active' | 'planned' | 'merged';
  aliases?: string[];
  keywords?: string[];
  mergedInto?: string;
}

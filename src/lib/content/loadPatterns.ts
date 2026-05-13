export interface CrossTopicPattern {
  name: string;
  description: string;
  topics: string[];
  evidence: string;
  frequency: number;
}

export interface CrossTopicPatterns {
  generatedAt: string;
  sources: {
    topicsCount: number;
    referencesCount: number;
    synthesesCount: number;
    projectsCount: number;
  };
  recurringConcepts: CrossTopicPattern[];
  detectedTensions: string[];
  opposingApproaches: CrossTopicPattern[];
  commonClausePatterns: string[];
}

const patternModule = import.meta.glob<CrossTopicPatterns>('/src/content/generated/cross-topic-patterns.json', {
  eager: true,
  import: 'default'
});

export function loadCrossTopicPatterns(): CrossTopicPatterns | null {
  const paths = Object.keys(patternModule);
  if (paths.length === 0) return null;
  return patternModule[paths[0]] ?? null;
}
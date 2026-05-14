import type { EvidenceTopicLayer } from './types';

const evidenceModules = import.meta.glob<EvidenceTopicLayer>('/src/content/generated/evidence/*.json', {
  eager: true,
  import: 'default'
});

export function loadEvidenceLayers(): EvidenceTopicLayer[] {
  return Object.values(evidenceModules).toSorted((a, b) => a.topicSlug.localeCompare(b.topicSlug, 'es'));
}

export function loadEvidenceLayer(topicSlug: string): EvidenceTopicLayer | undefined {
  return loadEvidenceLayers().find((layer) => layer.topicSlug === topicSlug);
}

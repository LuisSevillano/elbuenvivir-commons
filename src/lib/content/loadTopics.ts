import generatedReferences from '$content/generated/topic-references.json';
import type { GeneratedTopicReference, GovernanceTopic, TaxonomyTopic } from './types';

const topicModules = import.meta.glob<GovernanceTopic>('/src/content/topics/*.json', {
  eager: true,
  import: 'default'
});

const taxonomyModules = import.meta.glob<TaxonomyTopic[]>('/taxonomy/topics.json', {
  eager: true,
  import: 'default'
});

export function loadTopics(): GovernanceTopic[] {
  return Object.values(topicModules).toSorted((a, b) => a.title.localeCompare(b.title, 'es'));
}

export function loadTopic(slug: string): GovernanceTopic | undefined {
  return loadTopics().find((topic) => topic.slug === slug);
}

export function loadTaxonomy(): TaxonomyTopic[] {
  const taxonomy = Object.values(taxonomyModules)[0] ?? [];
  return taxonomy.toSorted((a, b) => a.title.localeCompare(b.title, 'es'));
}

export function loadGeneratedReferences(topicSlug?: string): GeneratedTopicReference[] {
  const references = (generatedReferences as { references: GeneratedTopicReference[] }).references ?? [];

  if (!topicSlug) {
    return references;
  }

  return references.filter((reference) => reference.topicSlug === topicSlug);
}

export function countReferences(topic: GovernanceTopic): number {
  return (
    topic.legalBasis.length +
    topic.projectReferences.length +
    loadGeneratedReferences(topic.slug).length
  );
}

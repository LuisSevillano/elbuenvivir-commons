import { countReferences, loadTaxonomy, loadTopics } from '$lib/content/loadTopics';

export function load() {
  const topics = loadTopics();

  return {
    topics: topics.map((topic) => ({
      ...topic,
      referenceCount: countReferences(topic)
    })),
    taxonomy: loadTaxonomy()
  };
}

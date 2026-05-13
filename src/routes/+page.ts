import { loadDocuments } from '$lib/content/loadDocuments';
import { loadSyntheses } from '$lib/content/loadSyntheses';
import { loadGeneratedReferences, loadTopics } from '$lib/content/loadTopics';

export function load() {
  const topics = loadTopics();
  const syntheses = loadSyntheses();
  const generatedReferences = loadGeneratedReferences();
  const documents = loadDocuments();
  const consultableTopicSlugs = new Set<string>();

  for (const topic of topics) {
    consultableTopicSlugs.add(topic.slug);
  }

  for (const synthesis of syntheses) {
    consultableTopicSlugs.add(synthesis.slug);
  }

  for (const reference of generatedReferences) {
    consultableTopicSlugs.add(reference.topicSlug);
  }

  return {
    topicCount: consultableTopicSlugs.size,
    documentCount: documents.length
  };
}

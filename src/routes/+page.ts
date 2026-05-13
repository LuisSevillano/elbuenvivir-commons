import { loadDocuments } from '$lib/content/loadDocuments';
import { loadTopics } from '$lib/content/loadTopics';

export function load() {
  const topics = loadTopics();
  const documents = loadDocuments();

  return {
    topicCount: topics.length,
    documentCount: documents.length
  };
}

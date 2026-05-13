import { loadDocuments } from '$lib/content/loadDocuments';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';

export function load() {
  const documents = loadDocuments();

  return {
    topicCount: loadConsultableTopics().length,
    documentCount: documents.length
  };
}

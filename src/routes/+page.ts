import { loadDocuments } from '$lib/content/loadDocuments';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { defaultSeo } from '$lib/seo';

export function load() {
  const documents = loadDocuments();

  return {
    seo: defaultSeo,
    topicCount: loadConsultableTopics().length,
    documentCount: documents.length
  };
}

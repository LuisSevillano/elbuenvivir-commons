import { loadDocuments } from '$lib/content/loadDocuments';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { defaultSeo } from '$lib/seo';

export function load() {
  const documents = loadDocuments();
  const topics = loadConsultableTopics();
  const priorityTopicCount = topics.filter(
    (topic) => topic.editorialStatus === 'reviewed' || topic.editorialStatus === 'exploratory'
  ).length;

  return {
    seo: defaultSeo,
    topicCount: topics.length,
    priorityTopicCount,
    documentCount: documents.length
  };
}

import { defaultSeo } from '$lib/seo';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { loadDocuments } from '$lib/content/loadDocuments';

export function load() {
  const topics = loadConsultableTopics();
  const documents = loadDocuments();

  const withProposal = topics.filter((topic) => topic.dossier?.proposal);
  const openByTopic = withProposal
    .map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      category: topic.category,
      decisions: topic.dossier?.proposal.openDecisions ?? []
    }))
    .filter((entry) => entry.decisions.length > 0)
    .toSorted((a, b) => b.decisions.length - a.decisions.length);

  const totalOpen = openByTopic.reduce((sum, entry) => sum + entry.decisions.length, 0);
  const cooperativeCount = documents.filter((document) => document.type === 'estatutos').length;

  return {
    seo: defaultSeo,
    state: {
      topicCount: topics.length,
      dossierCount: withProposal.length,
      docCount: documents.length,
      cooperativeCount,
      totalOpen,
      openByTopic
    }
  };
}

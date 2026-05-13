import { loadDocuments } from '$lib/content/loadDocuments';
import { loadDrafts } from '$lib/content/loadDrafts';
import { loadGeneratedReferences, loadTaxonomy, loadTopics } from '$lib/content/loadTopics';

export const prerender = false;

export function load({ url }) {
  const documents = loadDocuments();
  const documentsBySlug = new Map(documents.map((document) => [document.slug, document]));
  const taxonomy = loadTaxonomy();
  const taxonomyBySlug = new Map(taxonomy.map((topic) => [topic.slug, topic]));

  const query = url?.searchParams?.get('q') ?? '';

  return {
    query,
    topics: loadTopics(),
    drafts: loadDrafts(),
    documents,
    references: loadGeneratedReferences().map((reference) => {
      const document = documentsBySlug.get(reference.documentSlug);
      const taxonomyTopic = taxonomyBySlug.get(reference.topicSlug);

      return {
        ...reference,
        topicTitle: taxonomyTopic?.title ?? reference.topicSlug,
        category: taxonomyTopic?.category,
        jurisdiction: document?.jurisdiction,
        projectName: reference.projectName ?? document?.projectName
      };
    }),
    taxonomy
  };
}

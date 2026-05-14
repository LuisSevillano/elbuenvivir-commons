import { error } from '@sveltejs/kit';
import { loadDocument, loadDocuments } from '$lib/content/loadDocuments';
import { loadGeneratedReferences, loadTopics } from '$lib/content/loadTopics';
import { documentSeo } from '$lib/seo';

export function entries() {
  return loadDocuments().map((document) => ({ slug: document.slug }));
}

export function load({ params }) {
  const document = loadDocument(params.slug);

  if (!document) {
    error(404, 'Documento no encontrado');
  }

  const topics = loadTopics();
  const curatedTopics = topics.filter(
    (topic) =>
      topic.legalBasis.some((reference) => reference.documentSlug === document.slug) ||
      topic.projectReferences.some((reference) => reference.documentSlug === document.slug)
  );
  const generatedReferences = loadGeneratedReferences().filter(
    (reference) => reference.documentSlug === document.slug
  );

  const topicTitles: Record<string, string> = {};
  for (const topic of topics) {
    topicTitles[topic.slug] = topic.title;
  }

  return {
    seo: documentSeo(document),
    document,
    curatedTopics,
    curatedTopicSlugs: topics.map((topic) => topic.slug),
    topicTitles,
    generatedReferences
  };
}

import { error } from '@sveltejs/kit';
import { loadDocument, loadDocuments } from '$lib/content/loadDocuments';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { documentSeo } from '$lib/seo';

export function entries() {
  return loadDocuments().map((document) => ({ slug: document.slug }));
}

export function load({ params }) {
  const document = loadDocument(params.slug);

  if (!document) {
    error(404, 'Documento no encontrado');
  }

  const topics = loadConsultableTopics();
  const curatedTopics = topics.filter(
    (topic) =>
      topic.legalBasis.some((reference) => reference.documentSlug === document.slug) ||
      topic.projectReferences.some((reference) => reference.documentSlug === document.slug)
  );
  return {
    seo: documentSeo(document),
    document,
    curatedTopics
  };
}

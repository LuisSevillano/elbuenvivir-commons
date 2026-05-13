import { error } from '@sveltejs/kit';
import { loadDocument, loadDocuments } from '$lib/content/loadDocuments';
import { loadGeneratedReferences, loadTopics } from '$lib/content/loadTopics';

export function entries() {
  return loadDocuments().map((document) => ({ slug: document.slug }));
}

export function load({ params }) {
  const document = loadDocument(params.slug);

  if (!document) {
    error(404, 'Documento no encontrado');
  }

  const curatedTopics = loadTopics().filter(
    (topic) =>
      topic.legalBasis.some((reference) => reference.documentSlug === document.slug) ||
      topic.projectReferences.some((reference) => reference.documentSlug === document.slug)
  );
  const generatedReferences = loadGeneratedReferences().filter(
    (reference) => reference.documentSlug === document.slug
  );

  return {
    document,
    curatedTopics,
    generatedReferences
  };
}

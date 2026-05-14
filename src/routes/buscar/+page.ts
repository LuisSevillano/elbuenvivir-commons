import { loadDocuments } from '$lib/content/loadDocuments';
import { loadDrafts } from '$lib/content/loadDrafts';
import { loadGeneratedReferences, loadTaxonomy, loadTopics } from '$lib/content/loadTopics';
import { buildSeo, compactDescription, withBrand } from '$lib/seo';

export const prerender = false;

export function load({ url }) {
  const documents = loadDocuments();
  const documentsBySlug = new Map(documents.map((document) => [document.slug, document]));
  const taxonomy = loadTaxonomy();
  const taxonomyBySlug = new Map(taxonomy.map((topic) => [topic.slug, topic]));

  const query = url?.searchParams?.get('q') ?? '';
  const title = query ? `Buscar "${query}"` : 'Buscar en el atlas cooperativo';
  const description = query
    ? `Resultados de búsqueda para "${query}" en temas, documentos, borradores y referencias de gobernanza cooperativa.`
    : 'Busca temas, documentos, borradores y referencias del atlas comparado de gobernanza cooperativa.';

  return {
    seo: buildSeo({
      title: withBrand(title),
      description: compactDescription(description),
      path: '/buscar'
    }),
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

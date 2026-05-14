import { loadDocuments } from '$lib/content/loadDocuments';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { buildSeo, compactDescription, withBrand } from '$lib/seo';

export const prerender = false;

export function load({ url }) {
  const documents = loadDocuments();
  const topics = loadConsultableTopics();

  const query = url?.searchParams?.get('q') ?? '';
  const title = query ? `Buscar "${query}"` : 'Buscar en la selección editorial';
  const description = query
    ? `Resultados de búsqueda para "${query}" en temas públicos y documentos de referencia.`
    : 'Busca temas seleccionados editorialmente y documentos de referencia.';

  return {
    seo: buildSeo({
      title: withBrand(title),
      description: compactDescription(description),
      path: '/buscar'
    }),
    query,
    topics,
    documents,
    categories: [...new Set(topics.map((topic) => topic.category))]
  };
}

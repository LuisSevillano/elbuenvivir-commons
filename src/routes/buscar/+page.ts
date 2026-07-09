import { loadDocuments } from '$lib/content/loadDocuments';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { buildSeo, compactDescription } from '$lib/seo';

export const prerender = false;

export function load({ url }) {
  const documents = loadDocuments();
  const topics = loadConsultableTopics();

  const query = url?.searchParams?.get('q') ?? '';
  const title = query ? `Buscar "${query}"` : 'Buscar';
  const description = query
    ? `Resultados de búsqueda para "${query}" en los temas y documentos de El Buen Vivir.`
    : 'Busca entre los temas y los documentos de referencia de El Buen Vivir.';

  return {
    seo: buildSeo({
      title,
      description: compactDescription(description),
      path: '/buscar'
    }),
    query,
    topics,
    documents,
    categories: [...new Set(topics.map((topic) => topic.category))]
  };
}

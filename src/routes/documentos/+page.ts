import { loadDocuments } from '$lib/content/loadDocuments';
import { buildSeo, withBrand } from '$lib/seo';

export function load() {
  return {
    seo: buildSeo({
      title: withBrand('Documentos de referencia'),
      description:
        'Los estatutos, reglamentos, guías y normativa que usamos como fuente para fundamentar cada propuesta de El Buen Vivir.',
      path: '/documentos'
    }),
    documents: loadDocuments()
  };
}

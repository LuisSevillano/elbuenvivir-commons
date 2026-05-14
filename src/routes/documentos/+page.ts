import { loadDocuments } from '$lib/content/loadDocuments';
import { buildSeo, withBrand } from '$lib/seo';

export function load() {
  return {
    seo: buildSeo({
      title: withBrand('Documentos de gobernanza cooperativa'),
      description:
        'Consulta estatutos, reglamentos, guías y normativa usados para comparar soluciones reales de gobernanza cooperativa.',
      path: '/documentos'
    }),
    documents: loadDocuments()
  };
}

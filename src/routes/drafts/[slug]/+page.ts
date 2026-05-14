import { buildSeo, withBrand } from '$lib/seo';

export const prerender = false;

export function load() {
  return {
    seo: buildSeo({
      title: withBrand('Área interna de trabajo editorial'),
      description: 'Zona no accesible desde la navegación pública. Contiene borradores internos del pipeline de análisis.',
      path: '/drafts/*'
    })
  };
}

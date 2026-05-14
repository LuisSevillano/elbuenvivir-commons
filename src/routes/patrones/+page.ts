import { buildSeo, withBrand } from '$lib/seo';

export function load() {
  return {
    seo: buildSeo({
      title: withBrand('Patrones en revisión editorial'),
      description:
        'Sección en revisión editorial para evitar presentar tendencias transversales sin suficiente consolidación.',
      path: '/patrones'
    })
  };
}

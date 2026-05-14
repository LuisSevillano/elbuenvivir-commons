import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { buildSeo, withBrand } from '$lib/seo';

export function load() {
  const topics = loadConsultableTopics();

  return {
    seo: buildSeo({
      title: withBrand('Temas de gobernanza cooperativa'),
      description:
        'Explora decisiones prácticas sobre Estatutos, RRI, convivencia, aportaciones y uso de espacios en cooperativas de vivienda.',
      path: '/temas'
    }),
    topics
  };
}

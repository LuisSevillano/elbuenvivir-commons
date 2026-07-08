import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { buildSeo, withBrand } from '$lib/seo';

export function load() {
  const topics = loadConsultableTopics();

  return {
    seo: buildSeo({
      title: withBrand('Todos los temas'),
      description:
        'Los temas que El Buen Vivir tiene que decidir para sus Estatutos y su Reglamento: aportaciones, convivencia, uso de la casa, altas y bajas, disolución y más — cada uno con la ley, la comparativa y una propuesta.',
      path: '/temas'
    }),
    topics
  };
}

import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { buildSeo, pageOgImage } from '$lib/seo';

export function load() {
  const topics = loadConsultableTopics();

  return {
    seo: buildSeo({
      title: 'Todos los temas',
      description:
        'Los temas que El Buen Vivir tiene que decidir para sus Estatutos y su Reglamento: aportaciones, convivencia, uso de la casa, altas y bajas, disolución y más — cada uno con la ley, la comparativa y una propuesta.',
      path: '/temas',
      ...pageOgImage('temas', 'Tarjeta de la sección Temas de El Buen Vivir.')
    }),
    topics
  };
}

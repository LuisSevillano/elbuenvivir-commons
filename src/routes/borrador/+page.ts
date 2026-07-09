import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';

// Orden estructural de un articulado de estatutos/RRI.
const ORDER = [
  'identidad_juridica',
  'clases_de_socios',
  'admision_socio',
  'derechos_y_obligaciones',
  'baja_socio',
  'expulsion_socio',
  'lista_espera',
  'aportaciones_obligatorias',
  'desigualdad_aportaciones',
  'reembolso_aportaciones',
  'ejercicio_economico',
  'asamblea_general',
  'consejo_rector',
  'toma_decisiones',
  'uso_espacios_comunes',
  'reservas_estancias_pernoctas',
  'invitados',
  'convivencia',
  'mantenimiento',
  'conflictos_y_mediacion',
  'disolucion'
];

interface Article {
  topicSlug: string;
  topicTitle: string;
  heading: string;
  text: string;
  note?: string;
}

export function load() {
  const rank = (slug: string) => {
    const index = ORDER.indexOf(slug);
    return index < 0 ? ORDER.length + 1 : index;
  };

  const topics = loadConsultableTopics()
    .filter((topic) => topic.dossier?.proposal && topic.slug !== 'estatutos_vs_rri')
    .toSorted((a, b) => rank(a.slug) - rank(b.slug));

  const estatutos: Article[] = [];
  const rri: Article[] = [];

  for (const topic of topics) {
    for (const article of topic.dossier?.proposal.articles ?? []) {
      const entry: Article = {
        topicSlug: topic.slug,
        topicTitle: topic.title,
        heading: article.heading,
        text: article.text,
        note: article.note
      };
      (article.target === 'rri' ? rri : estatutos).push(entry);
    }
  }

  return {
    seo: {
      title: 'Borrador de Estatutos y RRI',
      description:
        'Borrador de trabajo de los Estatutos y el Reglamento de Régimen Interno de El Buen Vivir, ensamblado a partir de las propuestas de cada tema. Requiere revisión jurídica.',
      path: '/borrador'
    },
    estatutos,
    rri
  };
}

import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { loadRriDraft } from '$lib/content/loadRriDraft';
import { pageOgImage } from '$lib/seo';

// Orden estructural provisional del articulado de Estatutos.
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

  const allTopics = loadConsultableTopics();
  const topics = allTopics
    .filter((topic) => topic.dossier?.proposal && topic.slug !== 'estatutos_vs_rri')
    .toSorted((a, b) => rank(a.slug) - rank(b.slug));

  const estatutos: Article[] = [];

  for (const topic of topics) {
    for (const article of topic.dossier?.proposal.articles ?? []) {
      if (article.target !== 'estatutos') continue;
      const entry: Article = {
        topicSlug: topic.slug,
        topicTitle: topic.title,
        heading: article.heading,
        text: article.text,
        note: article.note
      };
      estatutos.push(entry);
    }
  }

  return {
    seo: {
      title: 'Borrador de Estatutos y RRI',
      description:
        'Borrador de trabajo de los Estatutos y del RRI consolidado de El Buen Vivir, organizado por capítulos y con las decisiones abiertas claramente señaladas.',
      path: '/borrador',
      ...pageOgImage('borrador', 'Tarjeta del Borrador de Estatutos y RRI de El Buen Vivir.')
    },
    estatutos,
    rri: loadRriDraft(),
    topicTitles: Object.fromEntries(allTopics.map((topic) => [topic.slug, topic.title]))
  };
}

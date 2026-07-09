import { defaultSeo } from '$lib/seo';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { loadDocuments } from '$lib/content/loadDocuments';

// Orden de prioridad para "¿Qué toca decidir?": de lo más importante y complejo
// (nudos económico-legales que bloquean la constitución y tienen más riesgo y
// dinero en juego) a lo más operativo y revisable (materia de RRI, más sencilla).
const DECISION_PRIORITY = [
  'desigualdad_aportaciones',
  'disolucion',
  'aportaciones_obligatorias',
  'reembolso_aportaciones',
  'clases_de_socios',
  'derechos_y_obligaciones',
  'identidad_juridica',
  'ejercicio_economico',
  'baja_socio',
  'admision_socio',
  'expulsion_socio',
  'lista_espera',
  'asamblea_general',
  'consejo_rector',
  'toma_decisiones',
  'uso_espacios_comunes',
  'reservas_estancias_pernoctas',
  'invitados',
  'mantenimiento',
  'convivencia',
  'conflictos_y_mediacion',
  'estatutos_vs_rri'
];

export function load() {
  const topics = loadConsultableTopics();
  const documents = loadDocuments();

  const priorityRank = (slug: string) => {
    const index = DECISION_PRIORITY.indexOf(slug);
    return index < 0 ? DECISION_PRIORITY.length : index;
  };

  const withProposal = topics.filter((topic) => topic.dossier?.proposal);
  const openByTopic = withProposal
    .map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      category: topic.category,
      decisions: topic.dossier?.proposal.openDecisions ?? []
    }))
    .filter((entry) => entry.decisions.length > 0)
    // Orden curado por importancia/complejidad; a igualdad, más decisiones abiertas primero.
    .toSorted((a, b) => priorityRank(a.slug) - priorityRank(b.slug) || b.decisions.length - a.decisions.length);

  const totalOpen = openByTopic.reduce((sum, entry) => sum + entry.decisions.length, 0);
  const cooperativeCount = documents.filter((document) => document.type === 'estatutos').length;

  return {
    seo: defaultSeo,
    state: {
      topicCount: topics.length,
      dossierCount: withProposal.length,
      docCount: documents.length,
      cooperativeCount,
      totalOpen,
      openByTopic
    }
  };
}

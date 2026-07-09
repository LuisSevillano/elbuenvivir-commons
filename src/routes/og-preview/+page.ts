import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { loadConsultableTopic } from '$lib/content/loadConsultableTopics';
import { loadDocument } from '$lib/content/loadDocuments';
import { getDocumentDisplayTitle } from '$lib/content/documentDisplay';
import { categoryLabels } from '$lib/content/labels';

// Página de trabajo: renderiza la tarjeta OG en vivo para poder ajustarla y
// para que el script de generación la "fotografíe". No es una página pública:
// solo existe en desarrollo.
export const prerender = false;
export const ssr = true;

const SITE = 'elbuenvivir-commons.netlify.app';

function documentChip(type: string | undefined): string {
  switch (type) {
    case 'estatutos':
      return 'Estatutos';
    case 'rri':
      return 'Reglamento (RRI)';
    case 'guia':
      return 'Guía';
    case 'ley':
      return 'Normativa';
    default:
      return 'Documento';
  }
}

export function load({ url }) {
  if (!dev) error(404, 'No disponible');

  const type = url.searchParams.get('type') ?? 'tema';
  const slug = url.searchParams.get('slug') ?? '';

  if (type === 'documento') {
    const document = slug ? loadDocument(slug) : undefined;
    return {
      card: {
        eyebrow: 'EL BUEN VIVIR · DOCUMENTOS',
        title: document ? getDocumentDisplayTitle(document) : 'Documento de referencia',
        supporting: 'Fuente para fundamentar los Estatutos y el RRI',
        footer: SITE,
        chip: documentChip(document?.type)
      }
    };
  }

  const topic = slug ? loadConsultableTopic(slug) : undefined;
  return {
    card: {
      eyebrow: 'EL BUEN VIVIR · TEMAS',
      title: topic ? topic.title : 'Un tema de gobernanza',
      supporting: 'Qué dice la ley · cómo lo hacen otras · nuestra propuesta',
      footer: SITE,
      chip: topic ? categoryLabels[topic.category] : 'Tema'
    }
  };
}

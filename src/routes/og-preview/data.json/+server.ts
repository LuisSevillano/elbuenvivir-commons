import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { loadDocuments } from '$lib/content/loadDocuments';
import { OG_PAGES } from '$lib/og/cards';

// Lista de slugs con página propia, para que scripts/generate-og.ts sepa
// qué imágenes generar. Solo existe en desarrollo.
export const prerender = false;

export function GET() {
  if (!dev) error(404, 'No disponible');

  return json({
    temas: loadConsultableTopics().map((topic) => topic.slug),
    documentos: loadDocuments().map((document) => document.slug),
    paginas: Object.keys(OG_PAGES)
  });
}

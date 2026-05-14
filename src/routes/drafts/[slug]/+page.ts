import { error } from '@sveltejs/kit';
import { loadDraftBySlug, loadDrafts } from '$lib/content/loadDrafts';
import { loadTopic } from '$lib/content/loadTopics';
import { buildSeo, compactDescription, withBrand } from '$lib/seo';

export const prerender = false;

export function entries() {
  const drafts = loadDrafts();
  return drafts.map((draft) => ({ slug: draft.slug }));
}

export function load({ params }) {
  const draft = loadDraftBySlug(params.slug);

  if (!draft) {
    error(404, 'Draft no encontrado');
  }

  return {
    seo: buildSeo({
      title: withBrand(`${draft.title} - Borrador de trabajo`),
      description: compactDescription(
        `Borrador para comparar opciones, riesgos y ubicación entre Estatutos y RRI sobre ${draft.title}. Requiere revisión jurídica.`
      ),
      path: `/drafts/${draft.slug}`,
      type: 'article'
    }),
    draft,
    curatedTopic: loadTopic(params.slug) ?? null
  };
}

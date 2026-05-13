import { error } from '@sveltejs/kit';
import { loadDraftBySlug, loadDrafts } from '$lib/content/loadDrafts';
import { loadTopic } from '$lib/content/loadTopics';

export function entries() {
  return loadDrafts().map((draft) => ({ slug: draft.slug }));
}

export function load({ params }) {
  const draft = loadDraftBySlug(params.slug);

  if (!draft) {
    error(404, 'Draft no encontrado');
  }

  return {
    draft,
    curatedTopic: loadTopic(params.slug) ?? null
  };
}

import { loadDrafts } from '$lib/content/loadDrafts';
import { loadTopics } from '$lib/content/loadTopics';
import { buildSeo, withBrand } from '$lib/seo';

export const prerender = false;

export function load() {
  const curatedTopicSlugs = new Set(loadTopics().map((topic) => topic.slug));

  return {
    seo: buildSeo({
      title: withBrand('Borradores de trabajo cooperativo'),
      description:
        'Borradores para comparar enfoques, riesgos y ubicación entre Estatutos y RRI antes de convertirlos en acuerdos.',
      path: '/drafts'
    }),
    drafts: loadDrafts().map((draft) => ({
      ...draft,
      hasCuratedTopic: curatedTopicSlugs.has(draft.slug)
    }))
  };
}

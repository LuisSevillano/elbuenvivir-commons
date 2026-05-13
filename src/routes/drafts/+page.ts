import { loadDrafts } from '$lib/content/loadDrafts';
import { loadTopics } from '$lib/content/loadTopics';

export const prerender = false;

export function load() {
  const curatedTopicSlugs = new Set(loadTopics().map((topic) => topic.slug));

  return {
    drafts: loadDrafts().map((draft) => ({
      ...draft,
      hasCuratedTopic: curatedTopicSlugs.has(draft.slug)
    }))
  };
}

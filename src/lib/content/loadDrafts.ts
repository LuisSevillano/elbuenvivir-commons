import type { GeneratedTopicDraft } from './types';

const draftModules = import.meta.glob<GeneratedTopicDraft>('/src/content/drafts/*.draft.json', {
  eager: true,
  import: 'default'
});

export function loadDrafts(): GeneratedTopicDraft[] {
  return Object.values(draftModules).toSorted((a, b) => a.title.localeCompare(b.title, 'es'));
}

export function loadDraftBySlug(slug: string): GeneratedTopicDraft | undefined {
  return loadDrafts().find((draft) => draft.slug === slug);
}

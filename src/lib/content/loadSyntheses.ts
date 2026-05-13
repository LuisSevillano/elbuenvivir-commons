import type { GeneratedTopicSynthesis } from './types';

const synthesisModules = import.meta.glob<GeneratedTopicSynthesis>('/src/content/generated/syntheses/*.generated.json', {
  eager: true,
  import: 'default'
});

export function loadSyntheses(): GeneratedTopicSynthesis[] {
  return Object.values(synthesisModules).toSorted((a, b) => a.slug.localeCompare(b.slug, 'es'));
}

export function loadSynthesis(slug: string): GeneratedTopicSynthesis | undefined {
  return loadSyntheses().find((synthesis) => synthesis.slug === slug);
}

import type { TopicDecisionModel } from './types';

const decisionModelModules = import.meta.glob<TopicDecisionModel>('/src/content/generated/decision-models/*.json', {
  eager: true,
  import: 'default'
});

export function loadDecisionModels(): TopicDecisionModel[] {
  return Object.values(decisionModelModules).toSorted((a, b) => a.topicSlug.localeCompare(b.topicSlug, 'es'));
}

export function loadDecisionModel(topicSlug: string): TopicDecisionModel | undefined {
  return loadDecisionModels().find((model) => model.topicSlug === topicSlug);
}

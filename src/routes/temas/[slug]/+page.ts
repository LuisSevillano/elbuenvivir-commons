import { error } from '@sveltejs/kit';
import { loadSynthesis } from '$lib/content/loadSyntheses';
import { loadGeneratedReferences, loadTopic, loadTopics } from '$lib/content/loadTopics';

export function entries() {
  return loadTopics().map((topic) => ({ slug: topic.slug }));
}

export function load({ params }) {
  const topic = loadTopic(params.slug);

  if (!topic) {
    error(404, 'Tema no encontrado');
  }

  return {
    topic,
    topics: loadTopics(),
    generatedReferences: loadGeneratedReferences(topic.slug),
    synthesis: loadSynthesis(topic.slug) ?? null
  };
}

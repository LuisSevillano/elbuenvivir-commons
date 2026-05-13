import { error } from '@sveltejs/kit';
import { loadConsultableTopic, loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { loadSynthesis } from '$lib/content/loadSyntheses';
import { loadGeneratedReferences } from '$lib/content/loadTopics';

export function entries() {
  return loadConsultableTopics().map((topic) => ({ slug: topic.slug }));
}

export function load({ params }) {
  const topic = loadConsultableTopic(params.slug);

  if (!topic) {
    error(404, 'Tema no encontrado');
  }

  return {
    topic,
    topics: loadConsultableTopics(),
    generatedReferences: loadGeneratedReferences(topic.slug),
    synthesis: loadSynthesis(topic.slug) ?? null
  };
}

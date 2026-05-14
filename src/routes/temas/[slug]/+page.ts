import { error } from '@sveltejs/kit';
import { loadConsultableTopic, loadConsultableTopics } from '$lib/content/loadConsultableTopics';
import { loadDecisionModel } from '$lib/content/loadDecisionModels';
import { loadSynthesis } from '$lib/content/loadSyntheses';
import { loadGeneratedReferences } from '$lib/content/loadTopics';
import { topicSeo } from '$lib/seo';

export function entries() {
  return loadConsultableTopics().map((topic) => ({ slug: topic.slug }));
}

export function load({ params }) {
  const topic = loadConsultableTopic(params.slug);

  if (!topic) {
    error(404, 'Tema no encontrado');
  }

  return {
    seo: topicSeo(topic),
    topic,
    topics: loadConsultableTopics(),
    decisionModel: loadDecisionModel(topic.slug) ?? null,
    generatedReferences: loadGeneratedReferences(topic.slug),
    synthesis: loadSynthesis(topic.slug) ?? null
  };
}

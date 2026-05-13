import { loadConsultableTopics } from '$lib/content/loadConsultableTopics';

export function load() {
  const topics = loadConsultableTopics();

  return {
    topics
  };
}

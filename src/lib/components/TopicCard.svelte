<script lang="ts">
  import { categoryLabels, topicStatusLabels } from '$lib/content/labels';
  import type { ConsultableTopic, GovernanceTopic } from '$lib/content/types';
  import StatusBadge from './StatusBadge.svelte';

  type TopicCardTopic = GovernanceTopic | ConsultableTopic;

  let { topic, referenceCount = 0 }: { topic: TopicCardTopic; referenceCount?: number } = $props();

  const statusTone = $derived(topic.status === 'reviewed' ? 'success' : 'warning');
  const availabilityBadge = $derived('availabilityBadge' in topic ? topic.availabilityBadge : null);
</script>

<a class="topic-card" href={`/temas/${topic.slug}`}>
  <div class="meta">
    <span>{categoryLabels[topic.category]}</span>
    {#if availabilityBadge}
      <StatusBadge tone={availabilityBadge === 'Análisis amplio' ? 'success' : 'neutral'}>
        {availabilityBadge}
      </StatusBadge>
    {:else}
      <StatusBadge tone={statusTone}>{topicStatusLabels[topic.status]}</StatusBadge>
    {/if}
  </div>
  <h2>{topic.title}</h2>
  <p>{topic.shortDescription}</p>
  <span class="reference-count">{referenceCount} referencias</span>
</a>

<style>
  .topic-card {
    display: block;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fffdf8;
    color: inherit;
    padding: 1.2rem;
    text-decoration: none;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }

  .topic-card:hover {
    border-color: #a89778;
    transform: translateY(-1px);
  }

  .meta {
    align-items: center;
    color: var(--muted);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.85rem;
    gap: 0.6rem;
    justify-content: space-between;
  }

  h2 {
    font-size: 1.25rem;
    margin: 0.8rem 0 0.45rem;
  }

  p {
    color: var(--muted);
    margin: 0 0 1rem;
  }

  .reference-count {
    color: #5e5140;
    font-size: 0.9rem;
    font-weight: 700;
  }
</style>

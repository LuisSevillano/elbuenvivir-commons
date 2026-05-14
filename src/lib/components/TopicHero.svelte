<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { categoryLabels, placementLabel, topicStatusLabels } from '$lib/content/labels';
  import { validatedTopicStatusLabels } from '$lib/content/validatedTopicSchema';
  import type { ConsultableTopic, GovernanceTopic, ValidatedTopicStatus } from '$lib/content/types';

  interface Props {
    topic: GovernanceTopic | ConsultableTopic;
    editorialStatus?: ValidatedTopicStatus;
  }

  let { topic, editorialStatus }: Props = $props();
  const availabilityBadge = $derived('availabilityBadge' in topic ? topic.availabilityBadge : null);
  const status = $derived(editorialStatus ?? ('editorialStatus' in topic ? topic.editorialStatus : null));
  const statusTone = $derived(status === 'reviewed' ? 'success' : status === 'exploratory' ? 'neutral' : 'warning');
</script>

<header class="topic-hero">
  <h1 class="hero-title">{topic.title}</h1>

  {#if topic.shortDescription}
    <p class="hero-description">{topic.shortDescription}</p>
  {/if}

  <div class="hero-badges">
    <StatusBadge>{categoryLabels[topic.category]}</StatusBadge>
    {#if status}
      <StatusBadge tone={statusTone}>{validatedTopicStatusLabels[status]}</StatusBadge>
    {:else if availabilityBadge}
      <StatusBadge tone={availabilityBadge === 'Análisis amplio' ? 'success' : 'neutral'}>{availabilityBadge}</StatusBadge>
    {:else}
      <StatusBadge tone="warning">{topicStatusLabels[topic.status]}</StatusBadge>
    {/if}
    <StatusBadge>{placementLabel(topic.governancePlacement.recommendedPrimaryLocation)}</StatusBadge>
  </div>
</header>

<style>
  .topic-hero {
    margin-bottom: 1.5rem;
    padding-bottom: 1.1rem;
    border-bottom: 1px solid var(--border);
  }

  .hero-title {
    font-size: clamp(1.65rem, 4vw, 2rem);
    font-weight: 700;
    color: var(--heading);
    margin: 0 0 0.55rem;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .hero-description {
    font-size: 1rem;
    color: var(--muted);
    margin: 0 0 0.9rem;
    line-height: 1.45;
    max-width: 58ch;
  }

  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

</style>

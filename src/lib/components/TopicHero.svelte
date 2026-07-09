<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { categoryLabels } from '$lib/content/labels';
  import { validatedTopicStatusLabels } from '$lib/content/validatedTopicSchema';
  import type { ConsultableTopic, GovernanceTopic, ValidatedTopicStatus } from '$lib/content/types';

  interface Props {
    topic: GovernanceTopic | ConsultableTopic;
    editorialStatus?: ValidatedTopicStatus;
  }

  let { topic, editorialStatus }: Props = $props();
  const status = $derived(editorialStatus ?? ('editorialStatus' in topic ? topic.editorialStatus : null));
  const isReviewed = $derived(status === 'reviewed');
  const statusTone = $derived(status === 'exploratory' ? 'neutral' : 'warning');
</script>

<header class="topic-hero">
  {#if categoryLabels[topic.category]}
    <p class="eyebrow">{categoryLabels[topic.category]}</p>
  {/if}

  <h1 class="hero-title">{topic.title}</h1>

  {#if topic.shortDescription}
    <p class="hero-description">{topic.shortDescription}</p>
  {/if}

  <!-- El estado solo se muestra cuando es una excepción que conviene ver (no en "Revisado"). -->
  {#if status && !isReviewed}
    <div class="hero-badges">
      <StatusBadge tone={statusTone}>{validatedTopicStatusLabels[status]}</StatusBadge>
    </div>
  {/if}
</header>

<style>
  .topic-hero {
    margin-bottom: 1.3rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .topic-hero .eyebrow {
    margin: 0 0 0.35rem;
    color: var(--accent-temas);
  }

  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 4.5vw, 2.6rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0 0 0.55rem;
    line-height: 1.1;
  }

  .hero-description {
    font-size: 1rem;
    color: var(--muted);
    margin: 0 0 0.9rem;
    line-height: 1.5;
    max-width: 58ch;
  }

  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>

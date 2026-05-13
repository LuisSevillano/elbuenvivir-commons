<script lang="ts">
  import StatusBadge from './StatusBadge.svelte';
  import { categoryLabels, placementLabel, topicStatusLabels } from '$lib/content/labels';
  import type { GovernanceTopic } from '$lib/content/types';

  interface Props {
    topic: GovernanceTopic;
    referenceCount?: number;
    projectCount?: number;
  }

  let { topic, referenceCount = 0, projectCount = 0 }: Props = $props();
</script>

<header class="topic-hero">
  <div class="hero-meta">
    <span class="category">{categoryLabels[topic.category]}</span>
    <span class="separator">·</span>
    <span class="stats">
      {referenceCount} referencia{referenceCount !== 1 ? 's' : ''}
      {projectCount > 0 ? ` · ${projectCount} proyecto${projectCount !== 1 ? 's' : ''}` : ''}
    </span>
  </div>

  <h1 class="hero-title">{topic.title}</h1>

  {#if topic.shortDescription}
    <p class="hero-description">{topic.shortDescription}</p>
  {/if}

  <div class="hero-badges">
    <StatusBadge tone="warning">{topicStatusLabels[topic.status]}</StatusBadge>
    <StatusBadge>{placementLabel(topic.governancePlacement.recommendedPrimaryLocation)}</StatusBadge>
  </div>
</header>

<style>
  .topic-hero {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .hero-meta {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category {
    font-weight: 500;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .separator {
    opacity: 0.5;
  }

  .hero-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--heading);
    margin: 0 0 0.75rem;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .hero-description {
    font-size: 1.1rem;
    color: var(--muted);
    margin: 0 0 1.25rem;
    line-height: 1.5;
    max-width: 65ch;
  }

  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  @media (max-width: 640px) {
    .hero-title {
      font-size: 1.65rem;
    }

    .hero-description {
      font-size: 1rem;
    }
  }
</style>
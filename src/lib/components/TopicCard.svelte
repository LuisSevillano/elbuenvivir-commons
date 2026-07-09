<script lang="ts">
  import { categoryLabels, topicStatusLabels } from '$lib/content/labels';
  import { validatedTopicStatusLabels } from '$lib/content/validatedTopicSchema';
  import type { ConsultableTopic, GovernanceTopic } from '$lib/content/types';
  import StatusBadge from './StatusBadge.svelte';

  type TopicCardTopic = GovernanceTopic | ConsultableTopic;

  let { topic }: { topic: TopicCardTopic; referenceCount?: number } = $props();

  const statusTone = $derived(topic.status === 'reviewed' ? 'success' : 'warning');
  const editorialStatus = $derived('editorialStatus' in topic ? topic.editorialStatus : null);
  const editorialTone = $derived(editorialStatus === 'reviewed' ? 'success' : editorialStatus === 'exploratory' ? 'neutral' : 'warning');
  const placement = $derived(topic.governancePlacement.recommendedPrimaryLocation);
  const showPlacement = $derived(editorialStatus !== 'insufficient_evidence' && editorialStatus !== 'evidencia_insuficiente');
</script>

<a class="topic-card" href={`/temas/${topic.slug}`}>
  <div class="meta">
    <span>{categoryLabels[topic.category]}</span>
    <!-- El estado solo se muestra cuando es de aviso (no en "Revisado", que es lo normal). -->
    {#if editorialStatus && editorialStatus !== 'reviewed'}
      <StatusBadge tone={editorialTone}>{validatedTopicStatusLabels[editorialStatus]}</StatusBadge>
    {:else if !editorialStatus && topic.status !== 'reviewed'}
      <StatusBadge tone={statusTone}>{topicStatusLabels[topic.status]}</StatusBadge>
    {/if}
  </div>
  <h2>{topic.title}</h2>
  <p>{topic.shortDescription}</p>
  {#if showPlacement}
  <div class="card-footer">
    <div class="placement-key" aria-label="Ubicación normativa recomendada">
      <span class:active={placement === 'estatutos' || placement === 'mixed'} class="placement-pill statutes">Estatutos</span>
      <span class:active={placement === 'rri' || placement === 'mixed'} class="placement-pill rri">RRI</span>
      {#if placement === 'case_by_case'}
        <span class="placement-pill neutral active">Caso por caso</span>
      {/if}
    </div>
  </div>
  {/if}
</a>

<style>
  .topic-card {
    display: block;
    border: 1px solid var(--border);
    border-radius: 4px;
    box-shadow: inset 0 3px 0 var(--accent-temas);
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

  .card-footer {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
  }

  .placement-key {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .placement-pill {
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1;
    opacity: 0.42;
    padding: 0.35rem 0.45rem;
  }

  .placement-pill.active {
    opacity: 1;
  }

  .placement-pill.statutes.active {
    background: #eef5ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .placement-pill.rri.active {
    background: #eefdf3;
    border-color: #bbf7d0;
    color: #15803d;
  }

  .placement-pill.neutral.active {
    background: #f5f5f5;
    color: #525252;
  }

</style>

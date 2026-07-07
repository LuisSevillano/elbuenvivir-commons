<script lang="ts">
  import TopicCard from '$lib/components/TopicCard.svelte';
  import { validatedTopicStatusLabels } from '$lib/content/validatedTopicSchema';
  import type { ConsultableTopic } from '$lib/content/types';

  let { data }: { data: { topics: ConsultableTopic[] } } = $props();

  function byEditorialWeight(a: ConsultableTopic, b: ConsultableTopic): number {
    const weights: Record<ConsultableTopic['editorialStatus'], number> = {
      reviewed: 3,
      exploratory: 2,
      insufficient_evidence: 1,
      evidencia_insuficiente: 1,
      hidden: 0
    };
    return weights[b.editorialStatus] - weights[a.editorialStatus] || b.referenceCount - a.referenceCount || a.title.localeCompare(b.title, 'es');
  }

  function statusCount(topics: ConsultableTopic[], status: ConsultableTopic['editorialStatus']): number {
    return topics.filter((topic) => topic.editorialStatus === status).length;
  }

  const priorityTopics = $derived(
    data.topics
      .filter((topic) => topic.editorialStatus !== 'insufficient_evidence' && topic.editorialStatus !== 'evidencia_insuficiente')
      .toSorted(byEditorialWeight)
      .slice(0, 8)
  );
  const prioritySlugs = $derived(new Set(priorityTopics.map((topic) => topic.slug)));
  const reviewQueue = $derived(data.topics.filter((topic) => !prioritySlugs.has(topic.slug)).toSorted(byEditorialWeight));
  const reviewedCount = $derived(statusCount(data.topics, 'reviewed'));
  const exploratoryCount = $derived(statusCount(data.topics, 'exploratory'));
  const insufficientCount = $derived(statusCount(data.topics, 'insufficient_evidence') + statusCount(data.topics, 'evidencia_insuficiente'));
</script>

<section class="hero">
  <p class="eyebrow">Temas</p>
  <h1>Navegación por decisiones, no por documentos.</h1>
  <p class="lead">
    La selección pública prioriza pocos temas con utilidad editorial real. Algunos están revisados, otros son
    exploratorios y otros quedan marcados como evidencia insuficiente para evitar falsas certezas.
  </p>
</section>

<section class="section editorial-ledger" aria-label="Estado editorial de los temas">
  <span><strong>{reviewedCount}</strong> {validatedTopicStatusLabels.reviewed}</span>
  <span><strong>{exploratoryCount}</strong> {validatedTopicStatusLabels.exploratory}</span>
  <span><strong>{insufficientCount}</strong> {validatedTopicStatusLabels.insufficient_evidence}</span>
</section>

{#if data.topics.length === 0}
  <section class="section empty-state">No hay temas disponibles todavía.</section>
{:else}
  <section class="section">
    <div class="section-heading">
      <h2>Temas prioritarios</h2>
      <p>Selección limitada para trabajar primero: temas con más apoyo documental o revisión editorial.</p>
    </div>
    {#if priorityTopics.length > 0}
      <div class="grid">
        {#each priorityTopics as topic}
          <TopicCard {topic} />
        {/each}
      </div>
    {:else}
      <p class="empty-state">Todavía no hay temas con suficiente prioridad editorial para destacar.</p>
    {/if}
  </section>

  {#if reviewQueue.length > 0}
    <section class="section review-queue">
      <div class="section-heading">
        <h2>Temas en observación</h2>
        <p>No se presentan como conclusiones. Sirven para identificar preguntas abiertas y necesidades de revisión.</p>
      </div>
      <ul class="queue-list">
        {#each reviewQueue as topic}
          <li>
            <a href={`/temas/${topic.slug}`}>{topic.title}</a>
            <span>{validatedTopicStatusLabels[topic.editorialStatus]}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/if}

<section class="section panel">
  <h2>Criterio de lectura</h2>
  <p>
    El número de temas no equivale a calidad homogénea. La aplicación distingue entre revisión,
    exploración y evidencia insuficiente para que cada consulta tenga el peso que le corresponde.
  </p>
</section>

<style>
  .editorial-ledger {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: -0.75rem;
  }

  .editorial-ledger span {
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fffdf8;
    color: var(--muted);
    font-size: 0.86rem;
    padding: 0.45rem 0.65rem;
  }

  .editorial-ledger strong { color: var(--heading); }

  .section-heading { margin-bottom: 1rem; }
  .section-heading h2 { margin-bottom: 0.35rem; }
  .section-heading p { margin: 0; color: var(--muted); max-width: 62ch; }

  .queue-list {
    display: grid;
    gap: 0.45rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .queue-list li {
    align-items: center;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    padding: 0.55rem 0;
  }

  .queue-list a { color: var(--heading); font-weight: 650; text-decoration: none; }
  .queue-list a:hover { text-decoration: underline; }
  .queue-list span { color: var(--muted); font-size: 0.84rem; white-space: nowrap; }

  @media (max-width: 640px) {
    .queue-list li { align-items: flex-start; flex-direction: column; gap: 0.25rem; }
  }
</style>

<script lang="ts">
  import TopicCard from '$lib/components/TopicCard.svelte';
  import { validatedTopicStatusLabels } from '$lib/content/validatedTopicSchema';
  import type { ConsultableTopic } from '$lib/content/types';

  let { data }: { data: { topics: ConsultableTopic[] } } = $props();

  const categoryLabels: Record<string, string> = {
    identidad_juridica: 'Identidad jurídica',
    socios: 'Personas socias',
    disciplina: 'Disciplina',
    economico: 'Economía y aportaciones',
    gobernanza: 'Gobernanza',
    uso_espacios: 'Uso de espacios',
    convivencia: 'Convivencia',
    cuidados: 'Cuidados',
    ciclo_vida: 'Ciclo de vida',
    legal: 'Estatutos y RRI',
    otros: 'Otros'
  };
  const categoryOrder = Object.keys(categoryLabels);

  function statusCount(status: ConsultableTopic['editorialStatus']): number {
    return data.topics.filter((topic) => topic.editorialStatus === status).length;
  }
  const reviewedCount = $derived(statusCount('reviewed'));
  const exploratoryCount = $derived(statusCount('exploratory'));
  const insufficientCount = $derived(statusCount('insufficient_evidence') + statusCount('evidencia_insuficiente'));

  const groups = $derived(
    [...new Set(data.topics.map((topic) => topic.category))]
      .toSorted((a, b) => {
        const ia = categoryOrder.indexOf(a);
        const ib = categoryOrder.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      })
      .map((category) => ({
        category,
        label: categoryLabels[category] ?? category,
        topics: data.topics
          .filter((topic) => topic.category === category)
          .toSorted((a, b) => a.title.localeCompare(b.title, 'es'))
      }))
  );
</script>

<section class="hero">
  <p class="eyebrow">Temas</p>
  <h1>Navegación por decisiones, no por documentos.</h1>
  <p class="lead">
    Cada tema reúne, de un vistazo, qué dice la ley, cómo lo resuelven otras cooperativas y una
    propuesta redactada para nosotras — con las fuentes siempre a la vista.
  </p>
</section>

<section class="section editorial-ledger" aria-label="Estado editorial de los temas">
  {#if reviewedCount > 0}
    <span><strong>{reviewedCount}</strong> {validatedTopicStatusLabels.reviewed}</span>
  {/if}
  {#if exploratoryCount > 0}
    <span><strong>{exploratoryCount}</strong> {validatedTopicStatusLabels.exploratory}</span>
  {/if}
  {#if insufficientCount > 0}
    <span><strong>{insufficientCount}</strong> {validatedTopicStatusLabels.insufficient_evidence}</span>
  {/if}
</section>

{#if data.topics.length === 0}
  <section class="section empty-state">No hay temas disponibles todavía.</section>
{:else}
  {#each groups as group}
    <section class="section topic-group">
      <h2 class="cat-heading">{group.label}</h2>
      <div class="grid">
        {#each group.topics as topic}
          <TopicCard {topic} />
        {/each}
      </div>
    </section>
  {/each}
{/if}

<section class="section panel">
  <h2>Criterio de lectura</h2>
  <p>
    Cada tema es un borrador de trabajo que debe contrastarse con las fuentes y revisarse
    jurídicamente antes de convertirlo en acuerdo. La propuesta orienta; no sustituye la decisión
    del grupo ni el asesoramiento profesional.
  </p>
</section>

<style>
  .hero .eyebrow {
    color: var(--accent-temas);
  }

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

  .editorial-ledger strong { color: var(--ink); }

  .topic-group { margin-top: 2rem; }
  .cat-heading {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.35rem;
    letter-spacing: -0.01em;
    margin: 0 0 1rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid var(--border);
  }
</style>

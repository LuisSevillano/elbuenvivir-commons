<script lang="ts">
  import TopicCard from '$lib/components/TopicCard.svelte';
  import { categoryLabels } from '$lib/content/labels';
  import type { ConsultableTopic, TopicCategory } from '$lib/content/types';

  let { data }: { data: { topics: ConsultableTopic[] } } = $props();

  function groupTopics(topics: ConsultableTopic[]): [TopicCategory, ConsultableTopic[]][] {
    const groups: Partial<Record<TopicCategory, ConsultableTopic[]>> = {};

    for (const topic of topics) {
      groups[topic.category] = [...(groups[topic.category] ?? []), topic];
    }

    return Object.entries(groups) as [TopicCategory, ConsultableTopic[]][];
  }

  const groupedTopics = $derived(groupTopics(data.topics));
  const broadAnalysisCount = $derived(
    data.topics.filter((topic) => topic.availabilityBadge === 'Análisis amplio').length
  );
</script>

<section class="hero">
  <p class="eyebrow">Temas</p>
  <h1>Navegación por decisiones, no por documentos.</h1>
  <p class="lead">
    Cada tema reúne patrones observados, documentos relacionados y decisiones prácticas para orientar
    la conversación sobre Estatutos, RRI o soluciones mixtas.
  </p>
</section>

{#if data.topics.length === 0}
  <section class="section empty-state">No hay temas disponibles todavía.</section>
{:else}
  {#each groupedTopics as [category, topics]}
    <section class="section">
      <h2>{categoryLabels[category]}</h2>
      <div class="grid">
        {#each topics as topic}
          <TopicCard {topic} referenceCount={topic.referenceCount} />
        {/each}
      </div>
    </section>
  {/each}
{/if}

<section class="section panel">
  <h2>Atlas consultable</h2>
  <p>
    Hay {data.topics.length} temas disponibles para explorar. {broadAnalysisCount} reúnen un análisis
    amplio con referencias de varios documentos.
  </p>
</section>

<script lang="ts">
  import TopicCard from '$lib/components/TopicCard.svelte';
  import { categoryLabels } from '$lib/content/labels';
  import type { GovernanceTopic, TaxonomyTopic, TopicCategory } from '$lib/content/types';

  type TopicWithCount = GovernanceTopic & { referenceCount: number };

  let { data }: { data: { topics: TopicWithCount[]; taxonomy: TaxonomyTopic[] } } = $props();

  function groupTopics(topics: TopicWithCount[]): [TopicCategory, TopicWithCount[]][] {
    const groups: Partial<Record<TopicCategory, TopicWithCount[]>> = {};

    for (const topic of topics) {
      groups[topic.category] = [...(groups[topic.category] ?? []), topic];
    }

    return Object.entries(groups) as [TopicCategory, TopicWithCount[]][];
  }

  const groupedTopics = $derived(groupTopics(data.topics));

  const plannedCount = $derived(data.taxonomy.filter((topic) => topic.status === 'planned').length);
</script>

<section class="hero">
  <p class="eyebrow">Temas</p>
  <h1>Navegación por decisiones, no por documentos.</h1>
  <p class="lead">
    Cada tema reúne contenido editorial curado, referencias documentales y una recomendación explícita
    sobre Estatutos, RRI o tratamiento mixto.
  </p>
</section>

{#if data.topics.length === 0}
  <section class="section empty-state">No hay temas curados todavía.</section>
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
  <h2>Taxonomía MVP</h2>
  <p>
    Hay {plannedCount} temas planificados en <code>taxonomy/topics.json</code>. No aparecen como fichas
    completas hasta que exista contenido editorial curado en <code>src/content/topics</code>.
  </p>
</section>

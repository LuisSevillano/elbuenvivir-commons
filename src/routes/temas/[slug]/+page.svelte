<script lang="ts">
  import ReferenceCard from '$lib/components/ReferenceCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import SuggestedClauseBlock from '$lib/components/SuggestedClauseBlock.svelte';
  import WarningBox from '$lib/components/WarningBox.svelte';
  import { categoryLabels, legalDisclaimer, placementLabel, topicStatusLabels } from '$lib/content/labels';
  import type { GeneratedTopicReference, GovernanceTopic } from '$lib/content/types';

  let { data }: {
    data: { topic: GovernanceTopic; generatedReferences: GeneratedTopicReference[] };
  } = $props();

  const topic = $derived(data.topic);
</script>

<article>
  <header class="hero">
    <p class="eyebrow">{categoryLabels[topic.category]}</p>
    <h1>{topic.title}</h1>
    <p class="lead">{topic.shortDescription}</p>
    <div class="topic-badges">
      <StatusBadge tone="warning">{topicStatusLabels[topic.status]}</StatusBadge>
      <StatusBadge>Ubicación recomendada: {placementLabel(topic.governancePlacement.recommendedPrimaryLocation)}</StatusBadge>
    </div>
  </header>

  <section class="section">
    <WarningBox title="Aviso jurídico">{legalDisclaimer}</WarningBox>
  </section>

  <section class="section two-column">
    <div class="panel">
      <h2>Qué debería regular mínimamente</h2>
      <ul>
        {#each topic.minimumContents as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
    <div class="panel">
      <h2>Decisiones para El Buen Vivir</h2>
      <ul>
        {#each topic.decisionsForBuenVivir as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="section panel">
    <h2>Estatutos o RRI</h2>
    <div class="two-column">
      <div>
        <h3>Razón</h3>
        <ul>
          {#each topic.governancePlacement.rationale as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
      <div>
        <h3>Riesgos</h3>
        <ul>
          {#each topic.risks as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="two-column placement-lists">
      <div>
        <h3>Debería ir en Estatutos</h3>
        <ul>
          {#each topic.governancePlacement.shouldBeInStatutes as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
      <div>
        <h3>Debería ir en RRI</h3>
        <ul>
          {#each topic.governancePlacement.shouldBeInRRI as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <section class="section stack">
    <h2>Base legal curada</h2>
    {#if topic.legalBasis.length === 0}
      <p class="empty-state">No hay base legal curada todavía. No se inventan citas ni referencias.</p>
    {:else}
      {#each topic.legalBasis as basis}
        <article class="panel">
          <h3>{basis.title}</h3>
          <p>{basis.summary}</p>
          {#if basis.excerpt}<blockquote>{basis.excerpt}</blockquote>{/if}
        </article>
      {/each}
    {/if}
  </section>

  <section class="section stack">
    <h2>Referencias comparadas curadas</h2>
    {#if topic.projectReferences.length === 0}
      <p class="empty-state">No hay referencias comparadas curadas todavía.</p>
    {:else}
      {#each topic.projectReferences as reference}
        <ReferenceCard {reference} />
      {/each}
    {/if}
  </section>

  <section class="section stack">
    <h2>Referencias automáticas regenerables</h2>
    <p>
      Esta sección lee <code>src/content/generated/topic-references.json</code>. Sus resultados no son
      contenido editorial hasta que se revisen manualmente.
    </p>
    {#if data.generatedReferences.length === 0}
      <p class="empty-state">No hay referencias automáticas para este tema.</p>
    {:else}
      {#each data.generatedReferences as reference}
        <ReferenceCard {reference} automatic />
      {/each}
    {/if}
  </section>

  {#if topic.suggestedClause}
    <section class="section">
      <SuggestedClauseBlock clause={topic.suggestedClause} />
    </section>
  {/if}
</article>

<style>
  .topic-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .placement-lists {
    margin-top: 1rem;
  }
</style>

<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import SuggestedClauseBlock from '$lib/components/SuggestedClauseBlock.svelte';
  import WarningBox from '$lib/components/WarningBox.svelte';
  import { categoryLabels, placementLabel } from '$lib/content/labels';
  import type { GeneratedTopicDraft, GovernanceTopic } from '$lib/content/types';

  let { data }: { data: { draft: GeneratedTopicDraft; curatedTopic: GovernanceTopic | null } } = $props();

  const draft = $derived(data.draft);
  const curatedTopic = $derived(data.curatedTopic);

  function confidenceLabel(value: string): string {
    const labels: Record<string, string> = { high: 'alta', medium: 'media', low: 'baja' };
    return labels[value] ?? value;
  }
</script>

<article>
  <header class="hero draft-hero">
    <p class="eyebrow">Borrador de trabajo: {categoryLabels[draft.category]}</p>
    <h1>{draft.title}</h1>
    <p class="lead">Propuesta inicial para comparar opciones, riesgos y ubicación entre Estatutos y RRI.</p>
    <div class="draft-badges">
      <StatusBadge tone="warning">Revisión jurídica recomendada</StatusBadge>
      <StatusBadge tone="auto">Basado en documentos analizados</StatusBadge>
    </div>
  </header>

  <section class="section">
    <WarningBox title="Borrador para deliberación">
      Este texto es un punto de partida para comparar soluciones. No sustituye la revisión jurídica ni la
      decisión colectiva del grupo.
    </WarningBox>
  </section>

  <section class="section comparison-grid">
    <div class="panel curated-panel">
      <h2>Tema de consulta</h2>
      {#if curatedTopic}
        <StatusBadge tone="success">Disponible</StatusBadge>
        <h3>{curatedTopic.title}</h3>
        <p>{curatedTopic.shortDescription}</p>
        <a class="button button-secondary" href={`/temas/${curatedTopic.slug}`}>Abrir tema de consulta</a>
      {:else}
        <p class="empty-state">No existe una ficha principal para este tema.</p>
      {/if}
    </div>
    <div class="panel draft-panel">
      <h2>Borrador de trabajo</h2>
      <StatusBadge tone="auto">Basado en documentos analizados</StatusBadge>
      <h3>{draft.title}</h3>
      <p>Propuesta inicial para comparar opciones, riesgos y ubicación entre Estatutos y RRI.</p>
      <p><strong>Estado:</strong> revisión jurídica recomendada</p>
    </div>
  </section>

  <section class="section two-column">
    <div class="panel">
      <h2>Contenido mínimo sugerido</h2>
      <ul>
        {#each draft.minimumContents as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
    <div class="panel">
      <h2>Decisiones para El Buen Vivir</h2>
      <ul>
        {#each draft.decisionsForBuenVivir as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="section panel">
    <h2>Riesgos detectados</h2>
    <ul>
      {#each draft.risks as risk}
        <li>{risk}</li>
      {/each}
    </ul>
  </section>

  <section class="section panel">
    <h2>Ubicación: Estatutos vs RRI</h2>
    <p><strong>Orientación inicial:</strong> {placementLabel(draft.governancePlacement.recommendedPrimaryLocation)}</p>
    <div class="two-column">
      <div>
        <h3>Razones</h3>
        <ul>
          {#each draft.governancePlacement.rationale as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
      <div>
        <h3>Tradeoffs</h3>
        <h4>Si va en Estatutos</h4>
        <ul>
          {#each draft.governancePlacement.risksIfPlacedInStatutes ?? [] as item}
            <li>{item}</li>
          {/each}
        </ul>
        <h4>Si va en RRI</h4>
        <ul>
          {#each draft.governancePlacement.risksIfPlacedInRRI ?? [] as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="two-column placement-lists">
      <div>
        <h3>Estatutos</h3>
        <ul>
          {#each draft.governancePlacement.shouldBeInStatutes as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
      <div>
        <h3>RRI</h3>
        <ul>
          {#each draft.governancePlacement.shouldBeInRRI as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <section class="section panel">
    <h2>Temas relacionados</h2>
    {#if !draft.relatedTopics || draft.relatedTopics.length === 0}
      <p class="empty-state">No hay relaciones disponibles.</p>
    {:else}
      <ul>
        {#each draft.relatedTopics as related}
          <li><strong>{related.topicSlug}</strong> ({related.relationship}): {related.explanation}</li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if draft.suggestedClause}
    <section class="section">
      <SuggestedClauseBlock clause={draft.suggestedClause} />
    </section>
  {/if}

  <section class="section panel">
    <h2>Referencias utilizadas</h2>
    {#if draft.generatedFrom}
      <dl>
        <div><dt>Documentos y extractos</dt><dd>{draft.generatedFrom.evidenceCount}</dd></div>
        <div><dt>Nivel de coincidencia</dt><dd>{draft.generatedFrom.highConfidenceEvidence} alto, {draft.generatedFrom.mediumConfidenceEvidence} medio, {draft.generatedFrom.lowConfidenceEvidence} bajo</dd></div>
      </dl>
      <div class="evidence-list">
        {#each draft.generatedFrom.evidence as item}
          <article class="evidence-card">
            <h3>{item.documentTitle}</h3>
            <p><strong>{item.documentType}</strong>{#if item.confidence} · coincidencia {confidenceLabel(item.confidence)}{/if}</p>
            {#if item.articleOrSection}<p>{item.articleOrSection}</p>{/if}
            <blockquote>{item.excerpt}</blockquote>
          </article>
        {/each}
      </div>
    {:else}
      <p class="empty-state">Este borrador no incluye referencias visibles.</p>
    {/if}
  </section>
</article>

<style>
  .draft-hero,
  .draft-panel {
    border-color: #d8bd7c;
  }

  .draft-badges,
  .evidence-list {
    display: grid;
    gap: 0.8rem;
  }

  .draft-badges {
    display: flex;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .comparison-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .placement-lists {
    margin-top: 1rem;
  }

  dl {
    display: grid;
    gap: 0.6rem;
  }

  dt {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 800;
  }

  dd {
    margin: 0;
  }

  .evidence-card {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1rem;
  }

  blockquote {
    border-left: 3px solid #c9bda9;
    color: #443c31;
    margin: 0.8rem 0 0;
    padding-left: 0.85rem;
  }
</style>

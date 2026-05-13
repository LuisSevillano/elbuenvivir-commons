<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { categoryLabels } from '$lib/content/labels';
  import type { GeneratedTopicDraft } from '$lib/content/types';

  type DraftListItem = GeneratedTopicDraft & { hasCuratedTopic: boolean };

  let { data }: { data: { drafts: DraftListItem[] } } = $props();
</script>

<section class="hero draft-hero">
  <p class="eyebrow">Borradores de trabajo</p>
  <h1>Ideas estructuradas para seguir trabajando cada tema.</h1>
  <p class="lead">
    Estos borradores ayudan a comparar posibles enfoques antes de convertirlos en acuerdos o textos finales.
    Requieren revisión jurídica y deliberación del grupo antes de usarse.
  </p>
  <div class="draft-badges">
    <StatusBadge tone="warning">Revisión jurídica recomendada</StatusBadge>
    <StatusBadge tone="auto">Basado en documentos analizados</StatusBadge>
  </div>
</section>

{#if data.drafts.length === 0}
  <section class="section empty-state">
    No hay borradores de trabajo disponibles todavía.
  </section>
{:else}
  <section class="section grid">
    {#each data.drafts as draft}
      <a class="draft-card" href={`/drafts/${draft.slug}`}>
        <div class="meta">
          <span>{categoryLabels[draft.category]}</span>
          <StatusBadge tone="warning">Revisión jurídica recomendada</StatusBadge>
        </div>
        <h2>{draft.title}</h2>
        <p>Propuesta inicial para comparar opciones, riesgos y ubicación entre Estatutos y RRI.</p>
        <div class="card-footer">
          <span>{draft.generatedFrom?.evidenceCount ?? 0} evidencias</span>
          {#if draft.hasCuratedTopic}
            <span>Tema de consulta disponible</span>
          {:else}
            <span>Solo borrador de trabajo</span>
          {/if}
        </div>
      </a>
    {/each}
  </section>
{/if}

<style>
  .draft-hero {
    border-color: #d8bd7c;
  }

  .draft-badges,
  .meta,
  .card-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .draft-badges {
    margin-top: 1rem;
  }

  .draft-card {
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fffdf8;
    color: inherit;
    display: block;
    padding: 1.2rem;
    text-decoration: none;
  }

  .draft-card:hover {
    border-color: #a89778;
  }

  .meta,
  .card-footer {
    color: var(--muted);
    font-size: 0.85rem;
  }

  h2 {
    font-size: 1.25rem;
    margin: 0.8rem 0 0.45rem;
  }

  p {
    color: var(--muted);
  }
</style>

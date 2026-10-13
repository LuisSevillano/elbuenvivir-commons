<script lang="ts">
  import DocumentCard from '$lib/components/DocumentCard.svelte';
  import type { DocumentType, SourceDocument } from '$lib/content/types';

  let { data }: { data: { documents: SourceDocument[] } } = $props();

  type DocumentTab = 'estatutos' | 'rri' | 'leyes' | 'otros';

  const tabs: Array<{ id: DocumentTab; label: string }> = [
    { id: 'estatutos', label: 'Estatutos' },
    { id: 'rri', label: 'RRI' },
    { id: 'leyes', label: 'Leyes y normativa' },
    { id: 'otros', label: 'Otros documentos' }
  ];

  let activeTab = $state<DocumentTab>('estatutos');

  function belongsToTab(type: DocumentType, tab: DocumentTab): boolean {
    if (tab === 'estatutos') return type === 'estatutos';
    if (tab === 'rri') return type === 'rri';
    if (tab === 'leyes') return type === 'ley';
    return type === 'guia' || type === 'modelo' || type === 'otro';
  }

  const tabCounts = $derived.by(() =>
    Object.fromEntries(
      tabs.map((tab) => [
        tab.id,
        data.documents.filter((document) => belongsToTab(document.type, tab.id)).length
      ])
    ) as Record<DocumentTab, number>
  );

  const visibleDocuments = $derived(
    data.documents.filter((document) => belongsToTab(document.type, activeTab))
  );
</script>

<section class="hero">
  <p class="eyebrow">Documentos</p>
  <h1>Documentos para contrastar la lectura editorial.</h1>
  <p class="lead">
    Estatutos, reglamentos, guías y normativa usados como trazabilidad. La lectura útil empieza en los
    temas; los documentos sirven para comprobar contexto y matices.
  </p>
</section>

<section class="section documents-section">
  {#if data.documents.length === 0}
    <div class="empty-state">
      No hay documentos disponibles todavía.
    </div>
  {:else}
    <div class="document-tabs" aria-label="Tipos de documentos">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          class:active={activeTab === tab.id}
          aria-pressed={activeTab === tab.id}
          onclick={() => (activeTab = tab.id)}
        >
          <span>{tab.label}</span>
          <span class="tab-count">{tabCounts[tab.id]}</span>
        </button>
      {/each}
    </div>

    {#if visibleDocuments.length === 0}
      <div class="empty-state">No hay documentos en este apartado.</div>
    {:else}
      <div class="grid">
        {#each visibleDocuments as document (document.slug)}
          <DocumentCard {document} hideType={activeTab !== 'otros'} />
        {/each}
      </div>
    {/if}
  {/if}
</section>

<style>
  .hero .eyebrow {
    color: var(--accent-docs);
  }

  .documents-section {
    min-width: 0;
  }

  .document-tabs {
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 0.15rem;
    margin-bottom: 1.1rem;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .document-tabs button {
    align-items: center;
    appearance: none;
    background: transparent;
    border: 0;
    border-bottom: 3px solid transparent;
    color: var(--muted);
    cursor: pointer;
    display: inline-flex;
    flex: none;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    gap: 0.45rem;
    margin-bottom: -1px;
    padding: 0.75rem 0.8rem;
  }

  .document-tabs button:hover {
    color: var(--ink);
  }

  .document-tabs button.active {
    border-bottom-color: var(--accent-docs);
    color: var(--ink);
  }

  .document-tabs button:focus-visible {
    outline: 2px solid var(--accent-docs);
    outline-offset: -3px;
  }

  .tab-count {
    align-items: center;
    background: #f2f3ef;
    border-radius: 999px;
    color: var(--accent-docs);
    display: inline-flex;
    font-size: 0.72rem;
    justify-content: center;
    line-height: 1;
    min-width: 1.5rem;
    padding: 0.28rem 0.4rem;
  }

  @media (max-width: 640px) {
    .document-tabs {
      margin-inline: -1rem;
      padding-inline: 1rem;
    }

    .document-tabs button {
      padding-inline: 0.65rem;
    }
  }
</style>

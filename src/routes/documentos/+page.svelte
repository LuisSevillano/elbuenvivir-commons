<script lang="ts">
  import DocumentCard from '$lib/components/DocumentCard.svelte';
  import type { SourceDocument } from '$lib/content/types';

  let { data }: { data: { documents: SourceDocument[] } } = $props();
</script>

<section class="hero">
  <p class="eyebrow">Documentos</p>
  <h1>Corpus documental registrado.</h1>
  <p class="lead">
    Esta vista lista documentos ya registrados en <code>src/content/documents/documents.json</code>.
    La ingesta automática queda fuera de esta fase.
  </p>
</section>

<section class="section">
  {#if data.documents.length === 0}
    <div class="empty-state">
      No hay documentos registrados todavía. La aplicación sigue compilando y los PDFs originales en
      <code>docs</code> no se modifican.
    </div>
  {:else}
    <div class="grid">
      {#each data.documents as document}
        <DocumentCard {document} />
      {/each}
    </div>
  {/if}
</section>

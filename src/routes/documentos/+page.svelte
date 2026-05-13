<script lang="ts">
  import DocumentCard from '$lib/components/DocumentCard.svelte';
  import type { SourceDocument } from '$lib/content/types';

  let { data }: { data: { documents: SourceDocument[] } } = $props();
</script>

<section class="hero">
  <p class="eyebrow">Documentos</p>
  <h1>Documentos para comparar soluciones reales.</h1>
  <p class="lead">
    Consulta estatutos, reglamentos, guías y normativa usados para detectar ejemplos, tendencias y
    formas habituales de resolver cuestiones de gobernanza cooperativa.
  </p>
</section>

<section class="section">
  {#if data.documents.length === 0}
    <div class="empty-state">
      No hay documentos disponibles todavía.
    </div>
  {:else}
    <div class="grid">
      {#each data.documents as document}
        <DocumentCard {document} />
      {/each}
    </div>
  {/if}
</section>

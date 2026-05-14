<script lang="ts">
  import DocumentCard from '$lib/components/DocumentCard.svelte';
  import type { SourceDocument } from '$lib/content/types';

  let { data }: { data: { documents: SourceDocument[] } } = $props();
</script>

<section class="hero">
  <p class="eyebrow">Documentos</p>
  <h1>Documentos para contrastar la lectura editorial.</h1>
  <p class="lead">
    Estatutos, reglamentos, guías y normativa usados como trazabilidad. La lectura útil empieza en los
    temas; los documentos sirven para comprobar contexto y matices.
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

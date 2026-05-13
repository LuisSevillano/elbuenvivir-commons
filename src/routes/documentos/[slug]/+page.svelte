<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import TagList from '$lib/components/TagList.svelte';
  import { documentTypeLabels } from '$lib/content/labels';
  import type { GeneratedTopicReference, GovernanceTopic, SourceDocument } from '$lib/content/types';

  let { data }: {
    data: {
      document: SourceDocument;
      curatedTopics: GovernanceTopic[];
      generatedReferences: GeneratedTopicReference[];
    };
  } = $props();
</script>

<article>
  <header class="hero">
    <p class="eyebrow">{documentTypeLabels[data.document.type]}</p>
    <h1>{data.document.title}</h1>
    <p class="lead">{data.document.notes ?? data.document.fileName}</p>
    <div class="document-badges">
      {#if data.document.jurisdiction}<StatusBadge>{data.document.jurisdiction}</StatusBadge>{/if}
      {#if data.document.year}<StatusBadge>{data.document.year}</StatusBadge>{/if}
      {#if data.document.needsReview}<StatusBadge tone="warning">Revisar metadatos</StatusBadge>{/if}
    </div>
  </header>

  <section class="section panel">
    <h2>Metadatos</h2>
    <dl>
      <div><dt>Archivo</dt><dd>{data.document.fileName}</dd></div>
      <div><dt>Ruta</dt><dd><code>{data.document.sourcePath}</code></dd></div>
      <div><dt>Tipo</dt><dd>{documentTypeLabels[data.document.type]}</dd></div>
      {#if data.document.projectName}<div><dt>Proyecto</dt><dd>{data.document.projectName}</dd></div>{/if}
      {#if data.document.extractionStatus}<div><dt>Extracción</dt><dd>{data.document.extractionStatus}</dd></div>{/if}
    </dl>
    <TagList tags={data.document.tags} />
  </section>

  <section class="section panel">
    <h2>Temas relacionados por contenido curado</h2>
    {#if data.curatedTopics.length === 0}
      <p class="empty-state">Este documento todavía no está enlazado desde temas curados.</p>
    {:else}
      <ul>
        {#each data.curatedTopics as topic}
          <li><a href={`/temas/${topic.slug}`}>{topic.title}</a></li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="section panel">
    <h2>Referencias automáticas</h2>
    {#if data.generatedReferences.length === 0}
      <p class="empty-state">No hay referencias automáticas para este documento.</p>
    {:else}
      <ul>
        {#each data.generatedReferences as reference}
          <li><a href={`/temas/${reference.topicSlug}`}>{reference.topicSlug}</a>: {reference.excerpt}</li>
        {/each}
      </ul>
    {/if}
  </section>
</article>

<style>
  .document-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  dl {
    display: grid;
    gap: 0.6rem;
    margin: 0 0 1rem;
  }

  dt {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 700;
  }

  dd {
    margin: 0;
  }
</style>

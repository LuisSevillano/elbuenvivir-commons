<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import TagList from '$lib/components/TagList.svelte';
  import DrivePreview from '$lib/components/DocumentPreviewModal.svelte';
  import {
    getDocumentDisplayTitle,
    getDocumentProjectName,
    getDocumentSummary
  } from '$lib/content/documentDisplay';
  import { documentTypeLabels } from '$lib/content/labels';
  import type { GeneratedTopicReference, GovernanceTopic, SourceDocument } from '$lib/content/types';

  let { data }: {
    data: {
      document: SourceDocument;
      curatedTopics: GovernanceTopic[];
      curatedTopicSlugs: string[];
      topicTitles: Record<string, string>;
      generatedReferences: GeneratedTopicReference[];
    };
  } = $props();

  const curatedTopicSlugs = $derived(new Set(data.curatedTopicSlugs));
  const topicTitles = $derived(data.topicTitles);
  const displayTitle = $derived(getDocumentDisplayTitle(data.document));
  const summary = $derived(getDocumentSummary(data.document));
  const projectName = $derived(getDocumentProjectName(data.document));
  const hasDriveLink = $derived(Boolean(data.document.googleDriveUrl));
</script>

<article>
  <header class="hero">
    <p class="eyebrow">{documentTypeLabels[data.document.type]}</p>
    <h1>{displayTitle}</h1>
    <p class="lead">{data.document.notes ?? summary}</p>
    <div class="document-badges">
      {#if data.document.jurisdiction}<StatusBadge>{data.document.jurisdiction}</StatusBadge>{/if}
      {#if data.document.year}<StatusBadge>{data.document.year}</StatusBadge>{/if}
      {#if data.document.needsReview}<StatusBadge tone="warning">Información limitada</StatusBadge>{/if}
    </div>
    {#if hasDriveLink}
      <DrivePreview
        previewUrl={data.document.previewUrl ?? ''}
        driveUrl={data.document.googleDriveUrl}
        documentTitle={displayTitle} />
    {/if}
  </header>

  <section class="section panel">
    <h2>Información del documento</h2>
    <dl>
      <div><dt>Archivo</dt><dd>{data.document.fileName}</dd></div>
      <div><dt>Tipo</dt><dd>{documentTypeLabels[data.document.type]}</dd></div>
      {#if projectName}<div><dt>Proyecto</dt><dd>{projectName}</dd></div>{/if}
      <div><dt>Resumen</dt><dd>{summary}</dd></div>
    </dl>
    <TagList tags={data.document.tags} />
  </section>

  <section class="section panel">
    <h2>Temas relacionados</h2>
    {#if data.curatedTopics.length === 0}
      <p class="empty-state">Este documento todavía no aparece vinculado a temas principales.</p>
    {:else}
      <ul>
        {#each data.curatedTopics as topic}
          <li><a href={`/temas/${topic.slug}`}>{topic.title}</a></li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="section panel">
    <h2>Lecturas relacionadas</h2>
    {#if data.generatedReferences.length === 0}
      <p class="empty-state">No hay referencias detectadas para este documento.</p>
    {:else}
        <ul>
        {#each data.generatedReferences as reference}
          <li>
            <StatusBadge tone="auto">Lectura relacionada</StatusBadge>
            {#if curatedTopicSlugs.has(reference.topicSlug)}
              <a href={`/temas/${reference.topicSlug}`}>{topicTitles[reference.topicSlug] ?? reference.topicSlug}</a>
            {:else}
              <span>{topicTitles[reference.topicSlug] ?? reference.topicSlug}</span>
            {/if}
            <span>: {reference.excerpt}</span>
          </li>
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
    margin: 0 0 0.8rem;
  }

  dl {
    display: grid;
    gap: 0.6rem;
    margin: 0 0 1rem;
  }

  dl > div {
    min-width: 0;
  }

  dt {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 700;
  }

  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  li,
  li :global(a),
  li span {
    overflow-wrap: anywhere;
  }
</style>

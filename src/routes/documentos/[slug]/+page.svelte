<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import TagList from '$lib/components/TagList.svelte';
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
</script>

<article>
  <header class="hero">
    <p class="eyebrow">{documentTypeLabels[data.document.type]}</p>
    <h1>{data.document.title}</h1>
    <p class="lead">{data.document.notes ?? data.document.fileName}</p>
    <div class="document-badges">
      {#if data.document.jurisdiction}<StatusBadge>{data.document.jurisdiction}</StatusBadge>{/if}
      {#if data.document.year}<StatusBadge>{data.document.year}</StatusBadge>{/if}
      {#if data.document.needsReview}<StatusBadge tone="warning">Información limitada</StatusBadge>{/if}
    </div>
  </header>

  <section class="section panel">
    <h2>Información del documento</h2>
    <dl>
      <div><dt>Archivo</dt><dd>{data.document.fileName}</dd></div>
      <div><dt>Tipo</dt><dd>{documentTypeLabels[data.document.type]}</dd></div>
      {#if data.document.projectName}<div><dt>Proyecto</dt><dd>{data.document.projectName}</dd></div>{/if}
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
    <h2>Referencias detectadas</h2>
    {#if data.generatedReferences.length === 0}
      <p class="empty-state">No hay referencias detectadas para este documento.</p>
    {:else}
        <ul>
        {#each data.generatedReferences as reference}
          <li>
            <StatusBadge tone="auto">Referencia detectada</StatusBadge>
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

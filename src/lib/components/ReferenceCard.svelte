<script lang="ts">
  import { documentTypeLabels } from '$lib/content/labels';
  import type { GeneratedTopicReference, ProjectReference } from '$lib/content/types';
  import StatusBadge from './StatusBadge.svelte';
  import TagList from './TagList.svelte';

  let { reference, automatic = false }: {
    reference: ProjectReference | GeneratedTopicReference;
    automatic?: boolean;
  } = $props();

  const documentType = $derived('documentType' in reference ? reference.documentType : undefined);
  const projectName = $derived('projectName' in reference ? reference.projectName : undefined);
  const title = $derived(reference.documentTitle);
  const summary = $derived(
    'summary' in reference
      ? reference.summary
      : 'Referencia detectada automáticamente pendiente de revisión editorial.'
  );
</script>

<article class="reference-card">
  <div class="meta">
    {#if automatic}
      <StatusBadge tone="auto">Referencia automática</StatusBadge>
    {:else}
      <StatusBadge tone="success">Referencia curada</StatusBadge>
    {/if}
    {#if documentType}
      <StatusBadge>{documentTypeLabels[documentType]}</StatusBadge>
    {/if}
    {#if reference.confidence}
      <StatusBadge>Confianza {reference.confidence}</StatusBadge>
    {/if}
  </div>
  <h3>{title}</h3>
  {#if projectName}
    <p class="source">{projectName}</p>
  {/if}
  <p>{summary}</p>
  {#if reference.articleOrSection}
    <p class="source">{reference.articleOrSection}</p>
  {/if}
  <blockquote>{reference.excerpt}</blockquote>
  <TagList tags={reference.tags} />
</article>

<style>
  .reference-card {
    border: 1px solid var(--border);
    border-radius: 1rem;
    background: #fff;
    padding: 1rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  h3 {
    font-size: 1.05rem;
    margin: 0.8rem 0 0.3rem;
  }

  p {
    margin: 0 0 0.6rem;
  }

  .source {
    color: var(--muted);
    font-size: 0.9rem;
  }

  blockquote {
    border-left: 3px solid #c9bda9;
    color: #443c31;
    margin: 0.8rem 0;
    padding-left: 0.85rem;
  }
</style>

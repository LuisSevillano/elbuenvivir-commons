<script lang="ts">
	import { documentTypeLabels } from '$lib/content/labels';
	import type { SourceDocument } from '$lib/content/types';
	import StatusBadge from './StatusBadge.svelte';
	import TagList from './TagList.svelte';

	let { document }: { document: SourceDocument } = $props();
</script>

<a class="document-card" href={`/documentos/${document.slug}`}>
	<div class="meta">
		<StatusBadge>{documentTypeLabels[document.type]}</StatusBadge>
		{#if document.needsReview}
			<StatusBadge tone="warning">Revisar metadatos</StatusBadge>
		{/if}
	</div>
	<h2>{document.title}</h2>
	<p>{document.projectName ?? document.jurisdiction ?? document.fileName}</p>
	<TagList tags={document.tags} />
</a>

<style>
	.document-card {
		display: block;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: #fffdf8;
		color: inherit;
		padding: 1rem;
		text-decoration: none;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	h2 {
		font-size: 1.1rem;
		margin: 0.75rem 0 0.35rem;
	}

	p {
		color: var(--muted);
		margin: 0 0 0.8rem;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>

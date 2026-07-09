<script lang="ts">
	import { documentTypeLabels } from '$lib/content/labels';
	import { getDocumentDisplayTitle, getDocumentSummary } from '$lib/content/documentDisplay';
	import type { SourceDocument } from '$lib/content/types';
	import StatusBadge from './StatusBadge.svelte';
	import TagList from './TagList.svelte';

	let { document }: { document: SourceDocument } = $props();

	const displayTitle = $derived(getDocumentDisplayTitle(document));
	const summary = $derived(getDocumentSummary(document));
</script>

<a class="document-card" href={`/documentos/${document.slug}`}>
	<div class="meta">
		<StatusBadge>{documentTypeLabels[document.type]}</StatusBadge>
	</div>
	<h2>{displayTitle}</h2>
	<p class="document-summary">{summary}</p>
	<TagList tags={document.tags} />
</a>

<style>
	.document-card {
		display: block;
		border: 1px solid var(--border);
		border-radius: 4px;
		box-shadow: inset 0 3px 0 var(--accent-docs);
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
		font-size: 1.03rem;
		line-height: 1.25;
		margin: 0.75rem 0 0.35rem;
	}

	.document-summary {
		color: var(--muted);
		font-size: 0.84rem;
		line-height: 1.35;
		margin: 0 0 0.8rem;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>

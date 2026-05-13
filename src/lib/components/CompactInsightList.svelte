<script lang="ts">
	interface Props {
		items: string[];
		limit?: number;
		tone?: 'plain' | 'highlight';
	}

	let { items, limit = 6, tone = 'plain' }: Props = $props();
	const visibleItems = $derived(items.slice(0, limit));
</script>

{#if visibleItems.length > 0}
	<ul class="insight-list" class:highlight={tone === 'highlight'}>
		{#each visibleItems as item}
			<li>{item}</li>
		{/each}
	</ul>
{/if}

<style>
	.insight-list {
		display: grid;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		position: relative;
		padding-left: 1rem;
		font-size: 0.92rem;
		line-height: 1.42;
	}

	li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 1.1em;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 999px;
		background: #b8aa90;
	}

	.highlight li {
		padding: 0.55rem 0.7rem 0.55rem 1.75rem;
		border: 1px solid #e4dac8;
		border-radius: 4px;
		background: #fffaf0;
	}

	.highlight li::before {
		left: 0.75rem;
	}
</style>

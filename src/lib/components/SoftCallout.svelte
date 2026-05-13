<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'info' | 'warning' | 'note' | 'risk' | 'tension';
    title?: string;
    children: Snippet;
  }

  let { type = 'info', title, children }: Props = $props();

  const typeClass = $derived(`callout-${type}`);
</script>

<div class="soft-callout {typeClass}">
  {#if title}
    <span class="callout-title">{title}</span>
  {/if}
  <div class="callout-content">
    {@render children()}
  </div>
</div>

<style>
  .soft-callout {
    padding: 0.85rem 1rem;
    border-radius: 6px;
    margin: 1rem 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .callout-info {
    background: #f5f7fa;
    border-left: 3px solid #64748b;
  }

  .callout-warning {
    background: #fffbf0;
    border-left: 3px solid #f59e0b;
  }

  .callout-note {
    background: #f0fdf4;
    border-left: 3px solid #22c55e;
  }

  .callout-risk {
    background: #fff7ed;
    border-left: 3px solid #f97316;
  }

  .callout-tension {
    background: #faf5ff;
    border-left: 3px solid #a855f7;
  }

  .callout-title {
    display: block;
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 0.35rem;
    color: var(--heading);
  }

  .callout-content {
    color: var(--text);
  }

  .callout-info .callout-title { color: #475569; }
  .callout-warning .callout-title { color: #b45309; }
  .callout-note .callout-title { color: #15803d; }
  .callout-risk .callout-title { color: #c2410c; }
  .callout-tension .callout-title { color: #7e22ce; }
</style>
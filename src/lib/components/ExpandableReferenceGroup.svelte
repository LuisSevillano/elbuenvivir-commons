<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    count?: number;
    defaultExpanded?: boolean;
    children: Snippet;
  }

  let { title, count, defaultExpanded = false, children }: Props = $props();

  let expanded = $state(defaultExpanded);

  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="expandable-group" class:expanded>
  <button class="group-toggle" onclick={toggle} type="button">
    <span class="toggle-icon">{expanded ? '−' : '+'}</span>
    <span class="toggle-title">{title}</span>
    {#if count !== undefined}
      <span class="toggle-count">{count}</span>
    {/if}
  </button>

  {#if expanded}
    <div class="group-content">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .expandable-group {
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 0.75rem;
    overflow: hidden;
  }

  .group-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--surface);
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--heading);
    text-align: left;
    transition: background 0.15s;
  }

  .group-toggle:hover {
    background: var(--bg);
  }

  .toggle-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border);
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
  }

  .toggle-title {
    flex: 1;
  }

  .toggle-count {
    font-size: 0.8rem;
    color: var(--muted);
    font-weight: 400;
  }

  .group-content {
    padding: 1rem;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }
</style>
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'pattern' | 'difference' | 'risk' | 'approach';
    label?: string;
    children: Snippet;
  }

  let { type = 'pattern', label, children }: Props = $props();

  const typeConfig = {
    pattern: { icon: '◈', color: '#3b82f6', bg: '#eff6ff' },
    difference: { icon: '↔', color: '#8b5cf6', bg: '#f5f3ff' },
    risk: { icon: '⚠', color: '#f59e0b', bg: '#fffbeb' },
    approach: { icon: '◎', color: '#10b981', bg: '#ecfdf5' }
  };

  const config = $derived(typeConfig[type]);
</script>

<div class="insight-block" style="--insight-bg: {config.bg}; --insight-color: {config.color};">
  <div class="insight-header">
    <span class="insight-icon">{config.icon}</span>
    {#if label}
      <span class="insight-label">{label}</span>
    {/if}
  </div>
  <div class="insight-content">
    {@render children()}
  </div>
</div>

<style>
  .insight-block {
    padding: 1rem;
    background: var(--insight-bg);
    border-radius: 6px;
    margin: 1rem 0;
  }

  .insight-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .insight-icon {
    font-size: 1rem;
    color: var(--insight-color);
  }

  .insight-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--insight-color);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .insight-content {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text);
  }
</style>
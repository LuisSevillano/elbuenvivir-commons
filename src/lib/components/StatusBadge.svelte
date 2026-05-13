<script lang="ts">
  let { tone = 'neutral', children }: {
    tone?: 'neutral' | 'warning' | 'success' | 'auto';
    children: import('svelte').Snippet;
  } = $props();
</script>

<span class={["badge", `badge-${tone}`]}>{@render children()}</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    border: 1px solid var(--border);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 0.25rem 0.55rem;
    white-space: nowrap;
  }

  .badge-neutral {
    background: #f5f3ef;
    color: #423b32;
  }

  .badge-warning {
    background: #fff7d6;
    border-color: #e9cd72;
    color: #725618;
  }

  .badge-success {
    background: #e9f5ef;
    border-color: #a6d6bd;
    color: #1f5c3d;
  }

  .badge-auto {
    background: #eef3fa;
    border-color: #bccde3;
    color: #254768;
  }
</style>

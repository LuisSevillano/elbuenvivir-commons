<script lang="ts">
  let { title = 'Aviso', children }: {
    title?: string;
    children: import('svelte').Snippet;
  } = $props();
</script>

<section class="warning-box" aria-label={title}>
  <strong>{title}</strong>
  <div>{@render children()}</div>
</section>

<style>
  .warning-box {
    border: 1px solid #decf9a;
    border-radius: 1rem;
    background: #fff9e6;
    color: #483b18;
    padding: 1rem;
  }

  .warning-box strong {
    display: block;
    margin-bottom: 0.35rem;
  }

  .warning-box :global(p) {
    margin: 0;
  }
</style>

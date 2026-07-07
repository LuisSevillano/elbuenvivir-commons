<script lang="ts">
  let { tags = [] }: { tags?: string[] } = $props();

  const overrides: Record<string, string> = {
    rri: 'RRI',
    cesion_uso: 'Cesión de uso'
  };
  function formatTag(tag: string): string {
    const key = tag.toLowerCase();
    if (overrides[key]) return overrides[key];
    const words = tag.replace(/_/g, ' ');
    return words.charAt(0).toLocaleUpperCase('es') + words.slice(1);
  }
</script>

{#if tags.length > 0}
  <ul class="tags" aria-label="Etiquetas">
    {#each tags as tag}
      <li>{formatTag(tag)}</li>
    {/each}
  </ul>
{/if}

<style>
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .tags li {
    border-radius: 4px;
    background: #f1eee8;
    color: #5e5549;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
  }
</style>

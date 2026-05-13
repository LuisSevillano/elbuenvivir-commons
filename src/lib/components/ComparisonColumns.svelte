<script lang="ts">
  interface Column {
    title: string;
    color?: 'blue' | 'green' | 'neutral';
    items: string[];
  }

  interface Props {
    columns: Column[];
  }

  let { columns }: Props = $props();

  const colorVars = {
    blue: { bg: '#f0f5ff', border: '#bfdbfe', text: '#1e40af' },
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    neutral: { bg: '#f5f5f5', border: '#d4d4d4', text: '#404040' }
  };
</script>

<div class="comparison-columns">
  {#each columns as column}
    {@const colors = colorVars[column.color ?? 'neutral']}
    <div class="column" style="--col-bg: {colors.bg}; --col-border: {colors.border}; --col-text: {colors.text};">
      <h3 class="column-title">{column.title}</h3>
      <div class="column-content">
        {#if column.items.length === 0}
          <p class="empty-text">Sin información disponible</p>
        {:else}
          <ul>
            {#each column.items as item}
              <li>{item}</li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .comparison-columns {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin: 1.5rem 0;
  }

  @media (max-width: 640px) {
    .comparison-columns {
      grid-template-columns: 1fr;
    }
  }

  .column {
    background: var(--col-bg);
    border: 1px solid var(--col-border);
    border-radius: 4px;
    padding: 1.25rem;
  }

  .column-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--col-text);
    margin: 0 0 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--col-border);
  }

  .column-content {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .column-content ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  .column-content li {
    margin-bottom: 0.5rem;
  }

  .empty-text {
    font-size: 0.85rem;
    color: #6b7280;
    font-style: italic;
  }
</style>

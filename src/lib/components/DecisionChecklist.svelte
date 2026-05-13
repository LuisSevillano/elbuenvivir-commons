<script lang="ts">
  interface Props {
    title: string;
    items: string[];
    priority?: 'high' | 'medium' | 'low';
  }

  let { title, items, priority = 'medium' }: Props = $props();

  const priorityConfig = {
    high: { label: 'Decisiones prioritarias', color: '#dc2626' },
    medium: 'medium',
    low: { label: 'Pueden esperar', color: '#6b7280' }
  };
</script>

<div class="decision-checklist">
  <h3 class="checklist-title">{title}</h3>

  {#if priority === 'high'}
    <p class="priority-label" style="color: {priorityConfig.high.color}">{priorityConfig.high.label}</p>
  {/if}

  <ul class="checklist-items">
    {#each items as item}
      <li class="checklist-item">
        <span class="checkbox"></span>
        <span class="item-text">{item}</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .decision-checklist {
    margin: 1.5rem 0;
    padding: 1.25rem;
    background: var(--surface);
    border-radius: 4px;
    border: 1px solid var(--border);
  }

  .checklist-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--heading);
    margin: 0 0 0.75rem;
  }

  .priority-label {
    font-size: 0.8rem;
    font-weight: 600;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .checklist-items {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .checkbox {
    width: 18px;
    height: 18px;
    min-width: 18px;
    border: 2px solid var(--border);
    border-radius: 4px;
    margin-top: 2px;
    display: block;
  }

  .item-text {
    color: var(--text);
  }
</style>

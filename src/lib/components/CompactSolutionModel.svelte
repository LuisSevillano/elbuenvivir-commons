<script lang="ts">
  import type { SolutionApproach } from '$lib/content/types';

  interface Props {
    approach: SolutionApproach;
  }

  let { approach }: Props = $props();

  const advantages = $derived(approach.advantages.slice(0, 3));
  const risks = $derived(approach.risks.slice(0, 3));
  const suitableFor = $derived(approach.suitableFor.slice(0, 2));
</script>

<article class="solution-model">
  <header>
    <h3>{approach.name}</h3>
    <span>{approach.evidenceLevel === 'high' ? 'amplia' : approach.evidenceLevel === 'medium' ? 'media' : 'limitada'}</span>
  </header>

  <p class="summary">{approach.summary}</p>

  <div class="model-grid">
    <div>
      <h4>Ventajas</h4>
      <ul>
        {#each advantages as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
    <div>
      <h4>Riesgos</h4>
      <ul>
        {#each risks as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </div>

  {#if suitableFor.length > 0}
    <p class="fit"><strong>Adecuado para:</strong> {suitableFor.join(', ')}</p>
  {/if}
</article>

<style>
  .solution-model {
    min-width: 0;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fff;
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.45rem;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  header span {
    flex: 0 0 auto;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    background: #f2f0ea;
    color: #6f624d;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .summary {
    margin: 0 0 0.85rem;
    color: var(--text);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .model-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  h4 {
    margin: 0 0 0.35rem;
    color: var(--muted);
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  ul {
    margin: 0;
    padding-left: 1rem;
  }

  li {
    margin-bottom: 0.25rem;
    font-size: 0.86rem;
    line-height: 1.35;
  }

  .fit {
    margin: 0.85rem 0 0;
    color: var(--muted);
    font-size: 0.84rem;
    line-height: 1.4;
  }

  @media (max-width: 640px) {
    header,
    .model-grid {
      grid-template-columns: 1fr;
    }

    header {
      flex-direction: column;
    }
  }
</style>

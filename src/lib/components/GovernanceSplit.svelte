<script lang="ts">
  interface Props {
    statutes: string[];
    rri: string[];
    limit?: number;
  }

  let { statutes, rri, limit = 4 }: Props = $props();
  const statutesItems = $derived(statutes.slice(0, limit));
  const rriItems = $derived(rri.slice(0, limit));
</script>

<div class="governance-split">
  <section class="statutes">
    <h3>Estatutos</h3>
    <ul>
      {#each statutesItems as item}
        <li>{item}</li>
      {/each}
    </ul>
  </section>
  <section class="rri">
    <h3>RRI</h3>
    <ul>
      {#each rriItems as item}
        <li>{item}</li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .governance-split {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  section {
    min-width: 0;
    padding: 0.95rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fff;
  }

  section.statutes {
    border-color: #dbeafe;
    background: #f8fbff;
  }

  section.rri {
    border-color: #dcfce7;
    background: #f8fdf9;
  }

  h3 {
    margin: 0 0 0.55rem;
    color: var(--heading);
    font-size: 0.92rem;
  }

  .statutes h3 {
    color: #1d4ed8;
  }

  .rri h3 {
    color: #15803d;
  }

  ul {
    margin: 0;
    padding-left: 1rem;
  }

  li {
    margin-bottom: 0.35rem;
    font-size: 0.88rem;
    line-height: 1.38;
    overflow-wrap: anywhere;
  }

  @media (max-width: 640px) {
    .governance-split {
      grid-template-columns: 1fr;
    }
  }
</style>

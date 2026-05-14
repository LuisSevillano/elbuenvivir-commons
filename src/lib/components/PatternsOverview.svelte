<script lang="ts">
  import type { CrossTopicPattern } from '$lib/content/loadPatterns';

  interface Props {
    recurringConcepts: CrossTopicPattern[];
    detectedTensions: string[];
    opposingApproaches: CrossTopicPattern[];
  }

  let { recurringConcepts, detectedTensions, opposingApproaches }: Props = $props();

  const hasPatterns = $derived(
    recurringConcepts.length > 0 || detectedTensions.length > 0 || opposingApproaches.length > 0
  );
</script>

{#if hasPatterns}
  <section class="patterns-overview">
    <h2>Patrones en revisión</h2>
    <p class="lead">
      Al comparar documentos de distintos proyectos, se observan tendencias recurrentes:
    </p>

    {#if recurringConcepts.length > 0}
      <div class="pattern-group">
        <h3>Conceptos que aparecen con frecuencia</h3>
        <ul class="concepts">
          {#each recurringConcepts as concept}
            <li>
              <strong>{concept.name}</strong>
              <span class="freq">en {concept.frequency} temas</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if detectedTensions.length > 0}
      <div class="pattern-group">
        <h3>Tensiones frecuentes</h3>
        <ul class="tensions">
          {#each detectedTensions.slice(0, 6) as tension}
            <li>{tension}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if opposingApproaches.length > 0}
      <div class="pattern-group">
        <h3>Enfoques opuestos que se observan</h3>
        <ul class="approaches">
          {#each opposingApproaches as approach}
            <li>
              <strong>{approach.name}</strong>
              {#if approach.description}
                <span class="desc">{approach.description.slice(0, 100)}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>
{/if}

<style>
  .patterns-overview {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  h2 {
    font-size: 1.2rem;
    margin: 0 0 0.5rem;
    color: var(--heading);
  }

  .lead {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0 0 1.5rem;
  }

  .pattern-group {
    margin-bottom: 1.5rem;
  }

  .pattern-group:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--accent);
    margin: 0 0 0.75rem;
  }

  .concepts {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .concepts li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.6rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .concepts .freq {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .tensions, .approaches {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .tensions li, .approaches li {
    padding: 0.4rem 0;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border);
  }

  .tensions li:last-child, .approaches li:last-child {
    border-bottom: none;
  }

  .desc {
    display: block;
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }
</style>

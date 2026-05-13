<script lang="ts">
  import PatternsOverview from '$lib/components/PatternsOverview.svelte';
  import ProjectProfilesCard from '$lib/components/ProjectProfilesCard.svelte';

  let { data } = $props();

  const patterns = $derived(data.patterns);
  const profiles = $derived(data.profiles);
</script>

<section class="hero">
  <p class="eyebrow">Patrones y enfoques</p>
  <h1>Cartografía de decisiones colectivas</h1>
  <p class="lead">
    Al analizar documentos de distintos proyectos, se detectan patrones recurrentes,
    tensiones frecuentes y enfoques opuestos. Esta sección explora esas tendencias.
  </p>
</section>

{#if patterns && (patterns.recurringConcepts.length > 0 || patterns.detectedTensions.length > 0 || patterns.opposingApproaches.length > 0)}
  <section class="section">
    <PatternsOverview
      recurringConcepts={patterns.recurringConcepts}
      detectedTensions={patterns.detectedTensions}
      opposingApproaches={patterns.opposingApproaches}
    />
  </section>

  {#if patterns.commonClausePatterns.length > 0}
    <section class="section">
      <h2>Cláusulas frecuentes</h2>
      <p class="lead">Elementos que aparecen con frecuencia en los documentos analizados:</p>
      <ul class="clause-patterns">
        {#each patterns.commonClausePatterns as pattern}
          <li>{pattern}</li>
        {/each}
      </ul>
    </section>
  {/if}
{/if}

{#if profiles && profiles.projects.length > 0}
  <section class="section">
    <ProjectProfilesCard projects={profiles.projects} />
  </section>
{/if}

<style>
  .clause-patterns {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .clause-patterns li {
    padding: 0.75rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 0.95rem;
  }

  h2 {
    font-size: 1.2rem;
    margin: 0 0 0.5rem;
    color: var(--heading);
  }

  .lead {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0 0 1rem;
  }
</style>

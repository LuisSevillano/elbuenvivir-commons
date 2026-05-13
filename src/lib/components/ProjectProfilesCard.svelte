<script lang="ts">
  import type { ProjectProfile } from '$lib/content/loadProjectProfiles';

  interface Props {
    projects: ProjectProfile[];
    topicSlug?: string;
  }

  let { projects, topicSlug }: Props = $props();

  const relatedProjects = $derived(
    topicSlug
      ? projects.filter(p => p.topics.includes(topicSlug))
      : projects
  );

  const displayProjects = $derived(
    topicSlug
      ? relatedProjects.slice(0, 5)
      : relatedProjects.slice(0, 8)
  );

  function getToneLabel(tone: string): string {
    if (tone.includes('rigidez')) return 'Más rigidez';
    if (tone.includes('flexibilidad')) return 'Más flexibilidad';
    if (tone.includes('Equilibrio')) return 'Equilibrado';
    return tone;
  }
</script>

{#if displayProjects.length > 0}
  <section class="project-profiles">
    {#if topicSlug}
      <h2>Proyectos con enfoque similar</h2>
      <p class="lead">
        Estos proyectos también tocaron este tema y muestran enfoques comparables:
      </p>
    {:else}
      <h2>Proyectos analizados</h2>
      <p class="lead">
        Proyectos detectados en los documentos analizados:
      </p>
    {/if}

    <div class="projects-grid">
      {#each displayProjects as project}
        <article class="project-card">
          <h3>{project.projectName}</h3>
          <span class="tone">{getToneLabel(project.regulatoryTone)}</span>
          <p class="topics">{project.topicCount} tema{project.topicCount !== 1 ? 's' : ''}</p>
          {#if project.characteristics.length > 0}
            <ul class="characteristics">
              {#each project.characteristics.slice(0, 3) as char}
                <li>{char}</li>
              {/each}
            </ul>
          {/if}
        </article>
      {/each}
    </div>

    {#if relatedProjects.length > displayProjects.length}
      <p class="more">
        Y {relatedProjects.length - displayProjects.length} más...
      </p>
    {/if}
  </section>
{/if}

<style>
  .project-profiles {
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
    margin: 0 0 1rem;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .project-card {
    padding: 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  h3 {
    font-size: 1rem;
    margin: 0 0 0.5rem;
    color: var(--heading);
  }

  .tone {
    display: block;
    font-size: 0.8rem;
    color: var(--accent);
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .topics {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0 0 0.5rem;
  }

  .characteristics {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .characteristics li {
    padding: 0.15rem 0;
  }

  .more {
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 1rem;
  }
</style>

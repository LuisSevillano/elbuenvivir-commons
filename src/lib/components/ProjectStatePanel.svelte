<script lang="ts">
  interface OpenTopic {
    slug: string;
    title: string;
    category: string;
    decisions: string[];
  }
  interface State {
    topicCount: number;
    dossierCount: number;
    docCount: number;
    cooperativeCount: number;
    totalOpen: number;
    openByTopic: OpenTopic[];
  }
  let { state }: { state: State } = $props();

  const categoryLabels: Record<string, string> = {
    socios: 'Personas socias',
    economico: 'Economía',
    gobernanza: 'Gobernanza',
    convivencia: 'Convivencia',
    uso_espacios: 'Uso de espacios',
    disciplina: 'Disciplina',
    ciclo_vida: 'Ciclo de vida',
    legal: 'Estatutos y RRI',
    identidad_juridica: 'Identidad jurídica',
    cuidados: 'Cuidados',
    otros: 'Otros'
  };
</script>

<section class="state-panel">
  <header class="panel-head">
    <h2>¿Qué toca decidir?</h2>
    <p class="panel-sub">
      <strong>{state.totalOpen}</strong> decisiones abiertas en <strong>{state.openByTopic.length}</strong> temas, ordenadas de la más importante y compleja a la más sencilla. Cada una lleva ya su propuesta redactada y sus fuentes.
    </p>
  </header>

  <ul class="decision-list">
    {#each state.openByTopic as topic}
      <li>
        <a class="decision-topic" href={`/temas/${topic.slug}`}>
          <span class="dt-head">
            <span class="dt-cat">{categoryLabels[topic.category] ?? topic.category}</span>
            <span class="dt-count">{topic.decisions.length}</span>
          </span>
          <span class="dt-title">{topic.title}</span>
          <span class="dt-preview">{topic.decisions[0]}</span>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .state-panel { margin: 0 0 3rem; }
  .panel-head { max-width: 62ch; margin-bottom: 1.4rem; }
  .panel-head h2 {
    font-family: var(--font-display);
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0 0 0.5rem;
  }
  .panel-sub { color: var(--muted); font-size: 1rem; line-height: 1.55; margin: 0; }
  .panel-sub strong { color: var(--ink); }

  .decision-list {
    list-style: none; margin: 0; padding: 0;
    display: grid; gap: 0.7rem;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  }
  .decision-topic {
    display: flex; flex-direction: column; gap: 0.3rem;
    height: 100%;
    padding: 0.85rem 0.95rem;
    border: 1px solid var(--border); border-radius: 6px;
    background: var(--surface);
    text-decoration: none; color: var(--ink);
    transition: border-color 0.12s, transform 0.12s;
  }
  .decision-topic:hover { border-color: var(--accent-warm); transform: translateY(-1px); }
  .dt-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .dt-cat { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
  .dt-count {
    font-family: var(--font-display); font-size: 0.95rem; font-weight: 600;
    color: var(--accent-warm);
    min-width: 1.5rem; text-align: center;
  }
  .dt-title { font-weight: 600; font-size: 1rem; line-height: 1.25; }
  .dt-preview {
    font-size: 0.82rem; color: var(--muted); line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
</style>

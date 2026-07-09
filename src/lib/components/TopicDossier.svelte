<script lang="ts">
  import type { TopicDossier } from '$lib/content/types';

  let { dossier }: { dossier: TopicDossier } = $props();

  const legal = $derived(dossier.legal);
  const comparison = $derived(dossier.comparison);
  const proposal = $derived(dossier.proposal);

  // Marca los [corchetes] del texto como "pendiente de decidir".
  function segments(text: string) {
    return text.split(/(\[[^\]]*\])/g).map((part) => ({ part, ph: /^\[[^\]]*\]$/.test(part) }));
  }

  const fullProposalText = $derived(
    proposal.articles
      .map((a) => `[${a.target === 'estatutos' ? 'ESTATUTOS' : 'RRI'}] ${a.heading}\n\n${a.text}`)
      .join('\n\n———\n\n')
  );

  let copiedKey = $state<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedKey = key;
      setTimeout(() => {
        if (copiedKey === key) copiedKey = null;
      }, 1600);
    } catch {
      copiedKey = null;
    }
  }
</script>

<div class="dossier">
  <!-- Bloque 1: la ley -->
  <section class="block legal">
    <header class="block-head">
      <h2>Qué dice la ley</h2>
    </header>
    {#each legal.intro as paragraph}
      <p class="intro">{paragraph}</p>
    {/each}

    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>Cuestión</th><th>Lo que exige la ley</th><th>Vuestro margen</th></tr>
        </thead>
        <tbody>
          {#each legal.requirements as row}
            <tr>
              <th scope="row">{row.aspect}<small>{row.law}</small></th>
              <td>{row.requirement}</td>
              <td class="margin">{row.margin ?? '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if legal.citations && legal.citations.length > 0}
      <details class="citations">
        <summary>Ver textos legales citados</summary>
        {#each legal.citations as cite}
          <figure>
            <figcaption>{cite.label}</figcaption>
            <blockquote>{cite.excerpt}</blockquote>
          </figure>
        {/each}
      </details>
    {/if}
  </section>

  <!-- Bloque 2: otras cooperativas -->
  <section class="block comparison">
    <header class="block-head">
      <h2>Cómo lo han resuelto otras cooperativas</h2>
    </header>
    {#if comparison.intro}<p class="intro">{comparison.intro}</p>{/if}

    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Proyecto</th>
            {#each comparison.columns as col}<th>{col.label}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each comparison.rows as row}
            <tr>
              <th scope="row">{row.project}</th>
              {#each comparison.columns as col}<td>{row.cells[col.key] ?? '—'}</td>{/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if comparison.note}<p class="note">{comparison.note}</p>{/if}

    {#if comparison.rows.some((r) => r.excerpt)}
      <div class="sources">
        <h4>Leer los artículos originales</h4>
        {#each comparison.rows.filter((r) => r.excerpt) as row}
          <details class="source">
            <summary>
              <span class="src-project">{row.project}</span>
              {#if row.articleOrSection}<span class="src-art">{row.articleOrSection}</span>{/if}
            </summary>
            <blockquote>{row.excerpt}</blockquote>
            {#if row.documentSlug}
              <a class="src-link" href={`/documentos/${row.documentSlug}`}>Ver documento completo →</a>
            {/if}
          </details>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Bloque 3: propuesta -->
  <section class="block proposal">
    <header class="block-head">
      <h2>Propuesta para El Buen Vivir</h2>
      <button class="copy-all" type="button" onclick={() => copy(fullProposalText, '__all__')}>
        {copiedKey === '__all__' ? 'Copiado' : 'Copiar todo'}
      </button>
    </header>

    {#if proposal.rationale.length > 0}
      <ul class="rationale">
        {#each proposal.rationale as item}<li>{item}</li>{/each}
      </ul>
    {/if}

    <div class="articles">
      {#each proposal.articles as art}
        <article class="article {art.target}">
          <div class="article-head">
            <span class="target-badge {art.target}">{art.target === 'estatutos' ? 'Estatutos' : 'RRI'}</span>
            <div class="article-title-row">
              <h3>{art.heading}</h3>
              <button class="copy-article" type="button" onclick={() => copy(`${art.heading}\n\n${art.text}`, art.heading)}>
                {copiedKey === art.heading ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
          <p class="clause">{#each segments(art.text) as s}{#if s.ph}<mark class="ph">{s.part}</mark>{:else}{s.part}{/if}{/each}</p>
          {#if art.note}<p class="article-note">{art.note}</p>{/if}
        </article>
      {/each}
    </div>

    {#if proposal.openDecisions.length > 0}
      <div class="open-decisions" id="decisiones">
        <h4>Lo que os queda por votar</h4>
        <ul>
          {#each proposal.openDecisions as decision}<li>{decision}</li>{/each}
        </ul>
      </div>
    {/if}

    <p class="disclaimer">{proposal.disclaimer}</p>
  </section>
</div>

<style>
  .dossier { display: grid; gap: 1.3rem; margin: 0.5rem 0 1.5rem; }
  .block { border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.1rem; background: #fff; min-width: 0; }
  .block-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; }
  .block-head h2 { margin: 0; font-size: 1.05rem; }

  .copy-all, .copy-article {
    cursor: pointer; border: 1px solid var(--border); background: #fff; color: var(--muted);
    border-radius: 4px; font-size: 0.72rem; padding: 0.2rem 0.5rem; white-space: nowrap;
    font-family: inherit; transition: background 0.12s, color 0.12s;
  }
  .copy-all { margin-left: auto; }
  .copy-article { margin-left: auto; }
  .copy-all:hover, .copy-article:hover { background: #f3f4f6; color: #111; }
  .block.legal { border-left: 3px solid #60a5fa; }
  .block.comparison { border-left: 3px solid #34d399; }
  .block.proposal { border-left: 3px solid #a78bfa; }
  .intro { margin: 0 0 0.6rem; font-size: 0.9rem; line-height: 1.5; color: var(--muted); }

  .table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* Sombras de scroll: aparecen en el borde con contenido oculto y se desvanecen al final. */
    background:
      linear-gradient(to right, #fff, rgba(255, 255, 255, 0)) 0 0,
      linear-gradient(to left, #fff, rgba(255, 255, 255, 0)) 100% 0,
      radial-gradient(farthest-side at 0 50%, rgba(118, 93, 59, 0.30), rgba(118, 93, 59, 0)) 0 0,
      radial-gradient(farthest-side at 100% 50%, rgba(118, 93, 59, 0.30), rgba(118, 93, 59, 0)) 100% 0;
    background-color: #fff;
    background-repeat: no-repeat;
    background-size: 36px 100%, 36px 100%, 14px 100%, 14px 100%;
    background-attachment: local, local, scroll, scroll;
  }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 32rem; }
  th, td { text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid var(--border); vertical-align: top; line-height: 1.35; }
  thead th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); background: #fafafa; }
  tbody th[scope="row"] { font-weight: 600; }
  tbody th[scope="row"] small { display: block; font-weight: 400; font-size: 0.72rem; color: var(--muted); margin-top: 0.15rem; }
  td.margin { color: var(--muted); }

  .citations { margin-top: 0.7rem; font-size: 0.85rem; }
  .citations summary { cursor: pointer; color: var(--muted); font-size: 0.8rem; }
  .citations figure { margin: 0.6rem 0 0; }
  .citations figcaption { font-size: 0.75rem; font-weight: 600; color: var(--muted); margin-bottom: 0.2rem; }
  .citations blockquote { margin: 0; padding: 0.5rem 0.7rem; border-left: 2px solid var(--border); background: #fafafa; font-size: 0.82rem; line-height: 1.45; color: #374151; }

  .note { margin: 0.6rem 0 0; padding: 0.5rem 0.7rem; border-radius: 4px; background: #f0fdf4; font-size: 0.82rem; line-height: 1.45; }

  .sources { margin-top: 0.85rem; }
  .sources h4 { margin: 0 0 0.5rem; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
  .source { border: 1px solid var(--border); border-radius: 5px; margin-bottom: 0.4rem; padding: 0.5rem 0.65rem; background: #fcfcfd; }
  .source summary { cursor: pointer; font-size: 0.85rem; display: flex; flex-wrap: wrap; gap: 0.25rem 0.5rem; align-items: baseline; }
  .source .src-project { font-weight: 600; }
  .source .src-art { color: var(--muted); font-size: 0.78rem; }
  .source blockquote { margin: 0.5rem 0 0; padding: 0.5rem 0.7rem; border-left: 2px solid #34d399; background: #fafafa; font-size: 0.83rem; line-height: 1.5; color: #374151; }
  .source .src-link { display: inline-block; margin-top: 0.4rem; font-size: 0.78rem; color: var(--accent, #2563eb); text-decoration: none; }
  .source .src-link:hover { text-decoration: underline; }

  .rationale { margin: 0 0 0.9rem; padding-left: 1.1rem; display: grid; gap: 0.3rem; font-size: 0.86rem; line-height: 1.45; }
  .articles { display: grid; gap: 0.7rem; }
  .article { border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem 0.85rem; background: #fcfcfd; }
  .article-head { display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 0.55rem; }
  .article-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; }
  .article-title-row h3 { margin: 0; font-size: 1rem; line-height: 1.3; flex: 1 1 auto; }
  .article-title-row .copy-article { flex: none; margin-left: 0; }
  .target-badge { align-self: flex-start; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.45rem; border-radius: 3px; font-weight: 700; }
  .target-badge.estatutos { background: #dbeafe; color: #1e40af; }
  .target-badge.rri { background: #ede9fe; color: #5b21b6; }
  .clause { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 0.9rem; line-height: 1.55; color: #1f2937; padding-left: 0.7rem; border-left: 2px solid var(--border); }
  .clause .ph {
    background: rgba(184, 118, 59, 0.14);
    color: #8a5a25;
    border-bottom: 1px dashed var(--accent-warm);
    border-radius: 2px;
    padding: 0 0.22em;
    font-family: var(--font-display);
    font-style: italic;
  }
  .article-note { margin: 0.45rem 0 0; font-size: 0.78rem; font-style: italic; color: var(--muted); line-height: 1.4; }

  .open-decisions { margin-top: 0.9rem; scroll-margin-top: 1.5rem; padding: 0.7rem 0.85rem; border: 1px dashed var(--accent-warm); border-radius: 6px; background: rgba(184, 118, 59, 0.07); }
  .open-decisions h4 { margin: 0 0 0.4rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
  .open-decisions ul { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.25rem; font-size: 0.85rem; line-height: 1.4; }

  .disclaimer { margin: 0.9rem 0 0; font-size: 0.76rem; color: var(--muted); line-height: 1.4; padding-top: 0.6rem; border-top: 1px solid var(--border); }
</style>

<script lang="ts">
  import type { RriDraft } from '$lib/content/loadRriDraft';

  let {
    draft,
    topicTitles
  }: {
    draft: RriDraft;
    topicTitles: Record<string, string>;
  } = $props();

  function segments(text: string) {
    return text.split(/(\[[^\]]*\])/g).map((part) => ({
      part,
      pending: /^\[[^\]]*\]$/.test(part)
    }));
  }
</script>

<nav class="draft-index" aria-label="Índice del Reglamento de Régimen Interno">
  <p>Índice</p>
  <ol>
    {#each draft.chapters as chapter (chapter.id)}
      <li><a href={`#${chapter.id}`}>{chapter.number}. {chapter.title}</a></li>
    {/each}
  </ol>
</nav>

<section class="preamble">
  <p class="section-kicker">{draft.preambleTitle}</p>
  {#each draft.preamble as paragraph, index (`preamble-${index}`)}
    <p>{paragraph}</p>
  {/each}
</section>

<div class="rri-chapters">
  {#each draft.chapters as chapter (chapter.id)}
    <section class="rri-chapter" id={chapter.id}>
      <header class="chapter-head">
        <span>Capítulo {chapter.number}</span>
        <h3>{chapter.title}</h3>
      </header>

      <div class="chapter-articles">
        {#each chapter.articles as article (article.id)}
          <article class="rri-article" id={`articulo-${article.number}`}>
            <header class="article-head">
              <span class="article-number">Artículo {article.number}</span>
              <h4>{article.title}</h4>
              {#if article.status === 'pending'}
                <span class="pending-badge">Pendiente</span>
              {/if}
            </header>

            <div class="article-body">
              {#each article.paragraphs as paragraph, index (`${article.id}-paragraph-${index}`)}
                <p>
                  {#each segments(paragraph) as segment}
                    {#if segment.pending}<mark>{segment.part}</mark>{:else}{segment.part}{/if}
                  {/each}
                </p>
              {/each}
            </div>

            {#if article.status === 'pending' && article.pendingItems?.length}
              <aside class="pending-box">
                <strong>Por decidir</strong>
                <ul>
                  {#each article.pendingItems as item, index (`${article.id}-pending-${index}`)}
                    <li><mark>[{item}]</mark></li>
                  {/each}
                </ul>
              </aside>
            {/if}

            {#if article.topicSlugs.length > 0}
              <details class="article-context">
                <summary>Ver temas relacionados</summary>
                <div>
                  {#each article.topicSlugs as slug (slug)}
                    <a href={`/temas/${slug}`}>{topicTitles[slug] ?? slug}</a>
                  {/each}
                </div>
              </details>
            {/if}
          </article>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .draft-index {
    background: #f7f8f5;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent-docs);
    border-radius: 4px;
    display: block;
    margin: 0 0 2rem;
    padding: 1rem 1.1rem;
  }

  .draft-index p {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    margin: 0 0 0.55rem;
    text-transform: uppercase;
  }

  .draft-index ol {
    columns: 2;
    gap: 2rem;
    margin: 0;
    padding-left: 1.25rem;
  }

  .draft-index li {
    break-inside: avoid;
    color: var(--muted);
    font-size: 0.86rem;
    margin-bottom: 0.3rem;
    padding-left: 0.15rem;
  }

  .draft-index a {
    color: var(--ink);
    text-decoration-color: var(--border);
    text-underline-offset: 3px;
  }

  .preamble {
    border-bottom: 1px solid var(--border);
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
  }

  .section-kicker {
    color: var(--accent-docs);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .preamble p:not(.section-kicker) {
    font-family: var(--font-display);
    font-size: 1rem;
    line-height: 1.65;
    margin: 0.7rem 0;
  }

  .rri-chapters {
    display: grid;
    gap: 3rem;
  }

  .rri-chapter {
    scroll-margin-top: 1rem;
  }

  .chapter-head {
    border-bottom: 2px solid var(--ink);
    margin-bottom: 1.3rem;
    padding-bottom: 0.7rem;
  }

  .chapter-head span {
    color: var(--accent-docs);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .chapter-head h3 {
    font-family: var(--font-display);
    font-size: 1.55rem;
    font-weight: 600;
    margin: 0.2rem 0 0;
  }

  .chapter-articles {
    display: grid;
    gap: 1.6rem;
  }

  .rri-article {
    border-bottom: 1px solid var(--border);
    padding-bottom: 1.5rem;
    scroll-margin-top: 1rem;
  }

  .rri-article:last-child {
    border-bottom: 0;
  }

  .article-head {
    align-items: baseline;
    display: grid;
    gap: 0.35rem 0.65rem;
    grid-template-columns: auto 1fr auto;
    margin-bottom: 0.65rem;
  }

  .article-number {
    color: var(--accent-docs);
    font-size: 0.76rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .article-head h4 {
    font-family: var(--font-display);
    font-size: 1.1rem;
    line-height: 1.3;
    margin: 0;
  }

  .pending-badge {
    background: #fff7df;
    border: 1px solid #e2c46f;
    border-radius: 999px;
    color: #795b08;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    padding: 0.2rem 0.5rem;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .article-body {
    border-left: 2px solid var(--border);
    font-family: Georgia, 'Times New Roman', serif;
    padding-left: 0.9rem;
  }

  .article-body p {
    line-height: 1.65;
    margin: 0 0 0.65rem;
  }

  .article-body p:last-child {
    margin-bottom: 0;
  }

  mark {
    background: rgba(47, 93, 58, 0.12);
    border-bottom: 1px dashed var(--accent-warm);
    border-radius: 2px;
    color: var(--accent);
    font-family: var(--font-display);
    font-style: italic;
    padding: 0 0.2em;
  }

  .pending-box {
    background: #fffaf0;
    border: 1px solid #ead9aa;
    border-radius: 4px;
    margin-top: 0.9rem;
    padding: 0.75rem 0.85rem;
  }

  .pending-box strong {
    color: #795b08;
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .pending-box ul {
    display: grid;
    font-size: 0.84rem;
    gap: 0.25rem;
    line-height: 1.45;
    margin: 0.4rem 0 0;
    padding-left: 1.15rem;
  }

  .pending-box mark {
    background: transparent;
    border-bottom: 0;
    padding: 0;
  }

  .article-context {
    color: var(--muted);
    font-size: 0.75rem;
    margin-top: 0.75rem;
  }

  .article-context summary {
    cursor: pointer;
  }

  .article-context div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.7rem;
    margin-top: 0.4rem;
  }

  .article-context a {
    color: var(--accent);
  }

  @media (max-width: 640px) {
    .draft-index ol {
      columns: 1;
    }

    .article-head {
      grid-template-columns: 1fr auto;
    }

    .article-number {
      grid-column: 1 / -1;
    }
  }
</style>

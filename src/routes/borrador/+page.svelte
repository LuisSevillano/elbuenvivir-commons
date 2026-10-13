<script lang="ts">
  import { onMount, tick } from 'svelte';
  import RriDraftView from '$lib/components/RriDraft.svelte';
  import type { RriDraft } from '$lib/content/loadRriDraft';

  let { data } = $props();

  interface Article {
    topicSlug: string;
    topicTitle: string;
    heading: string;
    text: string;
    note?: string;
  }

  type DocKey = 'estatutos' | 'rri';
  let active = $state<DocKey>('rri');

  function docFromHash(): DocKey | null {
    const hash = location.hash;
    if (!hash || hash.length < 2) return null;
    if (hash === '#estatutos' || hash.startsWith('#estatutos-')) return 'estatutos';
    return 'rri';
  }

  onMount(() => {
    const applyHash = async () => {
      const doc = docFromHash();
      if (doc) active = doc;
      await tick();
      const id = location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
    };
    void applyHash();
    const onHashChange = () => void applyHash();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });

  const statutes = $derived({
    title: 'Estatutos de El Buen Vivir, S. Coop.',
    articles: data.estatutos as Article[],
    unit: 'Artículo'
  });

  // Algunos títulos ya traen "Artículo N —" / "Norma —"; lo quitamos para no duplicar con la numeración.
  function cleanHeading(h: string): string {
    return h.replace(/^\s*(art[íi]culos?|normas?)\b[^—–:.\-]*[—–:.\-]\s*/i, '').trim() || h.trim();
  }

  // Divide el texto en segmentos, marcando los [corchetes] como "pendiente de decidir".
  function segments(text: string) {
    return text.split(/(\[[^\]]*\])/g).map((part) => ({ part, ph: /^\[[^\]]*\]$/.test(part) }));
  }

  let copied = $state(false);

  function statutesPlainText(doc: { title: string; unit: string; articles: Article[] }): string {
    const lines = [doc.title.toUpperCase(), ''];
    doc.articles.forEach((a, i) => {
      lines.push(`${doc.unit} ${i + 1}. ${cleanHeading(a.heading)}`, '', a.text, '');
    });
    lines.push('— Borrador de trabajo. Requiere revisión jurídica antes de su aprobación.');
    return lines.join('\n');
  }
  function statutesMarkdown(doc: { title: string; unit: string; articles: Article[] }): string {
    const lines = [`# ${doc.title}`, ''];
    doc.articles.forEach((a, i) => {
      lines.push(`## ${doc.unit} ${i + 1}. ${cleanHeading(a.heading)}`, '', a.text, '');
    });
    lines.push('---', '', '_Borrador de trabajo. Requiere revisión jurídica antes de su aprobación._');
    return lines.join('\n');
  }

  function rriPlainText(doc: RriDraft): string {
    const lines = [doc.title.toUpperCase(), '', doc.preambleTitle.toUpperCase(), '', ...doc.preamble, ''];

    for (const chapter of doc.chapters) {
      lines.push(`CAPÍTULO ${chapter.number}. ${chapter.title.toUpperCase()}`, '');
      for (const article of chapter.articles) {
        const pending = article.status === 'pending' ? ' [PENDIENTE]' : '';
        lines.push(`Artículo ${article.number}. ${article.title}${pending}`, '', ...article.paragraphs, '');
        if (article.pendingItems?.length) {
          lines.push('Por decidir:', ...article.pendingItems.map((item) => `- [${item}]`), '');
        }
      }
    }

    lines.push('— Borrador de trabajo. Requiere revisión jurídica antes de su aprobación.');
    return lines.join('\n');
  }

  function rriMarkdown(doc: RriDraft): string {
    const lines = [`# ${doc.title}`, '', `## ${doc.preambleTitle}`, '', ...doc.preamble, ''];

    for (const chapter of doc.chapters) {
      lines.push(`## Capítulo ${chapter.number}. ${chapter.title}`, '');
      for (const article of chapter.articles) {
        const pending = article.status === 'pending' ? ' — PENDIENTE' : '';
        lines.push(`### Artículo ${article.number}. ${article.title}${pending}`, '', ...article.paragraphs, '');
        if (article.pendingItems?.length) {
          lines.push('**Por decidir:**', '', ...article.pendingItems.map((item) => `- [${item}]`), '');
        }
      }
    }

    lines.push('---', '', '_Borrador de trabajo. Requiere revisión jurídica antes de su aprobación._');
    return lines.join('\n');
  }

  async function copyAll() {
    try {
      const text = active === 'estatutos' ? statutesPlainText(statutes) : rriPlainText(data.rri);
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }
  function download() {
    const content = active === 'estatutos' ? statutesMarkdown(statutes) : rriMarkdown(data.rri);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active}-el-buen-vivir.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<article class="draft">
  <header class="draft-hero">
    <p class="eyebrow">Borrador de trabajo</p>
    <h1>Borrador de Estatutos y RRI</h1>
    <p class="lead">
      Los Estatutos reúnen las propuestas jurídicas de los temas. El RRI se presenta como un documento
      consolidado por capítulos que distingue los acuerdos vigentes de lo que aún debe decidirse o
      revisarse jurídicamente, señalado como <strong>Pendiente</strong>.
    </p>
  </header>

  <div class="doc-switch" role="tablist">
    <button role="tab" aria-selected={active === 'rri'} class:active={active === 'rri'} onclick={() => (active = 'rri')}>
      RRI
    </button>
    <button role="tab" aria-selected={active === 'estatutos'} class:active={active === 'estatutos'} onclick={() => (active = 'estatutos')}>
      Estatutos <span>(WIP)</span>
    </button>
  </div>

  <div class="doc-toolbar">
    <h2>{active === 'estatutos' ? statutes.title : data.rri.title}</h2>
    <div class="doc-actions">
      <button class="btn" type="button" onclick={copyAll}>{copied ? 'Copiado' : 'Copiar todo'}</button>
      <button class="btn" type="button" onclick={download}>Descargar .md</button>
    </div>
  </div>

  {#if active === 'rri'}
    <div id="rri">
      <RriDraftView draft={data.rri} topicTitles={data.topicTitles} />
    </div>
  {:else if statutes.articles.length > 0}
    <ol class="articles" id="estatutos">
      {#each statutes.articles as art, i (art.topicSlug + art.heading)}
        <li id={`estatutos-articulo-${i + 1}`}>
          <div class="art-head">
            <span class="art-num">{statutes.unit} {i + 1}</span>
            <h3>
              {cleanHeading(art.heading)}
              <a
                class="permalink"
                href={`#estatutos-articulo-${i + 1}`}
                aria-label={`Enlace directo al artículo ${i + 1} de Estatutos`}
                title="Enlace directo a este artículo">§</a
              >
            </h3>
            <a class="art-src" href={`/temas/${art.topicSlug}`}>{art.topicTitle} →</a>
          </div>
          <p class="art-text">{#each segments(art.text) as s}{#if s.ph}<mark class="ph">{s.part}</mark>{:else}{s.part}{/if}{/each}</p>
          {#if art.note}<p class="art-note">{art.note}</p>{/if}
        </li>
      {/each}
    </ol>
  {:else}
    <p class="empty-note">Este documento aún no tiene artículos propuestos.</p>
  {/if}

  <p class="draft-disclaimer">
    Borrador de trabajo generado a partir de la Ley 4/2002 de CyL, los estatutos de otras cooperativas y
    las decisiones del grupo. <strong>Debe revisarse jurídicamente antes de aprobarse.</strong>
  </p>
</article>

<style>
  .draft { max-width: 74ch; margin: 0 auto; }
  .draft-hero { margin-bottom: 1.6rem; }
  .draft-hero h1 { margin: 0.3rem 0 0.8rem; }
  .doc-switch { display: flex; gap: 0.4rem; border-bottom: 1px solid var(--border); margin-bottom: 1.2rem; }
  .doc-switch button {
    appearance: none; background: none; border: none; cursor: pointer; font: inherit;
    padding: 0.55rem 0.9rem; color: var(--muted); font-weight: 600;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .doc-switch button.active { color: var(--ink); border-bottom-color: var(--accent-warm); }
  .doc-switch button span { color: gray; font-weight: lighter;  }
  .doc-toolbar { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.2rem; }
  .doc-toolbar h2 { font-family: var(--font-display); font-weight: 600; font-size: clamp(1.2rem, 2.5vw, 1.6rem); margin: 0; }
  .doc-actions { display: flex; gap: 0.5rem; }
  .btn {
    appearance: none; cursor: pointer; font: inherit; font-size: 0.82rem; font-weight: 600;
    border: 1px solid var(--accent); color: var(--accent); background: var(--surface);
    border-radius: 4px; padding: 0.35rem 0.7rem; white-space: nowrap;
  }
  .btn:hover { background: var(--accent); color: #ffffff; }

  .articles { list-style: none; margin: 0; padding: 0; counter-reset: art; display: grid; gap: 1.4rem; }
  .articles li { padding-bottom: 1.2rem; border-bottom: 1px solid var(--border); scroll-margin-top: 1rem; }
  .articles li:last-child { border-bottom: none; }
  .articles li:target .art-head h3 {
    text-decoration: underline;
    text-decoration-color: var(--accent-docs);
    text-underline-offset: 4px;
  }
  .permalink {
    color: var(--muted);
    display: inline-block;
    font-size: 0.75em;
    font-weight: 400;
    line-height: 1;
    margin-left: 0.35rem;
    opacity: 0;
    position: relative;
    text-decoration: none;
    top: -0.08em;
  }
  .art-head:hover .permalink,
  .permalink:focus-visible {
    opacity: 1;
  }
  .permalink:hover { color: var(--accent-docs); }
  @media (hover: none) {
    .permalink { opacity: 1; }
  }
  .art-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.5rem 0.7rem; margin-bottom: 0.5rem; }
  .art-num {
    font-family: var(--font-display); font-weight: 600; font-size: 0.9rem; color: var(--accent-warm);
    white-space: nowrap;
  }
  .art-head h3 { font-size: 1.05rem; font-weight: 600; margin: 0; flex: 1 1 auto; }
  .art-src { font-size: 0.72rem; color: var(--muted); text-decoration: none; white-space: nowrap; }
  .art-src:hover { color: var(--accent); text-decoration: underline; }
  .art-text {
    margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 0.96rem; line-height: 1.6;
    color: var(--ink); padding-left: 0.85rem; border-left: 2px solid var(--border);
  }
  .ph {
    background: rgba(47, 93, 58, 0.12);
    color: var(--accent);
    border-bottom: 1px dashed var(--accent-warm);
    border-radius: 2px;
    padding: 0 0.22em;
    font-family: var(--font-display);
    font-style: italic;
  }
  .art-note { margin: 0.5rem 0 0; font-size: 0.78rem; font-style: italic; color: var(--muted); }

  .draft-disclaimer {
    margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);
    font-size: 0.82rem; color: var(--muted); line-height: 1.5;
  }
  .empty-note { color: var(--muted); }
</style>

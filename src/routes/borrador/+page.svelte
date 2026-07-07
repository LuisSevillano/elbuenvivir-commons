<script lang="ts">
  let { data } = $props();

  interface Article {
    topicSlug: string;
    topicTitle: string;
    heading: string;
    text: string;
    note?: string;
  }

  type DocKey = 'estatutos' | 'rri';
  let active = $state<DocKey>('estatutos');

  const docs: Record<DocKey, { label: string; title: string; articles: Article[]; unit: string }> = $derived({
    estatutos: { label: 'Estatutos', title: 'Estatutos de El Buen Vivir, S. Coop.', articles: data.estatutos, unit: 'Artículo' },
    rri: { label: 'Reglamento de Régimen Interno', title: 'Reglamento de Régimen Interno de El Buen Vivir', unit: 'Norma', articles: data.rri }
  });
  const current = $derived(docs[active]);

  // Algunos títulos ya traen "Artículo N —" / "Norma —"; lo quitamos para no duplicar con la numeración.
  function cleanHeading(h: string): string {
    return h.replace(/^\s*(art[íi]culos?|normas?)\b[^—–:.\-]*[—–:.\-]\s*/i, '').trim() || h.trim();
  }

  // Divide el texto en segmentos, marcando los [corchetes] como "pendiente de decidir".
  function segments(text: string) {
    return text.split(/(\[[^\]]*\])/g).map((part) => ({ part, ph: /^\[[^\]]*\]$/.test(part) }));
  }

  let copied = $state(false);

  function plainText(doc: { title: string; unit: string; articles: Article[] }): string {
    const lines = [doc.title.toUpperCase(), ''];
    doc.articles.forEach((a, i) => {
      lines.push(`${doc.unit} ${i + 1}. ${cleanHeading(a.heading)}`, '', a.text, '');
    });
    lines.push('— Borrador de trabajo. Requiere revisión jurídica antes de su aprobación.');
    return lines.join('\n');
  }
  function markdown(doc: { title: string; unit: string; articles: Article[] }): string {
    const lines = [`# ${doc.title}`, ''];
    doc.articles.forEach((a, i) => {
      lines.push(`## ${doc.unit} ${i + 1}. ${cleanHeading(a.heading)}`, '', a.text, '');
    });
    lines.push('---', '', '_Borrador de trabajo. Requiere revisión jurídica antes de su aprobación._');
    return lines.join('\n');
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(plainText(current));
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }
  function download() {
    const blob = new Blob([markdown(current)], { type: 'text/markdown;charset=utf-8' });
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
    <p class="eyebrow">Borrador ensamblado · para llevar a Google Docs</p>
    <h1>Borrador de Estatutos y RRI</h1>
    <p class="lead">
      Todas las propuestas de los {data.estatutos.length + data.rri.length} artículos, reunidas en orden
      en los dos documentos. Lo que aparece entre <code>[corchetes]</code> es lo que queda por decidir.
      Copia o descarga para seguir editándolo en Google Docs.
    </p>
  </header>

  <div class="doc-switch" role="tablist">
    <button role="tab" aria-selected={active === 'estatutos'} class:active={active === 'estatutos'} onclick={() => (active = 'estatutos')}>
      Estatutos <span>{data.estatutos.length}</span>
    </button>
    <button role="tab" aria-selected={active === 'rri'} class:active={active === 'rri'} onclick={() => (active = 'rri')}>
      RRI <span>{data.rri.length}</span>
    </button>
  </div>

  <div class="doc-toolbar">
    <h2>{current.title}</h2>
    <div class="doc-actions">
      <button class="btn" type="button" onclick={copyAll}>{copied ? '✓ Copiado' : 'Copiar todo'}</button>
      <button class="btn" type="button" onclick={download}>Descargar .md</button>
    </div>
  </div>

  {#if current.articles.length === 0}
    <p class="empty-note">Este documento aún no tiene artículos propuestos.</p>
  {:else}
    <ol class="articles">
      {#each current.articles as art, i}
        <li>
          <div class="art-head">
            <span class="art-num">{current.unit} {i + 1}</span>
            <h3>{cleanHeading(art.heading)}</h3>
            <a class="art-src" href={`/temas/${art.topicSlug}`}>{art.topicTitle} →</a>
          </div>
          <p class="art-text">{#each segments(art.text) as s}{#if s.ph}<mark class="ph">{s.part}</mark>{:else}{s.part}{/if}{/each}</p>
          {#if art.note}<p class="art-note">{art.note}</p>{/if}
        </li>
      {/each}
    </ol>
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
  .lead code { font-family: ui-monospace, monospace; font-size: 0.85em; background: #efe7d8; padding: 0.05em 0.35em; border-radius: 3px; }

  .doc-switch { display: flex; gap: 0.4rem; border-bottom: 1px solid var(--border); margin-bottom: 1.2rem; }
  .doc-switch button {
    appearance: none; background: none; border: none; cursor: pointer; font: inherit;
    padding: 0.55rem 0.9rem; color: var(--muted); font-weight: 600;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .doc-switch button.active { color: var(--ink); border-bottom-color: var(--accent-warm); }
  .doc-switch button span {
    font-family: var(--font-display); font-size: 0.8rem; color: var(--accent-warm); margin-left: 0.2rem;
  }

  .doc-toolbar { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.2rem; }
  .doc-toolbar h2 { font-family: var(--font-display); font-weight: 600; font-size: clamp(1.2rem, 2.5vw, 1.6rem); margin: 0; }
  .doc-actions { display: flex; gap: 0.5rem; }
  .btn {
    appearance: none; cursor: pointer; font: inherit; font-size: 0.82rem; font-weight: 600;
    border: 1px solid var(--accent); color: var(--accent); background: var(--surface);
    border-radius: 4px; padding: 0.35rem 0.7rem; white-space: nowrap;
  }
  .btn:hover { background: var(--accent); color: #fffdf8; }

  .articles { list-style: none; margin: 0; padding: 0; counter-reset: art; display: grid; gap: 1.4rem; }
  .articles li { padding-bottom: 1.2rem; border-bottom: 1px solid var(--border); }
  .articles li:last-child { border-bottom: none; }
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
    color: #1f2937; padding-left: 0.85rem; border-left: 2px solid var(--border);
  }
  .ph {
    background: rgba(184, 118, 59, 0.14);
    color: #8a5a25;
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

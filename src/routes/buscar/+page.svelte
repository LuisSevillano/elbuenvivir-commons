<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { categoryLabels, documentTypeLabels } from '$lib/content/labels';
  import type {
    Confidence,
    DocumentType,
    GeneratedTopicDraft,
    GeneratedTopicReference,
    GovernanceTopic,
    SourceDocument,
    TaxonomyTopic,
    TopicCategory
  } from '$lib/content/types';

  type ReferenceSearchItem = GeneratedTopicReference & {
    topicTitle: string;
    category?: TopicCategory;
    jurisdiction?: string;
  };

  type SearchKind = 'topic' | 'draft' | 'document' | 'reference';

  type SearchItem = {
    kind: SearchKind;
    title: string;
    subtitle: string;
    body: string;
    href: string;
    category?: TopicCategory;
    documentType?: DocumentType;
    jurisdiction?: string;
    confidence?: Confidence;
    score: number;
  };

  let { data }: {
    data: {
      query: string;
      topics: GovernanceTopic[];
      drafts: GeneratedTopicDraft[];
      documents: SourceDocument[];
      references: ReferenceSearchItem[];
      taxonomy: TaxonomyTopic[];
    };
  } = $props();

  let query = $state('');
  let documentTypeFilter = $state('all');
  let jurisdictionFilter = $state('all');
  let confidenceFilter = $state('all');
  let categoryFilter = $state('all');

  $effect(() => {
    query = data.query;
  });

  const documentTypes = $derived(
    [...new Set(data.documents.map((document) => document.type))].toSorted((a, b) => a.localeCompare(b, 'es'))
  );
  const jurisdictions = $derived(
    [...new Set(data.documents.map((document) => document.jurisdiction).filter((value): value is string => Boolean(value)))]
      .toSorted((a, b) => a.localeCompare(b, 'es'))
  );
  const categories = $derived(
    [...new Set(data.taxonomy.map((topic) => topic.category))].toSorted((a, b) => a.localeCompare(b, 'es'))
  );

  function normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function scoreText(value: string, search: string): number {
    const normalizedValue = normalize(value);
    const tokens = normalize(search).split(/\s+/).filter((token) => token.length >= 2);

    if (tokens.length === 0) {
      return 1;
    }

    return tokens.reduce((score, token) => {
      if (normalizedValue.includes(token)) {
        return score + (normalizedValue.startsWith(token) ? 4 : 2);
      }

      return score;
    }, 0);
  }

  function confidenceLabel(value: string): string {
    const labels: Record<string, string> = { high: 'alta', medium: 'media', low: 'baja' };
    return labels[value] ?? value;
  }

  function allItems(): SearchItem[] {
    const topicItems: SearchItem[] = data.topics.map((topic) => ({
      kind: 'topic',
      title: topic.title,
      subtitle: 'Tema de consulta',
      body: [topic.shortDescription, ...topic.minimumContents, ...topic.decisionsForBuenVivir, ...topic.risks].join(' '),
      href: `/temas/${topic.slug}`,
      category: topic.category,
      score: 0
    }));
    const draftItems: SearchItem[] = data.drafts.map((draft) => ({
      kind: 'draft',
      title: draft.title,
      subtitle: 'Borrador de trabajo',
      body: [draft.shortDescription, ...draft.minimumContents, ...draft.decisionsForBuenVivir, ...draft.risks].join(' '),
      href: `/drafts/${draft.slug}`,
      category: draft.category,
      score: 0
    }));
    const documentItems: SearchItem[] = data.documents.map((document) => ({
      kind: 'document',
      title: document.title,
      subtitle: document.sourcePath,
      body: [document.fileName, document.projectName, document.jurisdiction, document.tags.join(' ')].filter(Boolean).join(' '),
      href: `/documentos/${document.slug}`,
      documentType: document.type,
      jurisdiction: document.jurisdiction,
      score: 0
    }));
    const referenceItems: SearchItem[] = data.references.map((reference) => ({
      kind: 'reference',
      title: reference.topicTitle,
      subtitle: `${reference.documentTitle}${reference.articleOrSection ? ` · ${reference.articleOrSection}` : ''}`,
      body: [reference.excerpt, reference.tags.join(' '), reference.projectName, reference.jurisdiction].filter(Boolean).join(' '),
      href: `/documentos/${reference.documentSlug}`,
      category: reference.category,
      documentType: reference.documentType,
      jurisdiction: reference.jurisdiction,
      confidence: reference.confidence,
      score: 0
    }));

    return [...topicItems, ...draftItems, ...documentItems, ...referenceItems];
  }

  function passesFilters(item: SearchItem): boolean {
    if (documentTypeFilter !== 'all' && item.documentType !== documentTypeFilter) {
      return false;
    }

    if (jurisdictionFilter !== 'all' && item.jurisdiction !== jurisdictionFilter) {
      return false;
    }

    if (confidenceFilter !== 'all' && item.confidence !== confidenceFilter) {
      return false;
    }

    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    return true;
  }

  function searchItems(): SearchItem[] {
    return allItems()
      .map((item) => ({
        ...item,
        score: scoreText(`${item.title} ${item.subtitle} ${item.body}`, query)
      }))
      .filter((item) => item.score > 0)
      .filter(passesFilters)
      .toSorted((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'es'));
  }

  const results = $derived(searchItems());
  const topics = $derived(results.filter((item) => item.kind === 'topic'));
  const drafts = $derived(results.filter((item) => item.kind === 'draft'));
  const documents = $derived(results.filter((item) => item.kind === 'document'));
  const references = $derived(results.filter((item) => item.kind === 'reference'));
</script>

<section class="hero">
  <p class="eyebrow">Búsqueda transversal</p>
  <h1>Explora temas, documentos, borradores y referencias.</h1>
  <p class="lead">
    Localiza rápidamente soluciones, documentos relacionados, ejemplos encontrados y decisiones pendientes
    dentro del atlas comparado.
  </p>
</section>

<section class="section panel search-panel">
  <label>
    Buscar
    <input bind:value={query} type="search" placeholder="baja, aportaciones, consejo rector..." />
  </label>
  <div class="filters">
    <label>
      Tipo documento
      <select bind:value={documentTypeFilter}>
        <option value="all">Todos</option>
        {#each documentTypes as type}
          <option value={type}>{documentTypeLabels[type]}</option>
        {/each}
      </select>
    </label>
    <label>
      Jurisdicción
      <select bind:value={jurisdictionFilter}>
        <option value="all">Todas</option>
        {#each jurisdictions as jurisdiction}
          <option value={jurisdiction}>{jurisdiction}</option>
        {/each}
      </select>
    </label>
    <label>
      Nivel de confianza
      <select bind:value={confidenceFilter}>
        <option value="all">Todas</option>
        <option value="high">Alto</option>
        <option value="medium">Medio</option>
        <option value="low">Bajo</option>
      </select>
    </label>
    <label>
      Categoría
      <select bind:value={categoryFilter}>
        <option value="all">Todas</option>
        {#each categories as category}
          <option value={category}>{categoryLabels[category]}</option>
        {/each}
      </select>
    </label>
  </div>
  <p class="result-count">{results.length} resultados</p>
</section>

<section class="section result-groups">
  {@render ResultGroup('Temas', topics)}
  {@render ResultGroup('Borradores de trabajo', drafts)}
  {@render ResultGroup('Documentos', documents)}
  {@render ResultGroup('Referencias detectadas', references)}
</section>

{#snippet ResultGroup(title: string, items: SearchItem[])}
  <section class="panel stack">
    <h2>{title} <span>{items.length}</span></h2>
    {#if items.length === 0}
      <p class="empty-state">Sin resultados.</p>
    {:else}
      {#each items.slice(0, 40) as item}
        <a class="result-card" href={item.href}>
          <div class="result-meta">
            {#if item.kind === 'topic'}<StatusBadge tone="success">Tema</StatusBadge>{/if}
            {#if item.kind === 'draft'}<StatusBadge tone="auto">Borrador de trabajo</StatusBadge>{/if}
            {#if item.kind === 'document'}<StatusBadge>Documento</StatusBadge>{/if}
            {#if item.kind === 'reference'}<StatusBadge tone="auto">Referencia detectada</StatusBadge>{/if}
            {#if item.documentType}<StatusBadge>{documentTypeLabels[item.documentType]}</StatusBadge>{/if}
            {#if item.confidence}<StatusBadge>Coincidencia {confidenceLabel(item.confidence)}</StatusBadge>{/if}
            {#if item.category}<StatusBadge>{categoryLabels[item.category]}</StatusBadge>{/if}
          </div>
          <h3>{item.title}</h3>
          <p>{item.subtitle}</p>
        </a>
      {/each}
    {/if}
  </section>
{/snippet}

<style>
  .search-panel,
  .filters {
    display: grid;
    gap: 1rem;
  }

  input,
  select {
    border: 1px solid var(--border);
    border-radius: 4px;
    display: block;
    font: inherit;
    margin-top: 0.35rem;
    padding: 0.7rem 0.8rem;
    width: 100%;
  }

  label {
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 800;
  }

  .filters,
  .result-groups {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .result-count {
    color: var(--muted);
    margin: 0;
  }

  h2 span {
    color: var(--muted);
    font-size: 1rem;
  }

  .result-card {
    border: 1px solid var(--border);
    border-radius: 4px;
    color: inherit;
    display: block;
    padding: 1rem;
    text-decoration: none;
  }

  .result-card:hover {
    border-color: #a89778;
  }

  .result-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  h3 {
    margin: 0.7rem 0 0.25rem;
  }

  .result-card p {
    color: var(--muted);
    margin: 0;
  }
</style>

<script lang="ts">
  import type { DecisionQuestion, GeneratedTopicReference, TopicDecisionModel } from '$lib/content/types';
  import ExpandableReferenceGroup from './ExpandableReferenceGroup.svelte';
  import ReferenceCard from './ReferenceCard.svelte';

  interface Props {
    decisionModel?: TopicDecisionModel | null;
    generatedReferences?: GeneratedTopicReference[];
  }

  let { decisionModel = null, generatedReferences = [] }: Props = $props();

  const extractCount = $derived(decisionModel?.extracts.length ?? 0);
  const totalCount = $derived(extractCount + generatedReferences.length);

  function extractsFor(question: DecisionQuestion) {
    const ids = new Set(question.relatedExtracts);
    return decisionModel?.extracts.filter((extract) => ids.has(extract.id)).slice(0, 4) ?? [];
  }
</script>

{#if totalCount > 0}
  <ExpandableReferenceGroup title="Ejemplos y referencias documentales" count={totalCount} defaultExpanded={false}>
    <div class="reference-drawer">
      {#if decisionModel && extractCount > 0}
        {#each decisionModel.decisionQuestions as question}
          {@const extracts = extractsFor(question)}
          {#if extracts.length > 0}
            <section class="extract-group">
              <h3>{question.question}</h3>
              {#each extracts as extract}
                <blockquote>
                  <p>{extract.excerpt}</p>
                  <footer>{extract.projectName ?? extract.documentTitle} · {extract.articleOrSection ?? 'Sección sin título'} · {extract.sourcePath}</footer>
                </blockquote>
              {/each}
            </section>
          {/if}
        {/each}
      {/if}

      {#if generatedReferences.length > 0}
        <section class="reference-cards">
          <h3>Documentos relacionados</h3>
          {#each generatedReferences.slice(0, 8) as reference}
            <ReferenceCard {reference} automatic />
          {/each}
        </section>
      {/if}
    </div>
  </ExpandableReferenceGroup>
{/if}

<style>
  .reference-drawer {
    display: grid;
    gap: 1rem;
  }

  .extract-group,
  .reference-cards {
    min-width: 0;
  }

  h3 {
    margin: 0 0 0.6rem;
    font-size: 0.95rem;
  }

  blockquote {
    margin: 0 0 0.7rem;
    padding: 0.75rem;
    border-left: 3px solid var(--accent);
    border-radius: 4px;
    background: #fafafa;
  }

  blockquote p {
    margin: 0 0 0.45rem;
    font-size: 0.86rem;
    line-height: 1.45;
  }

  footer {
    color: var(--muted);
    font-size: 0.76rem;
    overflow-wrap: anywhere;
  }

  .reference-cards {
    display: grid;
    gap: 0.7rem;
  }
</style>

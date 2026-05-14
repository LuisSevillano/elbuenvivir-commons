<script lang="ts">
  import type { DecisionQuestion, EvidenceExtract, GeneratedTopicReference, TopicDecisionModel } from '$lib/content/types';
  import ExpandableReferenceGroup from './ExpandableReferenceGroup.svelte';
  import EvidenceBadge from './EvidenceBadge.svelte';
  import ReferenceCard from './ReferenceCard.svelte';

  interface Props {
    decisionModel?: TopicDecisionModel | null;
    generatedReferences?: GeneratedTopicReference[];
    evidenceExtracts?: EvidenceExtract[];
  }

  let { decisionModel = null, generatedReferences = [], evidenceExtracts = [] }: Props = $props();

  const extractCount = $derived(decisionModel?.extracts.length ?? 0);
  const evidenceExtractCount = $derived(evidenceExtracts.length);
  const totalCount = $derived(extractCount + evidenceExtractCount + generatedReferences.length);
  const hasDecisionExtracts = $derived(decisionModel && extractCount > 0);
  const hasEvidenceExtracts = $derived(evidenceExtractCount > 0);

  function extractsFor(question: DecisionQuestion) {
    const ids = new Set(question.relatedExtracts);
    return decisionModel?.extracts.filter((extract) => ids.has(extract.id)).slice(0, 4) ?? [];
  }
</script>

{#if totalCount > 0}
  <ExpandableReferenceGroup title="Evidencia y material de apoyo" count={totalCount} defaultExpanded={false}>
    <div class="reference-drawer">
      {#if hasEvidenceExtracts}
        <section class="snippet-group">
          <h3>Extractos con análisis de evidencia</h3>
          {#each evidenceExtracts.slice(0, 8) as extract}
            <blockquote class="evidence-snippet">
              <p>{extract.snippet}</p>
              <footer>
                {extract.projectName ?? extract.documentTitle}
                {#if extract.articleOrSection} · {extract.articleOrSection}{/if}
                · score {extract.score}
              </footer>
            </blockquote>
          {/each}
        </section>
      {/if}

      {#if hasDecisionExtracts && decisionModel}
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
          {#each generatedReferences.slice(0, 6) as reference}
            <ReferenceCard {reference} automatic />
          {/each}
        </section>
      {/if}
    </div>
  </ExpandableReferenceGroup>
{/if}

<style>
  .reference-drawer { display: grid; gap: 1rem; }
  .snippet-group, .extract-group, .reference-cards { min-width: 0; }
  h3 { margin: 0 0 0.6rem; font-size: 0.95rem; }
  blockquote { margin: 0 0 0.7rem; padding: 0.75rem; border-left: 3px solid var(--accent); border-radius: 4px; background: #fafafa; }
  blockquote p { margin: 0 0 0.45rem; font-size: 0.86rem; line-height: 1.45; }
  footer { color: var(--muted); font-size: 0.76rem; overflow-wrap: anywhere; }
  .reference-cards { display: grid; gap: 0.7rem; }
</style>

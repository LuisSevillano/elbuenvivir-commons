<script lang="ts">
  import CollapsibleReferences from '$lib/components/CollapsibleReferences.svelte';
  import CompactInsightList from '$lib/components/CompactInsightList.svelte';
  import CompactSolutionModel from '$lib/components/CompactSolutionModel.svelte';
  import DecisionChecklist from '$lib/components/DecisionChecklist.svelte';
  import EditorialSection from '$lib/components/EditorialSection.svelte';
  import GovernanceSplit from '$lib/components/GovernanceSplit.svelte';
  import RelatedTopicsCard from '$lib/components/RelatedTopicsCard.svelte';
  import SuggestedClauseBlock from '$lib/components/SuggestedClauseBlock.svelte';
  import TopicHero from '$lib/components/TopicHero.svelte';
  import type {
    ConsultableTopic,
    GeneratedTopicReference,
    GeneratedTopicSynthesis,
    SolutionApproach,
    TopicDecisionModel
  } from '$lib/content/types';

  let { data }: {
    data: {
      topic: ConsultableTopic;
      topics: ConsultableTopic[];
      decisionModel: TopicDecisionModel | null;
      generatedReferences: GeneratedTopicReference[];
      synthesis: GeneratedTopicSynthesis | null;
    };
  } = $props();

  const topic = $derived(data.topic);
  const decisionModel = $derived(data.decisionModel);
  const synthesis = $derived(data.synthesis);

  const decisionQuestions = $derived(compactQuestions(topic, decisionModel, synthesis));
  const solutionModels = $derived(compactSolutionModels(decisionModel));
  const tradeoffsAndRisks = $derived(compactTradeoffsAndRisks(topic, decisionModel, synthesis));
  const recommendations = $derived(compactRecommendations(topic, decisionModel, synthesis));
  const statutesItems = $derived(compactStatutes(topic, decisionModel, synthesis));
  const rriItems = $derived(compactRri(topic, decisionModel, synthesis));

  function compactQuestions(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null
  ): string[] {
    if (model) {
      const evidenced = model.decisionQuestions
        .filter((question) => question.relatedExtracts.length > 0)
        .map((question) => question.question);

      if (evidenced.length > 0) {
        return evidenced.slice(0, 8);
      }
    }

    const synthesisDecisions = currentSynthesis?.recommendationsForBuenVivir.pointsToDecideSoon ?? [];
    return [...currentTopic.decisionsForBuenVivir, ...synthesisDecisions].slice(0, 6);
  }

  function compactSolutionModels(model: TopicDecisionModel | null): SolutionApproach[] {
    if (!model) {
      return [];
    }

    const byName = new Map<string, SolutionApproach>();

    for (const question of model.decisionQuestions) {
      for (const approach of question.detectedApproaches) {
        if (!byName.has(approach.name)) {
          byName.set(approach.name, approach);
        }
      }
    }

    return [...byName.values()].slice(0, 5);
  }

  function compactTradeoffsAndRisks(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null
  ): string[] {
    const modelItems = model ? [...model.commonTradeoffs, ...model.frequentRisks] : [];
    const synthesisItems = currentSynthesis
      ? [...currentSynthesis.summary.commonTradeoffs, ...currentSynthesis.summary.commonRisks]
      : [];

    return unique([...modelItems, ...synthesisItems, ...currentTopic.risks]).slice(0, 6);
  }

  function compactRecommendations(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null
  ): string[] {
    const synthesisItems = currentSynthesis
      ? [
          ...currentSynthesis.recommendationsForBuenVivir.pointsToDecideSoon,
          ...currentSynthesis.recommendationsForBuenVivir.minimalApproach
        ]
      : [];

    return unique([...(model?.recommendationsForBuenVivir ?? []), ...currentTopic.decisionsForBuenVivir, ...synthesisItems]).slice(0, 5);
  }

  function compactStatutes(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null
  ): string[] {
    return unique([
      ...(model?.suggestedPlacement.statutes ?? []),
      ...currentTopic.governancePlacement.shouldBeInStatutes,
      ...(currentSynthesis?.governancePlacement.usuallyInStatutes ?? [])
    ]).slice(0, 4);
  }

  function compactRri(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null
  ): string[] {
    return unique([
      ...(model?.suggestedPlacement.rri ?? []),
      ...currentTopic.governancePlacement.shouldBeInRRI,
      ...(currentSynthesis?.governancePlacement.usuallyInRRI ?? [])
    ]).slice(0, 4);
  }

  function unique(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
  }
</script>

<article class="topic-page">
  <TopicHero {topic} />

  <section class="workbench">
    <EditorialSection title="Qué debe decidir el grupo" density="compact">
      {#if decisionQuestions.length > 0}
        <DecisionChecklist title="Preguntas de trabajo" items={decisionQuestions} priority="high" />
      {:else}
        <p class="empty-note">No se han encontrado suficientes preguntas claras para este tema.</p>
      {/if}
    </EditorialSection>

    {#if solutionModels.length > 0}
      <EditorialSection title="Modelos de solución detectados" density="normal">
        <div class="solution-grid">
          {#each solutionModels as approach}
            <CompactSolutionModel {approach} />
          {/each}
        </div>
      </EditorialSection>
    {/if}

    {#if tradeoffsAndRisks.length > 0}
      <EditorialSection title="Tradeoffs y riesgos" density="compact">
        <CompactInsightList items={tradeoffsAndRisks} limit={6} />
      </EditorialSection>
    {/if}

    <EditorialSection title="Estatutos vs RRI" density="compact">
      <GovernanceSplit statutes={statutesItems} rri={rriItems} />
    </EditorialSection>

    {#if recommendations.length > 0}
      <EditorialSection title="Recomendación para El Buen Vivir" density="compact">
        <CompactInsightList items={recommendations} limit={5} tone="highlight" />
      </EditorialSection>
    {/if}

    {#if decisionModel && decisionModel.limits.length > 0}
      <EditorialSection title="Si falta evidencia" density="compact">
        <CompactInsightList items={decisionModel.limits} limit={3} />
      </EditorialSection>
    {/if}
  </section>

  <EditorialSection title="Profundizar" subtitle="Evidencia y material de apoyo, cerrado por defecto" density="compact">
    <CollapsibleReferences decisionModel={decisionModel} generatedReferences={data.generatedReferences} />

    {#if topic.suggestedClause}
      <div class="secondary-block">
        <SuggestedClauseBlock clause={topic.suggestedClause} />
      </div>
    {/if}
  </EditorialSection>

  {#if topic.relatedTopics && topic.relatedTopics.length > 0}
    <EditorialSection title="Temas relacionados" density="compact">
      <RelatedTopicsCard topicSlug={topic.slug} relatedTopics={topic.relatedTopics} topics={data.topics} />
    </EditorialSection>
  {/if}
</article>

<style>
  .topic-page {
    max-width: 70ch;
    margin: 0 auto;
  }

  .workbench {
    display: grid;
    gap: 0.35rem;
  }

  .solution-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 0.85rem;
  }

  .empty-note {
    margin: 0;
    padding: 0.9rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: #fafafa;
    color: var(--muted);
    font-size: 0.92rem;
  }

  .secondary-block {
    margin-top: 0.85rem;
  }

  @media (max-width: 640px) {
    .topic-page {
      max-width: 100%;
    }
  }
</style>

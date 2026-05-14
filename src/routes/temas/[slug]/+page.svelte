<script lang="ts">
  import CollapsibleReferences from '$lib/components/CollapsibleReferences.svelte';
  import CompactInsightList from '$lib/components/CompactInsightList.svelte';
  import CompactSolutionModel from '$lib/components/CompactSolutionModel.svelte';
  import ConflictingApproaches from '$lib/components/ConflictingApproaches.svelte';
  import DecisionChecklist from '$lib/components/DecisionChecklist.svelte';
  import EditorialSection from '$lib/components/EditorialSection.svelte';
  import EvidenceBadge from '$lib/components/EvidenceBadge.svelte';
  import GovernanceSplit from '$lib/components/GovernanceSplit.svelte';
  import RelatedTopicsCard from '$lib/components/RelatedTopicsCard.svelte';
  import SuggestedClauseBlock from '$lib/components/SuggestedClauseBlock.svelte';
  import TopicHero from '$lib/components/TopicHero.svelte';
  import type {
    ConsultableTopic,
    EvidenceClaim,
    EvidenceTopicLayer,
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
      evidenceLayer: EvidenceTopicLayer | null;
      generatedReferences: GeneratedTopicReference[];
      synthesis: GeneratedTopicSynthesis | null;
    };
  } = $props();

  const topic = $derived(data.topic);
  const decisionModel = $derived(data.decisionModel);
  const evidenceLayer = $derived(data.evidenceLayer);
  const synthesis = $derived(data.synthesis);

  const decisionQuestions = $derived(compactQuestions(topic, decisionModel, synthesis));
  const solutionModels = $derived(compactSolutionModels(decisionModel));
  const tradeoffsAndRisks = $derived(compactTradeoffsAndRisks(topic, decisionModel, synthesis));
  const recommendations = $derived(compactRecommendations(topic, decisionModel, synthesis));
  const statutesItems = $derived(compactStatutes(topic, decisionModel, synthesis));
  const rriItems = $derived(compactRri(topic, decisionModel, synthesis));

  const evidenceClaims = $derived(evidenceLayer?.claims ?? []);
  const evidenceConflicts = $derived(evidenceLayer?.conflictingApproaches ?? []);
  const evidenceExtracts = $derived(evidenceLayer?.extracts ?? []);
  const hasEvidence = $derived(evidenceClaims.length > 0);
  const evidenceHealth = $derived(evidenceLayer?.evidenceHealth);
  const isStrongModerate = $derived(evidenceHealth === 'strong' || evidenceHealth === 'moderate');
  const isWeak = $derived(evidenceHealth === 'weak');
  const isInsufficient = $derived(evidenceHealth === 'insufficient');
  const showHealthWarning = $derived(isWeak || isInsufficient);

  const explicitClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'explicit'));
  const weakClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'weak_evidence'));
  const inferredClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'inferred'));

  function compactQuestions(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null
  ): string[] {
    if (model) {
      const evidenced = model.decisionQuestions
        .filter((question) => question.relatedExtracts.length > 0)
        .map((question) => question.question);
      if (evidenced.length > 0) return evidenced.slice(0, 8);
    }
    const synthesisDecisions = currentSynthesis?.recommendationsForBuenVivir.pointsToDecideSoon ?? [];
    return [...currentTopic.decisionsForBuenVivir, ...synthesisDecisions].slice(0, 6);
  }

  function compactSolutionModels(model: TopicDecisionModel | null): SolutionApproach[] {
    if (!model) return [];
    const byName = new Map<string, SolutionApproach>();
    for (const question of model.decisionQuestions) {
      for (const approach of question.detectedApproaches) {
        if (!byName.has(approach.name)) byName.set(approach.name, approach);
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
      ? [...currentSynthesis.recommendationsForBuenVivir.pointsToDecideSoon, ...currentSynthesis.recommendationsForBuenVivir.minimalApproach]
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

    {#if solutionModels.length > 0 && !isInsufficient}
      <EditorialSection
        title={isWeak ? 'Posibles enfoques a contrastar' : 'Modelos de solución detectados'}
        density="normal"
        subtitle={isWeak ? 'Identificados en los documentos, pero con evidencia limitada. Son hipótesis a validar.' : undefined}>
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
        <CompactInsightList items={recommendations} limit={5} />
      </EditorialSection>
    {/if}

    {#if decisionModel && decisionModel.limits.length > 0}
      <EditorialSection title="Si falta evidencia" density="compact">
        <CompactInsightList items={decisionModel.limits} limit={3} />
      </EditorialSection>
    {/if}
  </section>

  {#if isInsufficient}
    <section class="evidence-section">
      <div class="health-warning insufficient">
        <strong>No hay suficiente evidencia documental directa.</strong>
        Los documentos analizados no contienen suficiente información sobre este tema para presentar conclusiones comparadas. Las preguntas y observaciones que aparecen a continuación son hipótesis de trabajo que El Buen Vivir debe resolver mediante diálogo interno, apoyo externo o búsqueda de referencias adicionales.
      </div>
    </section>
  {:else if hasEvidence}
    <section class="evidence-section">
      {#if isWeak}
        <div class="health-warning">
          <strong>Evidencia limitada.</strong>
          Este tema tiene poca evidencia documental directa en los proyectos analizados.
          Las ideas se presentan como hipótesis de trabajo y deben contrastarse antes de redactar acuerdos.
        </div>
      {/if}
      <EditorialSection title="Análisis de evidencia documental" subtitle="Lo que dicen realmente los documentos" density="compact">
        {#if explicitClaims.length > 0}
          <div class="claims-group">
            <h4 class="claims-heading">Evidencia explícita detectada</h4>
            <ul class="claims-list explicit">
              {#each explicitClaims as claim}
                <li>
                  <span class="claim-text">{claim.statement}</span>
                  <EvidenceBadge type={claim.evidenceType} confidence={claim.confidence} compact />
                  {#if claim.supportingReferences.length > 0}
                    <span class="ref-count">{claim.supportingReferences.length} referencia(s)</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if inferredClaims.length > 0}
          <div class="claims-group">
            <h4 class="claims-heading">Evidencia inferida</h4>
            <ul class="claims-list inferred">
              {#each inferredClaims as claim}
                <li>
                  <span class="claim-text">{claim.statement}</span>
                  <EvidenceBadge type={claim.evidenceType} confidence={claim.confidence} compact />
                  {#if claim.supportingReferences.length > 0}
                    <span class="ref-count">{claim.supportingReferences.length} referencia(s)</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if evidenceConflicts.length > 0}
          <EditorialSection title="Enfoques contradictorios detectados" density="compact">
            <ConflictingApproaches approaches={evidenceConflicts} />
          </EditorialSection>
        {/if}

        {#if weakClaims.length > 0}
          <div class="claims-group">
            <h4 class="claims-heading">Evidencia limitada o no detectada</h4>
            <ul class="claims-list weak">
              {#each weakClaims as claim}
                <li>
                  <span class="claim-text">{claim.statement}</span>
                  <EvidenceBadge type={claim.evidenceType} confidence={claim.confidence} compact />
                  {#if claim.explanation}
                    <span class="claim-note">{claim.explanation}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </EditorialSection>
    </section>
  {/if}

  {#if isInsufficient}
    <section class="evidence-section">
      <EditorialSection title="Qué debe decidir El Buen Vivir" subtitle="Preguntas para trabajar en grupo" density="compact">
        {#if decisionQuestions.length > 0}
          <DecisionChecklist title="Preguntas de trabajo" items={decisionQuestions} priority="high" />
        {:else}
          <p class="empty-note">No se han encontrado preguntas claras en los documentos analizados.</p>
        {/if}
      </EditorialSection>

      {#if solutionModels.length > 0}
        <EditorialSection title="Hipótesis de trabajo" subtitle="Ideas detectadas en los documentos, con evidencia insuficiente para presentarlas como enfoques contrastados" density="compact">
          <div class="solution-grid">
            {#each solutionModels as approach}
              <CompactSolutionModel {approach} />
            {/each}
          </div>
        </EditorialSection>
      {/if}

      {#if tradeoffsAndRisks.length > 0}
        <EditorialSection title="Tradeoffs y riesgos a considerar" density="compact">
          <CompactInsightList items={tradeoffsAndRisks} limit={6} />
        </EditorialSection>
      {/if}

      <EditorialSection title="Documentos donde buscar" density="compact">
        <p class="explore-note">Este tema tiene poca cobertura en los documentos analizados. Para avanzar, el grupo puede consultar:</p>
        <ul class="explore-list">
          <li>Reglamentos de Régimen Interior de otras cooperativas.</li>
          <li>Actas de asamblea y acuerdos de convivencia de proyectos existentes.</li>
          <li>Guías sectoriales de cohousing y vivienda cooperativa.</li>
          <li>Asesoramiento jurídico especializado en derecho cooperativo.</li>
        </ul>
      </EditorialSection>
    </section>
  {/if}

  <EditorialSection
    title="Profundizar"
    subtitle={isWeak ? 'Evidencia y material de apoyo' : 'Evidencia y material de apoyo, cerrado por defecto'}
    density="compact">
    <CollapsibleReferences
      decisionModel={decisionModel}
      generatedReferences={data.generatedReferences}
      evidenceExtracts={evidenceExtracts} />

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
  .topic-page { max-width: 70ch; margin: 0 auto; }
  .workbench { display: grid; gap: 0.35rem; }
  .solution-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 0.85rem; }
  .empty-note { margin: 0; padding: 0.9rem; border: 1px solid var(--border); border-radius: 4px; background: #fafafa; color: var(--muted); font-size: 0.92rem; }
  .secondary-block { margin-top: 0.85rem; }
  .evidence-section { margin-top: 0.5rem; }
  .claims-group { margin-bottom: 0.75rem; }
  .claims-heading { margin: 0 0 0.4rem; font-size: 0.85rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .claims-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.35rem; }
  .claims-list li {
    display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem;
    padding: 0.5rem 0.65rem; border-radius: 4px; font-size: 0.88rem; line-height: 1.35;
  }
  .claims-list.explicit li { border: 1px solid #bbf7d0; background: #f0fdf4; }
  .claims-list.inferred li { border: 1px solid #fde68a; background: #fffbeb; }
  .claims-list.weak li { border: 1px solid #fecaca; background: #fef2f2; }
  .claim-text { flex: 1 1 auto; min-width: 0; }
  .ref-count { color: var(--muted); font-size: 0.76rem; white-space: nowrap; }
  .claim-note { width: 100%; color: var(--muted); font-size: 0.8rem; font-style: italic; }
  .health-warning {
    margin-bottom: 0.6rem; padding: 0.65rem 0.85rem;
    border: 1px solid #fde68a; border-radius: 4px;
    background: #fffbeb; font-size: 0.85rem; line-height: 1.4;
  }
  .health-warning strong { color: #92400e; }
  .health-warning.insufficient { border-color: #fecaca; background: #fef2f2; }
  .health-warning.insufficient strong { color: #991b1b; }
  .explore-note { margin: 0 0 0.5rem; font-size: 0.9rem; }
  .explore-list { margin: 0; padding: 0 0 0 1.2rem; display: grid; gap: 0.3rem; font-size: 0.88rem; }
  .explore-list li { line-height: 1.4; }
  @media (max-width: 640px) { .topic-page { max-width: 100%; } }
</style>

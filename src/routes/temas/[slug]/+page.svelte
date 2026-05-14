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
  import { validatedTopicStatusLabels } from '$lib/content/validatedTopicSchema';
  import type {
    ConsultableTopic,
    EditorialReview,
    EvidenceClaim,
    EvidenceTopicLayer,
    GeneratedTopicReference,
    GeneratedTopicSynthesis,
    SolutionApproach,
    TopicDecisionModel,
    ValidatedDecisionQuestion,
    ValidatedTopic
  } from '$lib/content/types';

  let { data }: {
    data: {
      topic: ConsultableTopic;
      topics: ConsultableTopic[];
      decisionModel: TopicDecisionModel | null;
      evidenceLayer: EvidenceTopicLayer | null;
      generatedReferences: GeneratedTopicReference[];
      synthesis: GeneratedTopicSynthesis | null;
      editorialReview: EditorialReview | null;
      validatedTopic: ValidatedTopic | null;
    };
  } = $props();

  const topic = $derived(data.topic);
  const decisionModel = $derived(data.decisionModel);
  const evidenceLayer = $derived(data.evidenceLayer);
  const synthesis = $derived(data.synthesis);
  const editorialReview = $derived(data.editorialReview);
  const validatedTopic = $derived(data.validatedTopic);

  const filteredDecisionModel = $derived(filterDecisionModel(decisionModel, validatedTopic));
  const decisionQuestions = $derived(compactQuestions(topic, filteredDecisionModel, synthesis, validatedTopic));
  const solutionModels = $derived(compactSolutionModels(filteredDecisionModel, validatedTopic));
  const tradeoffsAndRisks = $derived(compactTradeoffsAndRisks(topic, filteredDecisionModel, synthesis, validatedTopic));
  const recommendations = $derived(compactRecommendations(topic, filteredDecisionModel, synthesis, validatedTopic));
  const statutesItems = $derived(compactStatutes(topic, filteredDecisionModel, synthesis, validatedTopic));
  const rriItems = $derived(compactRri(topic, filteredDecisionModel, synthesis, validatedTopic));

  const unsupportedClaimIds = $derived(new Set((validatedTopic?.unsupportedClaims ?? []).flatMap((claim) => [claim.id, claim.claimId].filter(Boolean) as string[])));
  const unsupportedStatements = $derived(new Set((validatedTopic?.unsupportedClaims ?? []).map((claim) => claim.statement).filter(Boolean) as string[]));
  const evidenceClaims = $derived((evidenceLayer?.claims ?? []).filter((claim) => !isUnsupportedClaim(claim, unsupportedClaimIds, unsupportedStatements)));
  const evidenceConflicts = $derived(evidenceLayer?.conflictingApproaches ?? []);
  const evidenceExtracts = $derived((evidenceLayer?.extracts ?? []).filter((extract) => !unsupportedClaimIds.has(extract.claimId)));
  const hasEvidence = $derived(evidenceClaims.length > 0);
  const evidenceHealth = $derived(validatedTopic?.status === 'insufficient_evidence' || validatedTopic?.status === 'evidencia_insuficiente' ? 'insufficient' : evidenceLayer?.evidenceHealth);
  const isWeak = $derived(evidenceHealth === 'weak');
  const isInsufficient = $derived(evidenceHealth === 'insufficient');

  const explicitClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'explicit'));
  const weakClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'weak_evidence'));
  const inferredClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'inferred'));
  const editorialStatus = $derived(editorialStatusLabel(validatedTopic, editorialReview));
  const editorialStatusClass = $derived(validatedTopic?.status ?? (editorialReview ? 'review-available' : 'generated-warning'));

  function compactQuestions(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null,
    validated: ValidatedTopic | null
  ): string[] {
    if (validated) {
      const questions = validated.decisionQuestions.map((question) => typeof question === 'string' ? question : question.question);
      if (questions.length > 0) return unique(questions).slice(0, 8);
    }
    if (model) {
      const evidenced = model.decisionQuestions
        .filter((question) => question.relatedExtracts.length > 0)
        .map((question) => question.question);
      if (evidenced.length > 0) return evidenced.slice(0, 8);
    }
    const synthesisDecisions = currentSynthesis?.recommendationsForBuenVivir.pointsToDecideSoon ?? [];
    return [...currentTopic.decisionsForBuenVivir, ...synthesisDecisions].slice(0, 6);
  }

  function compactSolutionModels(model: TopicDecisionModel | null, validated: ValidatedTopic | null): SolutionApproach[] {
    const unsupportedNames = new Set((validated?.unsupportedClaims ?? []).flatMap((claim) => claim.approachNames ?? []));

    if (validated) {
      const validatedApproaches = validated.decisionQuestions
        .filter((question): question is ValidatedDecisionQuestion => typeof question !== 'string')
        .flatMap((question) => question.detectedApproaches ?? [])
        .filter((approach) => !unsupportedNames.has(approach.name));

      if (validatedApproaches.length > 0) return uniqueApproaches(validatedApproaches).slice(0, 5);
      return [];
    }

    if (!model) return [];
    const byName = new Map<string, SolutionApproach>();
    for (const question of model.decisionQuestions) {
      for (const approach of question.detectedApproaches) {
        if (!unsupportedNames.has(approach.name) && !byName.has(approach.name)) byName.set(approach.name, approach);
      }
    }
    return [...byName.values()].slice(0, 5);
  }

  function compactTradeoffsAndRisks(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null,
    validated: ValidatedTopic | null
  ): string[] {
    if (validated) {
      return unique([
        ...validated.editorialSummary,
        ...validated.supportedFindings.map((finding) => finding.statement),
        ...validated.unsupportedClaims.map((claim) => claim.reason ?? '').filter(Boolean)
      ]).slice(0, 6);
    }
    const modelItems = model ? [...model.commonTradeoffs, ...model.frequentRisks] : [];
    const synthesisItems = currentSynthesis
      ? [...currentSynthesis.summary.commonTradeoffs, ...currentSynthesis.summary.commonRisks]
      : [];
    return unique([...modelItems, ...synthesisItems, ...currentTopic.risks]).slice(0, 6);
  }

  function compactRecommendations(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null,
    validated: ValidatedTopic | null
  ): string[] {
    if (validated) return unique(validated.recommendationsForBuenVivir).slice(0, 5);
    const synthesisItems = currentSynthesis
      ? [...currentSynthesis.recommendationsForBuenVivir.pointsToDecideSoon, ...currentSynthesis.recommendationsForBuenVivir.minimalApproach]
      : [];
    return unique([...(model?.recommendationsForBuenVivir ?? []), ...currentTopic.decisionsForBuenVivir, ...synthesisItems]).slice(0, 5);
  }

  function compactStatutes(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null,
    validated: ValidatedTopic | null
  ): string[] {
    if (validated) return unique(validated.statutesVsRRI.statutes).slice(0, 4);
    return unique([
      ...(model?.suggestedPlacement.statutes ?? []),
      ...currentTopic.governancePlacement.shouldBeInStatutes,
      ...(currentSynthesis?.governancePlacement.usuallyInStatutes ?? [])
    ]).slice(0, 4);
  }

  function compactRri(
    currentTopic: ConsultableTopic,
    model: TopicDecisionModel | null,
    currentSynthesis: GeneratedTopicSynthesis | null,
    validated: ValidatedTopic | null
  ): string[] {
    if (validated) return unique(validated.statutesVsRRI.rri).slice(0, 4);
    return unique([
      ...(model?.suggestedPlacement.rri ?? []),
      ...currentTopic.governancePlacement.shouldBeInRRI,
      ...(currentSynthesis?.governancePlacement.usuallyInRRI ?? [])
    ]).slice(0, 4);
  }

  function unique(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
  }

  function uniqueApproaches(values: SolutionApproach[]): SolutionApproach[] {
    const byName = new Map<string, SolutionApproach>();
    for (const value of values) if (!byName.has(value.name)) byName.set(value.name, value);
    return [...byName.values()];
  }

  function isUnsupportedClaim(claim: EvidenceClaim, claimIds: Set<string>, statements: Set<string>): boolean {
    return claimIds.has(claim.id) || statements.has(claim.statement);
  }

  function filterDecisionModel(model: TopicDecisionModel | null, validated: ValidatedTopic | null): TopicDecisionModel | null {
    if (!model || !validated) return model;

    const unsupportedQuestionIds = new Set(validated.unsupportedClaims.flatMap((claim) => claim.decisionQuestionIds ?? []));
    const unsupportedApproachNames = new Set(validated.unsupportedClaims.flatMap((claim) => claim.approachNames ?? []));

    return {
      ...model,
      decisionQuestions: model.decisionQuestions
        .filter((question) => !unsupportedQuestionIds.has(question.id))
        .map((question) => ({
          ...question,
          detectedApproaches: question.detectedApproaches.filter((approach) => !unsupportedApproachNames.has(approach.name))
        }))
    };
  }

  function editorialStatusLabel(validated: ValidatedTopic | null, review: EditorialReview | null): string {
    if (validated) return validatedTopicStatusLabels[validated.status];
    if (review) return 'Revisión editorial disponible';
    return 'Contenido generado con aviso';
  }
</script>

<article class="topic-page">
  <TopicHero {topic} />

  <section class="editorial-status {editorialStatusClass}">
    <strong>{editorialStatus}</strong>
    {#if validatedTopic}
      <span>Esta página prioriza la revisión estructurada y conserva el material generado como apoyo documental.</span>
    {:else if editorialReview}
      <span>Existe una revisión editorial interna para este tema, pero todavía no hay una versión estructurada validada.</span>
    {:else}
      <span>Esta página usa contenido generado y debe contrastarse con las fuentes antes de redactar acuerdos.</span>
    {/if}
  </section>

  {#if validatedTopic && validatedTopic.editorialSummary.length > 0}
    <EditorialSection title="Resumen editorial" density="compact">
      <CompactInsightList items={validatedTopic.editorialSummary} limit={5} />
    </EditorialSection>
  {/if}

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

    {#if filteredDecisionModel && filteredDecisionModel.limits.length > 0 && !validatedTopic}
      <EditorialSection title="Si falta evidencia" density="compact">
        <CompactInsightList items={filteredDecisionModel.limits} limit={3} />
      </EditorialSection>
    {/if}
  </section>

  {#if validatedTopic}
    <section class="evidence-section">
      <EditorialSection title="Hallazgos revisados" subtitle="Conclusiones que pasan la revisión estructurada" density="compact">
        {#if validatedTopic.supportedFindings.length > 0}
          <ul class="findings-list">
            {#each validatedTopic.supportedFindings as finding}
              <li>
                <span>{finding.statement}</span>
                {#if finding.summary}<small>{finding.summary}</small>{/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty-note">La revisión no confirma hallazgos documentales suficientes para este tema.</p>
        {/if}
      </EditorialSection>

      {#if validatedTopic.unsupportedClaims.length > 0}
        <EditorialSection title="No usar como conclusión" subtitle="Claims o modelos descartados por la revisión" density="compact">
          <ul class="unsupported-list">
            {#each validatedTopic.unsupportedClaims as claim}
              <li>
                <span>{claim.statement ?? claim.claimId ?? claim.id}</span>
                {#if claim.reason}<small>{claim.reason}</small>{/if}
              </li>
            {/each}
          </ul>
        </EditorialSection>
      {/if}

      {#if validatedTopic.referencesToUse.length > 0 || validatedTopic.referencesToAvoid.length > 0}
        <EditorialSection title="Referencias editoriales" density="compact">
          <div class="reference-guidance">
            {#if validatedTopic.referencesToUse.length > 0}
              <div>
                <h4>Usar</h4>
                <CompactInsightList items={validatedTopic.referencesToUse} limit={6} />
              </div>
            {/if}
            {#if validatedTopic.referencesToAvoid.length > 0}
              <div>
                <h4>Evitar</h4>
                <CompactInsightList items={validatedTopic.referencesToAvoid} limit={6} />
              </div>
            {/if}
          </div>
        </EditorialSection>
      {/if}
    </section>
  {:else if isInsufficient}
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

  {#if isInsufficient && !validatedTopic}
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
      decisionModel={filteredDecisionModel}
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
  .editorial-status {
    display: grid; gap: 0.2rem; margin: -0.55rem 0 1rem; padding: 0.7rem 0.85rem;
    border: 1px solid var(--border); border-radius: 4px; background: #fafafa;
    font-size: 0.86rem; line-height: 1.4;
  }
  .editorial-status strong { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .editorial-status span { color: var(--muted); }
  .editorial-status.reviewed { border-color: #bbf7d0; background: #f0fdf4; }
  .editorial-status.exploratory, .editorial-status.review-available { border-color: #fde68a; background: #fffbeb; }
  .editorial-status.insufficient_evidence, .editorial-status.evidencia_insuficiente { border-color: #fecaca; background: #fef2f2; }
  .editorial-status.generated-warning { border-color: #ddd6c8; background: #fbfaf7; }
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
  .findings-list, .unsupported-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.45rem; }
  .findings-list li, .unsupported-list li { display: grid; gap: 0.2rem; padding: 0.65rem 0.75rem; border: 1px solid var(--border); border-radius: 4px; background: #fff; }
  .findings-list span, .unsupported-list span { font-size: 0.9rem; line-height: 1.4; }
  .findings-list small, .unsupported-list small { color: var(--muted); font-size: 0.78rem; line-height: 1.35; }
  .unsupported-list li { border-color: #fecaca; background: #fef2f2; }
  .reference-guidance { display: grid; gap: 0.8rem; }
  .reference-guidance h4 { margin: 0 0 0.35rem; color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; }
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

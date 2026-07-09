<script lang="ts">
  import CollapsibleReferences from '$lib/components/CollapsibleReferences.svelte';
  import CompactInsightList from '$lib/components/CompactInsightList.svelte';
  import CompactSolutionModel from '$lib/components/CompactSolutionModel.svelte';
  import ConflictingApproaches from '$lib/components/ConflictingApproaches.svelte';
  import DecisionChecklist from '$lib/components/DecisionChecklist.svelte';
  import EditorialSection from '$lib/components/EditorialSection.svelte';
  import GovernanceSplit from '$lib/components/GovernanceSplit.svelte';
  import RelatedTopicsCard from '$lib/components/RelatedTopicsCard.svelte';
  import SuggestedClauseBlock from '$lib/components/SuggestedClauseBlock.svelte';
  import TopicDossier from '$lib/components/TopicDossier.svelte';
  import TopicHero from '$lib/components/TopicHero.svelte';
  import { canShowDecisionModels, canShowSuggestedClauses } from '$lib/content/editorialPolicy';
  import { validatedTopicStatusLabels } from '$lib/content/validatedTopicSchema';
  import type {
    ConsultableTopic,
    EditorialReview,
    EvidenceClaim,
    EvidenceTopicLayer,
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
      synthesis: GeneratedTopicSynthesis | null;
      editorialReview: EditorialReview | null;
      validatedTopic: ValidatedTopic | null;
    };
  } = $props();

  const topic = $derived(data.topic);
  const dossier = $derived(data.topic.dossier ?? null);
  const openDecisionsCount = $derived(dossier?.proposal?.openDecisions?.length ?? 0);
  const decisionModel = $derived(data.decisionModel);
  const evidenceLayer = $derived(data.evidenceLayer);
  const synthesis = $derived(data.synthesis);
  const editorialReview = $derived(data.editorialReview);
  const validatedTopic = $derived(data.validatedTopic);

  const editorialStatusKey = $derived(validatedTopic?.status ?? topic.editorialStatus);
  const normalizedStatusKey = $derived(editorialStatusKey === 'evidencia_insuficiente' ? 'insufficient_evidence' : editorialStatusKey);
  const isReviewed = $derived(normalizedStatusKey === 'reviewed');
  const isExploratory = $derived(normalizedStatusKey === 'exploratory');
  const isInsufficientState = $derived(normalizedStatusKey === 'insufficient_evidence');
  const filteredDecisionModel = $derived(canShowDecisionModels(topic) ? filterDecisionModel(decisionModel, validatedTopic) : null);
  const decisionQuestions = $derived(
    validatedTopic || isReviewed
      ? compactQuestions(topic, filteredDecisionModel, synthesis, validatedTopic)
      : topic.decisionsForBuenVivir.slice(0, 6)
  );
  const solutionModels = $derived(compactSolutionModels(filteredDecisionModel, validatedTopic));
  const tradeoffsAndRisks = $derived(
    validatedTopic || isReviewed ? compactTradeoffsAndRisks(topic, filteredDecisionModel, synthesis, validatedTopic) : topic.risks.slice(0, 5)
  );
  const recommendations = $derived(isReviewed ? compactRecommendations(topic, filteredDecisionModel, synthesis, validatedTopic) : []);
  const statutesItems = $derived(isReviewed ? compactStatutes(topic, filteredDecisionModel, synthesis, validatedTopic) : []);
  const rriItems = $derived(isReviewed ? compactRri(topic, filteredDecisionModel, synthesis, validatedTopic) : []);

  const unsupportedClaimIds = $derived(new Set((validatedTopic?.unsupportedClaims ?? []).flatMap((claim) => [claim.id, claim.claimId].filter(Boolean) as string[])));
  const unsupportedStatements = $derived(new Set((validatedTopic?.unsupportedClaims ?? []).map((claim) => claim.statement).filter(Boolean) as string[]));
  const evidenceClaims = $derived((evidenceLayer?.claims ?? []).filter((claim) => !isUnsupportedClaim(claim, unsupportedClaimIds, unsupportedStatements)));
  const evidenceConflicts = $derived(evidenceLayer?.conflictingApproaches ?? []);
  const evidenceExtracts = $derived((evidenceLayer?.extracts ?? []).filter((extract) => !unsupportedClaimIds.has(extract.claimId)));
  const hasEvidence = $derived(isReviewed && evidenceClaims.length > 0);
  const evidenceHealth = $derived(validatedTopic?.status === 'insufficient_evidence' || validatedTopic?.status === 'evidencia_insuficiente' ? 'insufficient' : evidenceLayer?.evidenceHealth);
  const isWeak = $derived(evidenceHealth === 'weak');

  const explicitClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'explicit'));
  const weakClaims = $derived(evidenceClaims.filter((c) => c.evidenceType === 'weak_evidence'));
  const exploratoryIndications = $derived(unique([...topic.minimumContents, ...tradeoffsAndRisks]).slice(0, 5));
  const exploratoryLimits = $derived(unique([...topic.risks, 'Revisar documentos concretos antes de convertirlo en acuerdo.']).slice(0, 4));
  const editorialStatus = $derived(editorialStatusLabel(validatedTopic, editorialReview, topic.editorialStatus));
  const editorialStatusClass = $derived(normalizedStatusKey);

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

  function editorialStatusLabel(validated: ValidatedTopic | null, review: EditorialReview | null, fallback: ConsultableTopic['editorialStatus']): string {
    if (validated) return validatedTopicStatusLabels[validated.status];
    if (review) return 'Exploratorio';
    return validatedTopicStatusLabels[fallback];
  }
</script>

<article class="topic-page">
  <a class="back-link" href="/temas">← Todos los temas</a>
  <TopicHero {topic} editorialStatus={editorialStatusKey} />

  {#if openDecisionsCount > 0}
    <a class="jump-decisions" href="#decisiones">
      <span>Lo que os queda por votar</span>
      <span class="jd-count">{openDecisionsCount}</span>
    </a>
  {/if}

  {#if isReviewed}
    <p class="page-note">Borrador de trabajo · contrastar con las fuentes y revisar jurídicamente antes de aprobarlo.</p>
  {:else}
    <section class="editorial-status {editorialStatusClass}">
      <strong>{editorialStatus}</strong>
      {#if isInsufficientState}
        <span>La revisión editorial concluye que el material disponible no permite sostener conclusiones comparadas.</span>
      {:else}
        <span>Este tema se ofrece como exploración prudente y debe contrastarse con las fuentes antes de redactar acuerdos.</span>
      {/if}
    </section>
  {/if}

  {#if validatedTopic && validatedTopic.editorialSummary.length > 0}
    <EditorialSection title="Resumen editorial" density="compact">
      <CompactInsightList items={validatedTopic.editorialSummary} limit={5} />
    </EditorialSection>
  {/if}

  {#if dossier}
    <TopicDossier {dossier} />
  {/if}

  {#if dossier}
    <!-- El dossier (arriba) es el contenido completo del tema; no se muestra la capa antigua. -->
  {:else if isInsufficientState}
    <section class="minimal-page">
      <div class="health-warning insufficient">
        <strong>No hay suficiente base documental.</strong>
        La documentación revisada no permite sacar conclusiones útiles ni proponer una regla. Este tema queda como conversación pendiente.
      </div>

      <EditorialSection title="Preguntas abiertas" density="compact">
        {#if decisionQuestions.length > 0}
          <DecisionChecklist title="Para hablar antes de decidir" items={decisionQuestions} priority="high" />
        {:else}
          <p class="empty-note">Todavía no hay preguntas editoriales suficientemente claras.</p>
        {/if}
      </EditorialSection>

      {#if tradeoffsAndRisks.length > 0}
        <EditorialSection title="Límites de la documentación" density="compact">
          <CompactInsightList items={tradeoffsAndRisks} limit={5} />
        </EditorialSection>
      {/if}

      {#if validatedTopic?.referencesToAvoid.length}
        <EditorialSection title="No usar como base" density="compact">
          <CompactInsightList items={validatedTopic.referencesToAvoid} limit={6} />
        </EditorialSection>
      {/if}
    </section>
  {:else if isExploratory}
    <section class="minimal-page">
      <EditorialSection title="Qué está en discusión" density="compact">
        {#if decisionQuestions.length > 0}
          <DecisionChecklist title="Preguntas iniciales" items={decisionQuestions} priority="high" />
        {:else}
          <p class="empty-note">Este tema necesita una formulación editorial más precisa.</p>
        {/if}
      </EditorialSection>

      {#if exploratoryIndications.length > 0}
        <EditorialSection title="Indicios útiles" density="compact">
          <CompactInsightList items={exploratoryIndications} limit={5} />
        </EditorialSection>
      {/if}

      {#if exploratoryLimits.length > 0}
        <EditorialSection title="Qué no está claro" density="compact">
          <CompactInsightList items={exploratoryLimits} limit={4} />
        </EditorialSection>
      {/if}
    </section>
  {:else if !dossier}
  <section class="workbench">
    <EditorialSection title="Qué debe decidir el grupo" density="compact">
      {#if decisionQuestions.length > 0}
        <DecisionChecklist title="Preguntas de trabajo" items={decisionQuestions} priority="high" />
      {:else}
        <p class="empty-note">No se han encontrado suficientes preguntas claras para este tema.</p>
      {/if}
    </EditorialSection>

    {#if solutionModels.length > 0}
      <EditorialSection
        title="Opciones que conviene comparar"
        density="normal"
        subtitle="Otros proyectos lo resuelven de maneras distintas; conviene elegir con cuidado.">
        <div class="solution-grid">
          {#each solutionModels as approach}
            <CompactSolutionModel {approach} />
          {/each}
        </div>
      </EditorialSection>
    {/if}

    {#if tradeoffsAndRisks.length > 0}
      <EditorialSection title="Qué suele generar conflicto" density="compact">
        <CompactInsightList items={tradeoffsAndRisks} limit={6} />
      </EditorialSection>
    {/if}

    {#if statutesItems.length > 0 || rriItems.length > 0}
      <EditorialSection title="Estatutos vs RRI" density="compact">
        <GovernanceSplit statutes={statutesItems} rri={rriItems} />
      </EditorialSection>
    {/if}

    {#if recommendations.length > 0}
      <EditorialSection title="Qué conviene decidir pronto" density="compact">
        <CompactInsightList items={recommendations} limit={5} />
      </EditorialSection>
    {/if}

  </section>

  {#if validatedTopic}
    <section class="evidence-section">
      <EditorialSection title="Lo que sí puede sostenerse" density="compact">
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
          <p class="empty-note">La revisión no confirma conclusiones documentales suficientes para este tema.</p>
        {/if}
      </EditorialSection>

      {#if validatedTopic.unsupportedClaims.length > 0}
        <EditorialSection title="No usar como conclusión" density="compact">
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
        <EditorialSection title="Documentos clave" density="compact">
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
  {:else if hasEvidence}
    <section class="evidence-section">
      {#if isWeak}
        <div class="health-warning">
          <strong>Evidencia limitada.</strong>
          Este tema tiene poca evidencia documental directa en los proyectos analizados.
          Las ideas se presentan como hipótesis de trabajo y deben contrastarse antes de redactar acuerdos.
        </div>
      {/if}
       <EditorialSection title="Base documental" density="compact">
        {#if explicitClaims.length > 0}
          <div class="claims-group">
            <h4 class="claims-heading">La documentación permite afirmar</h4>
            <ul class="claims-list explicit">
              {#each explicitClaims as claim}
                <li>
                  <span class="claim-text">{claim.statement}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if evidenceConflicts.length > 0}
          <EditorialSection title="Donde otros proyectos difieren" density="compact">
            <ConflictingApproaches approaches={evidenceConflicts} />
          </EditorialSection>
        {/if}

        {#if weakClaims.length > 0}
          <div class="claims-group">
            <h4 class="claims-heading">Evidencia limitada</h4>
            <ul class="claims-list weak">
              {#each weakClaims as claim}
                <li>
                  <span class="claim-text">{claim.statement}</span>
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

  {/if}

  {#if isReviewed && !dossier}
  <EditorialSection
    title="Documentos para contrastar"
    subtitle="Trazabilidad de lectura, no sustituto de revisión jurídica"
    density="compact">
    <CollapsibleReferences
      decisionModel={filteredDecisionModel}
      evidenceExtracts={evidenceExtracts} />

    {#if topic.suggestedClause && canShowSuggestedClauses(topic)}
      <div class="secondary-block">
        <SuggestedClauseBlock clause={topic.suggestedClause} />
      </div>
    {/if}
  </EditorialSection>
  {/if}

  {#if topic.relatedTopics && topic.relatedTopics.length > 0}
    <EditorialSection title="Temas relacionados" density="compact">
      <RelatedTopicsCard topicSlug={topic.slug} relatedTopics={topic.relatedTopics} topics={data.topics} />
    </EditorialSection>
  {/if}
</article>

<style>
  .topic-page { max-width: 70ch; margin: 0 auto; }
  .back-link { display: inline-block; margin-bottom: 0.9rem; color: var(--muted); text-decoration: none; font-size: 0.85rem; }
  .back-link:hover { color: var(--accent); }

  .jump-decisions {
    display: inline-flex; align-items: center; gap: 0.5rem;
    margin: 0 0 1.3rem;
    padding: 0.5rem 0.9rem;
    border: 1px dashed var(--accent-warm);
    border-radius: 999px;
    background: rgba(184, 118, 59, 0.07);
    color: var(--accent);
    font-weight: 600; font-size: 0.9rem;
    text-decoration: none;
    transition: background 0.12s;
  }
  .jump-decisions::after { content: '↓'; font-weight: 700; }
  .jump-decisions:hover { background: rgba(184, 118, 59, 0.15); }
  .jd-count {
    font-family: var(--font-display); font-weight: 600;
    background: var(--accent-warm); color: #fffdf8;
    border-radius: 999px; min-width: 1.4em; padding: 0 0.4em;
    text-align: center; font-size: 0.85rem;
  }
  .workbench { display: grid; gap: 0.35rem; }
  .minimal-page { display: grid; gap: 0.45rem; }
  .page-note {
    margin: 0 0 1.4rem;
    padding-left: 0.7rem;
    border-left: 2px solid var(--border);
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.45;
  }
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

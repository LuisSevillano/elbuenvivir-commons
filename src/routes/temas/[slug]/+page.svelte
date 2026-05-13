<script lang="ts">
  import ReferenceCard from '$lib/components/ReferenceCard.svelte';
  import RelatedTopicsCard from '$lib/components/RelatedTopicsCard.svelte';
  import TopicHero from '$lib/components/TopicHero.svelte';
  import EditorialSection from '$lib/components/EditorialSection.svelte';
  import ComparisonColumns from '$lib/components/ComparisonColumns.svelte';
  import DecisionChecklist from '$lib/components/DecisionChecklist.svelte';
  import ExpandableReferenceGroup from '$lib/components/ExpandableReferenceGroup.svelte';
  import InsightBlock from '$lib/components/InsightBlock.svelte';
  import SuggestedClauseBlock from '$lib/components/SuggestedClauseBlock.svelte';
  import SoftCallout from '$lib/components/SoftCallout.svelte';
  import { legalDisclaimer } from '$lib/content/labels';
  import type { GeneratedTopicReference, GeneratedTopicSynthesis, GovernanceTopic } from '$lib/content/types';

  let { data }: {
    data: {
      topic: GovernanceTopic;
      topics: GovernanceTopic[];
      generatedReferences: GeneratedTopicReference[];
      synthesis: GeneratedTopicSynthesis | null;
    };
  } = $props();

  const topic = $derived(data.topic);
  const synthesis = $derived(data.synthesis);
  const refCount = $derived(data.generatedReferences.length);
  const projectCount = $derived(new Set(data.generatedReferences.map(r => r.projectName).filter(Boolean)).size);

  const projectNames = $derived(
    Array.from(new Set(data.generatedReferences.map(r => r.projectName).filter(Boolean)))
  );

  </script>

<article class="topic-page">
  <TopicHero {topic} referenceCount={refCount} projectCount={projectCount} />

  <SoftCallout type="info" title="Aviso jurídico">
    {legalDisclaimer}
  </SoftCallout>

  <EditorialSection title="Resumen rápido" subtitle="Puntos clave para entender este tema" density="compact">
    <ul class="quick-summary">
      {#each topic.minimumContents.slice(0, 5) as item}
        <li>{item}</li>
      {/each}
    </ul>
  </EditorialSection>

  {#if synthesis}
    <section class="analysis-section">
      <EditorialSection
        title="Análisis comparado"
        subtitle="Cómo otros proyectos han resuelto esta cuestión"
        density="spacious"
      >
        <SoftCallout type="note" title="Lectura orientativa">
          Esta síntesis se basa en {synthesis.generatedFrom.referencesCount} referencias de {synthesis.generatedFrom.documents.length} documentos. Contrasta siempre con los documentos relacionados y solicita revisión jurídica antes de convertir estas observaciones en acuerdos.
        </SoftCallout>

        {#if synthesis.summary.overview.length > 0}
          <InsightBlock type="pattern" label="Resumen">
            <ul>
              {#each synthesis.summary.overview as item}
                <li>{item}</li>
              {/each}
            </ul>
          </InsightBlock>
        {/if}

        {#if synthesis.summary.commonPatterns.length > 0}
          <InsightBlock type="pattern" label="Patrones detectados">
            <ul>
              {#each synthesis.summary.commonPatterns as item}
                <li>{item}</li>
              {/each}
            </ul>
          </InsightBlock>
        {/if}

        {#if synthesis.summary.majorDifferences.length > 0}
          <InsightBlock type="difference" label="Diferencias importantes">
            <ul>
              {#each synthesis.summary.majorDifferences as item}
                <li>{item}</li>
              {/each}
            </ul>
          </InsightBlock>
        {/if}
      </EditorialSection>

      <EditorialSection title="Estatutos vs RRI" subtitle="Dónde suele regularse esta cuestión" density="spacious">
        <ComparisonColumns
          columns={[
            { title: 'Estatutos', color: 'blue', items: synthesis.governancePlacement.usuallyInStatutes },
            { title: 'RRI', color: 'green', items: synthesis.governancePlacement.usuallyInRRI }
          ]}
        />

        {#if synthesis.governancePlacement.mixedApproaches.length > 0}
          <div class="mixed-approaches">
            <h4>Soluciones mixtas</h4>
            <ul>
              {#each synthesis.governancePlacement.mixedApproaches as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </EditorialSection>

      {#if synthesis.detectedTensions.length > 0 || synthesis.summary.commonRisks.length > 0}
        <EditorialSection title="Riesgos y tensiones" subtitle="Qué observar y prevenir" density="spacious">
          {#if synthesis.detectedTensions.length > 0}
            <InsightBlock type="tension" label="Tensiones detectadas">
              <ul>
                {#each synthesis.detectedTensions as tension}
                  <li>{tension}</li>
                {/each}
              </ul>
            </InsightBlock>
          {/if}

          {#if synthesis.summary.commonRisks.length > 0}
            <InsightBlock type="risk" label="Riesgos frecuentes">
              <ul>
                {#each synthesis.summary.commonRisks as risk}
                  <li>{risk}</li>
                {/each}
              </ul>
            </InsightBlock>
          {/if}
        </EditorialSection>
      {/if}

      <EditorialSection title="Decisiones para El Buen Vivir" subtitle="Qué definir y en qué orden" density="normal">
        {#if synthesis.recommendationsForBuenVivir.pointsToDecideSoon.length > 0}
          <DecisionChecklist
            title="Decisiones que conviene tomar pronto"
            items={synthesis.recommendationsForBuenVivir.pointsToDecideSoon}
            priority="high"
          />
        {/if}

        {#if synthesis.recommendationsForBuenVivir.minimalApproach.length > 0}
          <DecisionChecklist
            title="Enfoque mínimo"
            items={synthesis.recommendationsForBuenVivir.minimalApproach}
            priority="medium"
          />
        {/if}

        {#if synthesis.recommendationsForBuenVivir.pointsThatCanWait.length > 0}
          <DecisionChecklist
            title="Cuestiones que pueden esperar"
            items={synthesis.recommendationsForBuenVivir.pointsThatCanWait}
            priority="low"
          />
        {/if}
      </EditorialSection>
    </section>
  {/if}

  <EditorialSection title="Ubicación recomendada" subtitle="Dónde conviene regular esta cuestión" density="compact">
    <ComparisonColumns
      columns={[
        { title: 'Estatutos', color: 'blue', items: topic.governancePlacement.shouldBeInStatutes },
        { title: 'RRI', color: 'green', items: topic.governancePlacement.shouldBeInRRI }
      ]}
    />
  </EditorialSection>

  {#if topic.risks.length > 0}
    <EditorialSection title="Riesgos a valorar" density="compact">
      <ul class="risk-list">
        {#each topic.risks as risk}
          <li>{risk}</li>
        {/each}
      </ul>
    </EditorialSection>
  {/if}

  {#if data.generatedReferences.length > 0}
    <EditorialSection
      title="Ejemplos de documentos"
      subtitle="Referencias donde se trata este tema"
      density="normal"
    >
      <ExpandableReferenceGroup
        title="Referencias detectadas en documentos"
        count={data.generatedReferences.length}
        defaultExpanded={false}
      >
        <div class="references-list">
          {#each data.generatedReferences as reference}
            <ReferenceCard {reference} automatic />
          {/each}
        </div>
      </ExpandableReferenceGroup>
    </EditorialSection>
  {/if}

  {#if topic.suggestedClause}
    <EditorialSection title="Ejemplo orientativo" density="normal">
      <SuggestedClauseBlock clause={topic.suggestedClause} />
    </EditorialSection>
  {/if}

  {#if topic.relatedTopics && topic.relatedTopics.length > 0}
    <EditorialSection title="Temas relacionados" density="compact">
      <RelatedTopicsCard
        topicSlug={topic.slug}
        relatedTopics={topic.relatedTopics}
        topics={data.topics}
      />
    </EditorialSection>
  {/if}
</article>

{#snippet renderList(items: string[])}
  {#if items.length === 0}
    <p class="empty-text">Sin información disponible</p>
  {:else}
    <ul>
      {#each items as item}
        <li>{item}</li>
      {/each}
    </ul>
  {/if}
{/snippet}

<style>
  .topic-page {
    max-width: 75ch;
    margin: 0 auto;
  }

  .quick-summary {
    padding-left: 1.25rem;
  }

  .quick-summary li {
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
  }

  .analysis-section {
    margin-top: 2rem;
  }

  .mixed-approaches {
    margin-top: 1rem;
    padding: 1rem;
    background: #faf5ff;
    border-radius: 4px;
  }

  .mixed-approaches h4 {
    font-size: 0.9rem;
    font-weight: 600;
    color: #7e22ce;
    margin: 0 0 0.5rem;
  }

  .mixed-approaches ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  .mixed-approaches li {
    font-size: 0.9rem;
    margin-bottom: 0.35rem;
  }

  .risk-list {
    list-style: none;
    padding: 0;
  }

  .risk-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
  }

  .risk-list li:last-child {
    border-bottom: none;
  }

  .references-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty-text {
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
  }
</style>

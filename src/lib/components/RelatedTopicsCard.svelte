<script lang="ts">
  import { relationshipLabel } from '$lib/content/labels';
  import type { GovernanceTopic } from '$lib/content/types';

  interface RelatedTopic {
    topicSlug: string;
    relationship: string;
    explanation?: string;
  }

  interface Props {
    topicSlug: string;
    relatedTopics: RelatedTopic[];
    topics: GovernanceTopic[];
  }

  let { topicSlug, relatedTopics, topics }: Props = $props();

  const topicsMap = $derived(() => {
    const map = new Map<string, GovernanceTopic>();
    for (const topic of topics) {
      map.set(topic.slug, topic);
    }
    return map;
  });

  function getRelationText(relationship: string): string {
    const texts: Record<string, string> = {
      develops: 'Este tema desarrolla',
      depends_on: 'Este tema depende de',
      complements: 'Este tema complementa',
      limits: 'Este tema limita',
      operationalizes: 'Este tema hace operativo',
      generates_tension_with: 'Este tema puede generar tensión con'
    };
    return texts[relationship] ?? 'Relacionado con';
  }
</script>

{#if relatedTopics && relatedTopics.length > 0}
  <div class="related-topics">
    <h3>Temas relacionados</h3>
    <p class="lead">Este tema no está aislado. Se relaciona con otras cuestiones de gobernanza:</p>
    <ul class="relations">
      {#each relatedTopics as relation}
        {@const related = topicsMap().get(relation.topicSlug)}
        {#if related}
          <li class="relation-item">
            <span class="relation-type">{getRelationText(relation.relationship)}</span>
            <a href="/temas/{relation.topicSlug}" class="relation-link">{related.title}</a>
            {#if relation.explanation}
              <span class="relation-explanation">{relation.explanation}</span>
            {/if}
          </li>
        {/if}
      {/each}
    </ul>
  </div>
{/if}

<style>
  .related-topics {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  h3 {
    font-size: 1.1rem;
    margin: 0 0 0.5rem;
    color: var(--heading);
  }

  .lead {
    font-size: 0.95rem;
    color: var(--muted);
    margin: 0 0 1rem;
  }

  .relations {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .relation-item {
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
  }

  .relation-item:last-child {
    border-bottom: none;
  }

  .relation-type {
    display: block;
    font-size: 0.8rem;
    color: var(--accent);
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .relation-link {
    font-weight: 600;
    color: var(--link);
    text-decoration: none;
  }

  .relation-link:hover {
    text-decoration: underline;
  }

  .relation-explanation {
    display: block;
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }
</style>
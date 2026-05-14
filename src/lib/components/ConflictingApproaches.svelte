<script lang="ts">
  import type { ConflictingApproach } from '$lib/content/types';

  interface Props {
    approaches: ConflictingApproach[];
    limit?: number;
  }

  let { approaches, limit = 3 }: Props = $props();
  const visible = $derived(approaches.slice(0, limit));
</script>

{#if visible.length > 0}
  <div class="conflicts">
    {#each visible as conflict}
      <details class="conflict-group">
        <summary>
          <span class="conflict-title">{conflict.question}</span>
          <span class="conflict-count">{conflict.approaches.length} enfoques</span>
        </summary>
        <div class="conflict-body">
          <p class="conflict-summary">{conflict.summary}</p>
          <ul class="approach-list">
            {#each conflict.approaches as approach}
              <li>{approach}</li>
            {/each}
          </ul>
          {#if conflict.projectReferences.length > 0}
            <p class="ref-count">
              Detectado en {conflict.projectReferences.length} documento(s)
            </p>
          {/if}
        </div>
      </details>
    {/each}
  </div>
{/if}

<style>
  .conflicts { display: grid; gap: 0.5rem; }
  .conflict-group {
    border: 1px solid #e9d8fd; border-radius: 4px; background: #faf5ff; overflow: hidden;
  }
  summary {
    display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
    padding: 0.6rem 0.75rem; cursor: pointer; user-select: none;
  }
  summary::-webkit-details-marker { color: #9333ea; }
  .conflict-title { font-size: 0.9rem; font-weight: 600; color: #6b21a8; }
  .conflict-count {
    flex: 0 0 auto; padding: 0.1rem 0.4rem; border-radius: 4px;
    background: #ede9fe; color: #6b21a8; font-size: 0.72rem; font-weight: 700;
  }
  .conflict-body { padding: 0 0.75rem 0.75rem; }
  .conflict-summary { margin: 0 0 0.5rem; font-size: 0.88rem; color: var(--text); line-height: 1.4; }
  .approach-list { margin: 0; padding-left: 1.25rem; }
  .approach-list li { margin-bottom: 0.25rem; font-size: 0.86rem; line-height: 1.35; color: #4a4a4a; }
  .ref-count { margin: 0.5rem 0 0; font-size: 0.78rem; color: var(--muted); }
</style>

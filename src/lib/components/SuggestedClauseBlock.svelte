<script lang="ts">
  import type { SuggestedClause } from '$lib/content/types';
  import StatusBadge from './StatusBadge.svelte';

  let { clause }: { clause: SuggestedClause } = $props();
</script>

<section class="clause-block">
  <div class="heading">
    <h2>Borrador orientativo</h2>
    <StatusBadge tone="warning">{clause.status}</StatusBadge>
  </div>
  <blockquote>{clause.text}</blockquote>
  <p>{clause.disclaimer}</p>
</section>

<style>
  .clause-block {
    border: 1px solid #cfbea4;
    border-radius: 1.1rem;
    background: #fbf4e7;
    padding: 1.2rem;
  }

  .heading {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
  }

  blockquote {
    border-left: 4px solid #9f8158;
    font-size: 1.05rem;
    line-height: 1.65;
    margin: 1rem 0;
    padding-left: 1rem;
  }

  p {
    color: #6b4f20;
    font-weight: 700;
    margin: 0;
  }
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    density?: 'compact' | 'normal' | 'spacious';
    children: Snippet;
  }

  let { title, subtitle, density = 'normal', children }: Props = $props();

  const densityClass = $derived({
    compact: 'density-compact',
    normal: 'density-normal',
    spacious: 'density-spacious'
  }[density]);
</script>

<section class="editorial-section {densityClass}">
  {#if title}
    <h2 class="section-title">{title}</h2>
  {/if}
  {#if subtitle}
    <p class="section-subtitle">{subtitle}</p>
  {/if}
  <div class="section-content">
    {@render children()}
  </div>
</section>

<style>
  .editorial-section {
    margin-bottom: 2rem;
  }

  .density-compact {
    margin-bottom: 1rem;
  }

  .density-spacious {
    margin-bottom: 3rem;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--heading);
    margin: 1rem 0 0.5rem;
    letter-spacing: -0.01em;
  }

  .section-subtitle {
    font-size: 0.95rem;
    color: var(--muted);
    margin: 0 0 1rem;
    line-height: 1.5;
  }

  .section-content {
    color: var(--text);
    line-height: 1.65;
  }

  .density-compact .section-content {
    font-size: 0.9rem;
  }

  .density-normal .section-content {
    font-size: 0.95rem;
  }

  .density-spacious .section-content {
    font-size: 1rem;
  }
</style>
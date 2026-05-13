<script lang="ts">
  import SoftCallout from '$lib/components/SoftCallout.svelte';
  import { legalDisclaimer } from '$lib/content/labels';

  let { data }: { data: { topicCount: number; documentCount: number } } = $props();
</script>

<section class="hero editorial-hero">
  <p class="eyebrow">Atlas comparado de gobernanza cooperativa</p>
  <h1>Explora cómo otros proyectos resuelven decisiones de convivencia y gobernanza.</h1>
  <p class="lead">
    Una herramienta para explorar cómo distintas cooperativas y proyectos colectivos han resuelto
    cuestiones de gobernanza, convivencia, aportaciones económicas y uso compartido de espacios.
  </p>
  <div class="actions">
    <a class="button button-primary" href="/temas">Explorar temas</a>
    <a class="button button-secondary" href="/documentos">Ver documentos</a>
  </div>
</section>

<section class="section stats-section">
  <div class="stats-grid">
    <div class="stat-item">
      <span class="stat-number">{data.topicCount}</span>
      <span class="stat-label">temas de consulta</span>
      <p class="stat-desc">Organizados alrededor de decisiones prácticas: qué conviene aclarar, qué riesgos aparecen y dónde suele regularse.</p>
    </div>
    <div class="stat-item">
      <span class="stat-number">{data.documentCount}</span>
      <span class="stat-label">documentos analizados</span>
      <p class="stat-desc">Estatutos, reglamentos, guías y normativa para comparar soluciones reales.</p>
    </div>
    <div class="stat-item">
      <span class="stat-number">→</span>
      <span class="stat-label">Patrones y ejemplos</span>
      <p class="stat-desc">La herramienta detecta tendencias, diferencias entre proyectos y referencias relacionadas.</p>
    </div>
  </div>
</section>

<section class="section">
  <SoftCallout type="warning" title="Aviso jurídico">{legalDisclaimer}</SoftCallout>
</section>

<style>
  .editorial-hero {
    text-align: center;
    max-width: 65ch;
    margin: 0 auto 3rem;
  }

  .stats-section {
    margin: 2rem 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .stat-item {
    padding: 1.5rem;
  }

  .stat-number {
    display: block;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--heading);
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .stat-desc {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.5;
    margin: 0;
  }
</style>
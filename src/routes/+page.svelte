<script lang="ts">
  import WarningBox from '$lib/components/WarningBox.svelte';
  import { legalDisclaimer } from '$lib/content/labels';

  let { data }: { data: { topicCount: number; documentCount: number } } = $props();
</script>

<section class="hero">
  <p class="eyebrow">Atlas comparado de gobernanza cooperativa</p>
  <h1>Una herramienta sobria para decidir qué regular y dónde regularlo.</h1>
  <p class="lead">
    El Buen Vivir Commons ayuda a preparar Estatutos y Reglamento de Régimen Interno desde temas
    prácticos: bajas, aportaciones, uso de espacios, gobernanza, convivencia y riesgos.
  </p>
  <div class="actions">
    <a class="button button-primary" href="/temas">Explorar temas</a>
    <a class="button button-secondary" href="/documentos">Ver documentos</a>
  </div>
</section>

<section class="section grid" aria-label="Estado del contenido">
  <article class="panel">
    <h2>{data.topicCount} temas curados</h2>
    <p>Los temas viven en <code>src/content/topics</code> y son contenido editorial revisable en Git.</p>
  </article>
  <article class="panel">
    <h2>{data.documentCount} documentos registrados</h2>
    <p>La app compila aunque todavía no haya documentos en <code>documents.json</code>.</p>
  </article>
  <article class="panel">
    <h2>Salida automática separada</h2>
    <p><code>src/content/generated</code> queda reservado para resultados regenerables del pipeline.</p>
  </article>
</section>

<section class="section">
  <WarningBox title="Aviso jurídico">{legalDisclaimer}</WarningBox>
</section>

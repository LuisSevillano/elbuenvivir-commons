<script lang="ts">
  import OgCard from '$lib/components/OgCard.svelte';
  let { data } = $props();
</script>

<!-- Lienzo a pantalla completa (position:fixed) para que la tarjeta se
     renderice a su tamaño real de 1200×630, sin que el ancho máximo del layout
     la encoja. El generador captura solo el elemento .og-card. -->
<div class="stage">
  <OgCard {...data.card} />
  <p class="help">
    Vista previa de la imagen para compartir (1200×630). Cambia el destino con
    <code>?type=tema&amp;slug=&lt;slug&gt;</code>, <code>?type=documento&amp;slug=&lt;slug&gt;</code>
    o <code>?type=pagina&amp;slug=temas|borrador</code>. Edita el diseño en
    <code>src/lib/components/OgCard.svelte</code>. Para hornear los PNG: arranca
    <code>pnpm dev</code> y ejecuta <code>pnpm og:gen</code>.
  </p>
</div>

<style>
  .stage {
    position: fixed;
    inset: 0;
    z-index: 100;
    overflow: auto;
    box-sizing: border-box;
    padding: 24px;
    /* Un checkerboard suave para ver los bordes de la tarjeta. */
    background:
      repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 24px 24px;
  }
  .help {
    max-width: 1200px;
    margin: 16px 0 0;
    font-size: 0.9rem;
    color: #444;
    line-height: 1.5;
  }
  .help code {
    font-family: ui-monospace, monospace;
    font-size: 0.85em;
    background: #efe7d8;
    padding: 0.05em 0.35em;
    border-radius: 3px;
  }
</style>

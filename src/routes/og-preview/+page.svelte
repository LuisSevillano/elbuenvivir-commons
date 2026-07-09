<script lang="ts">
  import OgCard from '$lib/components/OgCard.svelte';
  let { data } = $props();
</script>

<!-- El script de generación captura solo el elemento .og-card, así que la
     barra de ayuda de abajo no aparece en la imagen final. -->
<div class="stage">
  <OgCard {...data.card} />
</div>

<p class="help" data-og-ignore>
  Vista previa de la imagen para compartir (1200×630). Cambia el destino con
  <code>?type=tema&amp;slug=&lt;slug&gt;</code> o <code>?type=documento&amp;slug=&lt;slug&gt;</code>.
  Edita el diseño en <code>src/lib/components/OgCard.svelte</code>. Para hornear los
  PNG: arranca <code>pnpm dev</code> y ejecuta <code>pnpm og:gen</code>.
</p>

<style>
  .stage {
    display: flex;
    justify-content: center;
    padding: 24px;
    /* Un checkerboard suave para ver los bordes de la tarjeta. */
    background:
      repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 24px 24px;
  }
  .help {
    max-width: 1200px;
    margin: 8px auto 40px;
    padding: 0 24px;
    font-size: 0.9rem;
    color: var(--muted);
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

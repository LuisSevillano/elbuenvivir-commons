<script lang="ts">
  // Tarjeta para las imágenes que se ven al compartir (Open Graph, 1200x630).
  // ESTE es el archivo que puedes tocar a tu gusto: colores, tamaños, fuente
  // y disposición son CSS normal. Lo que edites aquí se ve en vivo en
  // /og-preview y es EXACTAMENTE lo que se horneará como imagen.
  let {
    eyebrow = 'EL BUEN VIVIR · TEMAS',
    title = 'Un tema de gobernanza',
    supporting = '',
    footer = 'elbuenvivir-commons.netlify.app',
    chip = ''
  }: {
    eyebrow?: string;
    title?: string;
    supporting?: string;
    footer?: string;
    chip?: string;
  } = $props();
</script>

<div class="og-card">
  <div class="top">
    <span class="accent-bar"></span>
    <p class="eyebrow">{eyebrow}</p>
    <h1 class="title">{title}</h1>
    {#if supporting}<p class="supporting">{supporting}</p>{/if}
  </div>
  <div class="foot">
    <span class="url">{footer}</span>
    {#if chip}<span class="chip">{chip}</span>{/if}
  </div>
</div>

<style>
  /* ---- Ajustes rápidos (toca estos valores) ---------------------------- */
  .og-card {
    --card-bg: #f3ecdf;
    --card-ink: #252019;
    --card-muted: #6f6659;
    --card-accent: #765d3b;
    --card-accent-warm: #b8763b;
    --card-serif: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
    --card-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
    --card-pad: 80px;
  }
  /* --------------------------------------------------------------------- */

  .og-card {
    width: 1200px;
    height: 630px;
    box-sizing: border-box;
    padding: var(--card-pad);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--card-bg);
    color: var(--card-ink);
    overflow: hidden;
  }

  .accent-bar {
    display: block;
    width: 64px;
    height: 8px;
    border-radius: 4px;
    background: var(--card-accent-warm);
    margin-bottom: 34px;
  }

  .eyebrow {
    margin: 0 0 20px;
    font-family: var(--card-sans);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 3px;
    color: var(--card-accent);
  }

  .title {
    margin: 0;
    font-family: var(--card-serif);
    font-weight: 600;
    font-size: 76px;
    line-height: 1.04;
    letter-spacing: -0.01em;
    color: var(--card-ink);
    /* Recorta a 3 líneas por si un título es muy largo. */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .supporting {
    margin: 30px 0 0;
    font-family: var(--card-serif);
    font-size: 30px;
    line-height: 1.4;
    color: var(--card-muted);
    max-width: 24ch;
  }

  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .url {
    font-family: var(--card-sans);
    font-size: 25px;
    color: var(--card-muted);
  }

  .chip {
    font-family: var(--card-sans);
    font-size: 23px;
    font-weight: 600;
    color: var(--card-accent);
    background: #ffffff;
    border: 1.5px solid #e4d9c6;
    border-radius: 999px;
    padding: 12px 26px;
    white-space: nowrap;
  }
</style>

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
    chip = '',
    accent = '#b8763b'
  }: {
    eyebrow?: string;
    title?: string;
    supporting?: string;
    footer?: string;
    chip?: string;
    /** Color del código de sección (temas = ámbar, documentos = oliva). */
    accent?: string;
  } = $props();

  // Tamaños del título (px). Se empieza por el mayor y se ENCOGE hasta que todo
  // cabe en la tarjeta: así ningún título largo se corta ni pisa al pie.
  const TITLE_MAX = 76;
  const TITLE_MIN = 30;

  let cardEl = $state<HTMLElement>();
  let titleEl = $state<HTMLElement>();
  let fitted = $state(false);

  function fitTitle() {
    const card = cardEl;
    const el = titleEl;
    if (!card || !el) return;
    const top = card.querySelector('.top') as HTMLElement | null;
    if (!top) return;

    let size = TITLE_MAX;
    el.style.fontSize = `${size}px`;
    // Reduce el cuerpo mientras el contenido (eyebrow + título + subtítulo)
    // desborde el espacio que le deja el pie dentro de .top.
    let guard = 0;
    while (size > TITLE_MIN && top.scrollHeight > top.clientHeight && guard < 60) {
      size -= 2;
      el.style.fontSize = `${size}px`;
      guard += 1;
    }
    fitted = true;
  }

  $effect(() => {
    // Recalcula si cambian los textos (deps explícitas).
    void title;
    void supporting;
    void eyebrow;
    fitted = false;
    fitTitle();
  });
</script>

<div class="og-card" bind:this={cardEl} data-fit={fitted ? 'done' : 'pending'}>
  <div class="top">
    <span class="accent-bar" style="background: {accent}"></span>
    <p class="eyebrow">{eyebrow}</p>
    <h1 class="title" bind:this={titleEl}>{title}</h1>
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

    /* Fondo: la foto de la home (identidad común) bajo un velo crema.
       Más % = menos foto (texto más legible); menos % = más foto. */
    --card-photo: url('/thumbnail-og.jpg');
    --card-veil-top: 88%;
    --card-veil-bottom: 74%;
  }
  /* --------------------------------------------------------------------- */

  .og-card {
    width: 1200px;
    height: 630px;
    flex: none; /* tamaño fijo: nunca se encoge aunque el contenedor sea menor */
    box-sizing: border-box;
    padding: var(--card-pad);
    display: flex;
    flex-direction: column;
    color: var(--card-ink);
    overflow: hidden;
    background-color: var(--card-bg);
    background-image: linear-gradient(
        180deg,
        color-mix(in srgb, var(--card-bg) var(--card-veil-top), transparent),
        color-mix(in srgb, var(--card-bg) var(--card-veil-bottom), transparent)
      ),
      var(--card-photo);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  /* El bloque superior ocupa el espacio que deja el pie; el título se encoge
     por JS (fitTitle) hasta que su contenido cabe aquí. El overflow:hidden es
     la red de seguridad si ni al tamaño mínimo cupiera. */
  .top {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .accent-bar {
    display: block;
    flex: none;
    width: 64px;
    height: 8px;
    border-radius: 4px;
    background: var(--card-accent-warm);
    margin-bottom: 34px;
  }

  .eyebrow {
    flex: none;
    margin: 0 0 20px;
    font-family: var(--card-sans);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 3px;
    color: var(--card-accent);
  }

  .title {
    flex: none;
    margin: 0;
    font-family: var(--card-serif);
    font-weight: 600;
    font-size: 76px; /* valor inicial; fitTitle() lo ajusta */
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: var(--card-ink);
  }

  .supporting {
    flex: none;
    margin: 28px 0 0;
    font-family: var(--card-serif);
    font-size: 29px;
    line-height: 1.35;
    color: var(--card-muted);
    max-width: 34ch;
  }

  .foot {
    flex: none;
    margin-top: 28px;
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

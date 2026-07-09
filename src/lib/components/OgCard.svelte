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

  // El cuerpo del título se adapta a su longitud, para que un título largo
  // (p. ej. un decreto) no se derrame sobre el subtítulo. Ajusta estos tramos
  // a tu gusto: [máx. de caracteres, tamaño en px].
  const TITLE_SIZES: [number, number][] = [
    [24, 76],
    [40, 64],
    [58, 54],
    [80, 46],
    [Infinity, 38]
  ];
  const titleSize = $derived(
    (TITLE_SIZES.find(([max]) => title.length <= max) ?? [0, 38])[1]
  );
</script>

<div class="og-card">
  <div class="top">
    <span class="accent-bar" style="background: {accent}"></span>
    <p class="eyebrow">{eyebrow}</p>
    <h1 class="title" style="font-size: {titleSize}px">{title}</h1>
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

  /* El bloque superior ocupa el espacio que deja el pie y recorta lo que
     sobre, así el título nunca puede invadir el pie. */
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
    flex: 0 1 auto;
    min-height: 0;
    margin: 0;
    font-family: var(--card-serif);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: var(--card-ink);
    /* Segunda red de seguridad: como mucho 4 líneas, con puntos suspensivos. */
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .supporting {
    flex: none;
    margin: 30px 0 0;
    font-family: var(--card-serif);
    font-size: 30px;
    line-height: 1.4;
    color: var(--card-muted);
    max-width: 24ch;
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

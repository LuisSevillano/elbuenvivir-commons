<script lang="ts">
  import { page } from '$app/state';
  import '../styles.css';

  const siteTitle = 'El Buen Vivir Commons | Atlas de gobernanza cooperativa';
  const siteDescription =
    'Atlas comparado para diseñar estatutos, RRI y acuerdos de convivencia en cooperativas de vivienda: temas, patrones, documentos y borradores de trabajo.';
  const socialImage = '/thumbnail-og.jpg';
  const socialImageAlt =
    'Mesa de trabajo con documentos, cuadernos y una ventana abierta al paisaje rural.';

  let { children }: { children: import('svelte').Snippet } = $props();
</script>

<svelte:head>
  <title>{siteTitle}</title>
  <meta name="description" content={siteDescription} />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#f5efe3" />

  <link rel="canonical" href={page.url.pathname} />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="El Buen Vivir Commons" />
  <meta property="og:locale" content="es_ES" />
  <meta property="og:title" content={siteTitle} />
  <meta property="og:description" content={siteDescription} />
  <meta property="og:url" content={page.url.pathname} />
  <meta property="og:image" content={socialImage} />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={socialImageAlt} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={siteTitle} />
  <meta name="twitter:description" content={siteDescription} />
  <meta name="twitter:image" content={socialImage} />
  <meta name="twitter:image:alt" content={socialImageAlt} />
</svelte:head>

<div class="site-shell">
  <header class="site-header">
    <a class="brand" href="/">El Buen Vivir Commons</a>
    <div class="header-tools">
      <form class="global-search" action="/buscar" method="get" role="search">
        <label>
          <span>Buscar</span>
          <input name="q" type="search" placeholder="Buscar..." />
        </label>
      </form>
      <nav aria-label="Navegación principal">
        <a href="/temas">Temas</a>
        <a href="/patrones">Patrones</a>
        <a href="/drafts">Borradores de trabajo</a>
        <a href="/documentos">Documentos</a>
      </nav>
    </div>
  </header>
  <main>{@render children()}</main>
</div>

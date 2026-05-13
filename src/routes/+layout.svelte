<script lang="ts">
  import '../styles.css';

  let { children }: { children: import('svelte').Snippet } = $props();
</script>

<svelte:head>
  <title>El Buen Vivir Commons</title>
  <meta
    name="description"
    content="Atlas comparado para redactar Estatutos y Reglamento de Régimen Interno de El Buen Vivir."
  />
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

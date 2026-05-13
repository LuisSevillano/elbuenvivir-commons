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
    <nav aria-label="Navegación principal">
      <a href="/temas">Temas</a>
      <a href="/documentos">Documentos</a>
    </nav>
  </header>
  <main>{@render children()}</main>
</div>

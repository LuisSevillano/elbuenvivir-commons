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
	let mobileSearchOpen = $state(false);
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
		<div class="header-topline">
			<a class="brand" href="/">El Buen Vivir Commons</a>
			<button
				class="mobile-search-toggle"
				type="button"
				aria-label={mobileSearchOpen ? 'Cerrar buscador' : 'Abrir buscador'}
				aria-expanded={mobileSearchOpen}
				onclick={() => (mobileSearchOpen = !mobileSearchOpen)}
			>
				<span aria-hidden="true">{mobileSearchOpen ? '×' : '⌕'}</span>
			</button>
		</div>
		<div class="header-tools">
			<form class="global-search" action="/buscar" method="get" role="search">
				<label>
					<span>Buscar</span>
					<input name="q" type="search" placeholder="Buscar..." />
				</label>
			</form>
			{#if mobileSearchOpen}
				<div class="mobile-search-panel">
					<form action="/buscar" method="get" role="search">
						<label>
							<span>Buscar</span>
							<input name="q" type="search" placeholder="Buscar..." />
						</label>
					</form>
				</div>
			{/if}
			<nav aria-label="Navegación principal">
				<a href="/temas">Temas</a>
				<a href="/patrones">Patrones</a>
				<a href="/drafts">Borradores de trabajo</a>
				<a href="/documentos">Documentos</a>
			</nav>
		</div>
	</header>
	<main>{@render children()}</main>
	<footer class="site-footer">
		<div>
			<p class="footer-kicker">Atlas comparado</p>
			<p class="footer-title">El Buen Vivir Commons</p>
			<p class="footer-copy">
				Herramienta de apoyo para comparar cómo distintas cooperativas documentan decisiones de
				gobernanza, convivencia y uso compartido.
			</p>
		</div>
		<nav class="footer-links" aria-label="Navegación secundaria">
			<a href="/temas">Temas</a>
			<a href="/patrones">Patrones</a>
			<a href="/drafts">Borradores de trabajo</a>
			<a href="/documentos">Documentos</a>
		</nav>
	</footer>
</div>

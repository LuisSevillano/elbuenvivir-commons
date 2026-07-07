<script lang="ts">
	import { page } from '$app/state';
	import { absoluteUrl, defaultSeo, siteName, type SeoMetadata } from '$lib/seo';
	import '../styles.css';

	let { children }: { children: import('svelte').Snippet } = $props();
	let mobileSearchOpen = $state(false);

	const seo = $derived((page.data.seo as SeoMetadata | undefined) ?? defaultSeo);
	const canonicalUrl = $derived(absoluteUrl(seo.path || page.url.pathname));
	const socialImage = $derived(absoluteUrl(seo.image ?? defaultSeo.image ?? '/thumbnail-og.jpg'));
	const socialImageAlt = $derived(seo.imageAlt ?? defaultSeo.imageAlt ?? '');
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta name="theme-color" content="#f5efe3" />

	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content={seo.type ?? 'website'} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content="es_ES" />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={socialImage} />
	<meta property="og:image:secure_url" content={socialImage} />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="1250" />
	<meta property="og:image:height" content="703" />
	<meta property="og:image:alt" content={socialImageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
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
				<a href="/temas" class:active={page.url.pathname.startsWith('/temas')} aria-current={page.url.pathname.startsWith('/temas') ? 'page' : undefined}>Temas</a>
				<a href="/borrador" class:active={page.url.pathname.startsWith('/borrador')} aria-current={page.url.pathname.startsWith('/borrador') ? 'page' : undefined}>Borrador</a>
				<a href="/documentos" class:active={page.url.pathname.startsWith('/documentos')} aria-current={page.url.pathname.startsWith('/documentos') ? 'page' : undefined}>Documentos</a>
			</nav>
		</div>
	</header>
	<main>{@render children()}</main>
	<footer class="site-footer">
		<div>
			<p class="footer-kicker">El Buen Vivir</p>
			<p class="footer-title">Nuestros Estatutos y Reglamento, entre todas</p>
			<p class="footer-copy">
				Mesa de trabajo para redactar los Estatutos y el Reglamento de Régimen Interno de nuestra
				cooperativa de usuarios, con la ley de Castilla y León, la experiencia de otras cooperativas y
				nuestras propias decisiones. Borradores para revisar juntas, no acuerdos cerrados.
			</p>
		</div>
		<nav class="footer-links" aria-label="Navegación secundaria">
			<a href="/temas">Temas</a>
			<a href="/borrador">Borrador</a>
			<a href="/documentos">Documentos</a>
		</nav>
	</footer>
</div>

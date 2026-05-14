<script lang="ts">
	import IntroEditorial from '$lib/components/IntroEditorial.svelte';
	import AtlasOrientation from '$lib/components/AtlasOrientation.svelte';
</script>

<section class="hero editorial-hero">
	<p class="eyebrow">Herramienta editorial para decisiones cooperativas</p>
	<h1>Preparar acuerdos con documentos reales y criterio prudente.</h1>
	<p class="lead">
		Una selección pequeña de temas y documentos para orientar conversaciones sobre Estatutos, RRI,
		aportaciones, convivencia y uso compartido sin presentar como seguro lo que todavía no está claro.
	</p>
	<div class="actions">
		<a class="button button-primary" href="/temas">Explorar temas</a>
		<a class="button button-secondary" href="/documentos">Ver documentos</a>
	</div>
</section>

<hr class="hero-divider" />

<IntroEditorial />

<AtlasOrientation />

<style>
	.editorial-hero {
		margin: 0 0 0;
	}

	.hero-divider {
		border: none;
		border-top: 1px solid var(--border);
		margin: 2rem auto;
		max-width: 62ch;
	}
</style>

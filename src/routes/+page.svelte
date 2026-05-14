<script lang="ts">
	import SoftCallout from '$lib/components/SoftCallout.svelte';
	import IntroEditorial from '$lib/components/IntroEditorial.svelte';
	import AtlasOrientation from '$lib/components/AtlasOrientation.svelte';
	import { legalDisclaimer } from '$lib/content/labels';

	let { data }: { data: { topicCount: number; priorityTopicCount: number; documentCount: number } } = $props();
</script>

<section class="hero editorial-hero">
	<p class="eyebrow">Atlas comparado de gobernanza cooperativa</p>
	<h1>Explora cómo otros proyectos resuelven decisiones de convivencia y organización.</h1>
	<p class="lead">
		Una herramienta de trabajo editorial para comparar documentos, distinguir niveles de evidencia y
		avanzar con prudencia en decisiones de organización, convivencia y uso compartido.
	</p>
	<div class="actions">
		<a class="button button-primary" href="/temas">Explorar temas</a>
		<a class="button button-secondary" href="/documentos">Ver documentos</a>
	</div>
</section>

<hr class="hero-divider" />

<IntroEditorial />

<AtlasOrientation />

<section class="section stats-section">
	<div class="stats-grid">
		<div class="stat-item">
			<span class="stat-number">{data.priorityTopicCount}</span>
			<span class="stat-label">temas priorizados</span>
			<p class="stat-desc">
				La navegación destaca pocos temas con mayor utilidad editorial antes que una cobertura amplia.
			</p>
		</div>
		<div class="stat-item">
			<span class="stat-number">{data.documentCount}</span>
			<span class="stat-label">documentos analizados</span>
			<p class="stat-desc">
				Estatutos, reglamentos, guías y normativa como trazabilidad y lectura contextual.
			</p>
		</div>
		<div class="stat-item">
			<span class="stat-number">3</span>
			<span class="stat-label">estados editoriales</span>
			<p class="stat-desc">
				Revisado, exploratorio y evidencia insuficiente para que ningún tema parezca más sólido de lo que es.
			</p>
		</div>
	</div>
</section>

<section class="section advice">
	<SoftCallout type="warning" title="Aviso jurídico">{legalDisclaimer}</SoftCallout>
</section>

<style>
	.advice {
		max-width: 62ch;
		margin: 0 auto 3rem;
	}
	.editorial-hero {
		margin: 0 0 0;
	}

	.hero-divider {
		border: none;
		border-top: 1px solid var(--border);
		margin: 2rem auto;
		max-width: 62ch;
	}

	.stats-section {
		margin: 2.5rem 0;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2.5rem;
		text-align: center;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}

	.stat-item {
		padding: 1.75rem 0.5rem;
	}

	.stat-number {
		display: block;
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--heading);
		line-height: 1;
		margin-bottom: 0.35rem;
	}

	.stat-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.85rem;
	}

	.stat-desc {
		font-size: 0.9rem;
		color: var(--muted);
		line-height: 1.5;
		margin: 0;
	}
</style>

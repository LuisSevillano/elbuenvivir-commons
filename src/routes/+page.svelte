<script lang="ts">
	import ProjectStatePanel from '$lib/components/ProjectStatePanel.svelte';
	let { data } = $props();
	const state = $derived(data.state);
</script>

<section class="hero">
	<p class="eyebrow">Cooperativa de usuarios · Castilla y León</p>
	<h1>Nuestras reglas, nuestro Buen Vivir</h1>
	<p class="lead">
		El Buen Vivir es un proyecto rural que soñamos compartir entre amigas. Esta es la mesa de
		trabajo donde, tema a tema, vemos <em>qué exige la ley</em>, <em>cómo lo resolvieron otras
		cooperativas</em> y una <em>propuesta redactada para nosotras</em> — con las fuentes
		siempre a la vista.
	</p>

	<dl class="stats">
		<div><dt>Temas</dt><dd>{state.topicCount}</dd></div>
		<div><dt>Documentos</dt><dd>{state.docCount}</dd></div>
		<div><dt>Cooperativas</dt><dd>{state.cooperativeCount}</dd></div>
		<div><dt>Marco legal</dt><dd class="dd-law">Ley 4/2002</dd></div>
	</dl>

	<div class="actions">
		<a class="button button-primary" href="/temas">Ver los temas</a>
	</div>
</section>

<hr class="rule" />

<ProjectStatePanel {state} />

<hr class="rule" />

<section class="method">
	<h2>Cada tema, de un vistazo</h2>
	<ol class="method-steps">
		<li>
			<span class="ms-icon" aria-hidden="true">⚖️</span>
			<h3>Qué dice la ley</h3>
			<p>El mínimo que la Ley 4/2002 de Castilla y León obliga a cubrir, con el artículo a la vista.</p>
		</li>
		<li>
			<span class="ms-icon" aria-hidden="true">🏘️</span>
			<h3>Cómo lo hacen otras</h3>
			<p>La cláusula literal de 14 cooperativas, comparada, para no partir de cero.</p>
		</li>
		<li>
			<span class="ms-icon" aria-hidden="true">✍️</span>
			<h3>Propuesta para nosotras</h3>
			<p>Un artículo redactado y ajustado a nuestras decisiones, listo para copiar al documento.</p>
		</li>
	</ol>
</section>

<style>
	.hero { margin: 0 0 2.2rem; }
	.hero h1 { max-width: 15ch; }
	.hero em { font-style: normal; color: var(--ink); box-shadow: inset 0 -0.35em 0 rgba(184, 118, 59, 0.16); }

	.stats {
		display: flex; flex-wrap: wrap; gap: 2.2rem;
		margin: 1.8rem 0 0; padding: 1.1rem 0 0;
		border-top: 1px solid var(--border);
	}
	.stats div { display: flex; flex-direction: column; }
	.stats dt { order: 2; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
	.stats dd { order: 1; margin: 0; font-family: var(--font-display); font-size: 2rem; font-weight: 600; line-height: 1; color: var(--ink); }
	.stats .dd-law { font-size: 1.5rem; padding-top: 0.35rem; }

	.rule { border: none; border-top: 1px solid var(--border); margin: 2.4rem 0; }

	.method { margin: 0 0 1rem; }
	.method h2 {
		font-family: var(--font-display); font-weight: 600; letter-spacing: -0.01em;
		font-size: clamp(1.3rem, 3vw, 1.7rem); margin: 0 0 1.3rem;
	}
	.method-steps {
		list-style: none; margin: 0; padding: 0; counter-reset: step;
		display: grid; gap: 1.2rem;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
	}
	.method-steps li { position: relative; padding-left: 0; }
	.ms-icon { font-size: 1.4rem; }
	.method-steps h3 { font-size: 1.05rem; font-weight: 600; margin: 0.4rem 0 0.35rem; }
	.method-steps p { margin: 0; color: var(--muted); font-size: 0.92rem; line-height: 1.5; }

	@media (max-width: 640px) {
		.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem 1.4rem; }
		.stats dd { font-size: 1.7rem; }
		.stats .dd-law { font-size: 1.5rem; padding-top: 0; }
	}
</style>

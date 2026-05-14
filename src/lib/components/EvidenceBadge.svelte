<script lang="ts">
  import type { EvidenceClaimType, Confidence } from '$lib/content/types';

  interface Props {
    type: EvidenceClaimType;
    confidence?: Confidence;
    compact?: boolean;
  }

  let { type, confidence = 'medium', compact = false }: Props = $props();

  const labels: Record<EvidenceClaimType, string> = {
    explicit: 'Evidencia explícita',
    inferred: 'Evidencia inferida',
    recommendation: 'Orientación',
    weak_evidence: 'Evidencia limitada',
    conflicting: 'Enfoques contradictorios'
  };

  const shortLabels: Record<EvidenceClaimType, string> = {
    explicit: 'Explícita',
    inferred: 'Inferida',
    recommendation: 'Orientación',
    weak_evidence: 'Limitada',
    conflicting: 'Contradictoria'
  };

  const confidenceLabels: Record<Confidence, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  };
</script>

<span class="evidence-badge" class:compact class:explicit={type === 'explicit'} class:inferred={type === 'inferred'} class:recommendation={type === 'recommendation'} class:weak={type === 'weak_evidence'} class:conflicting={type === 'conflicting'}>
  {compact ? shortLabels[type] : labels[type]}
  {#if !compact}
    <span class="confidence">· {confidenceLabels[confidence]}</span>
  {/if}
</span>

<style>
  .evidence-badge {
    display: inline-flex; align-items: center; gap: 0.2rem;
    padding: 0.15rem 0.45rem; border-radius: 4px;
    font-size: 0.72rem; font-weight: 700; white-space: nowrap;
  }
  .evidence-badge.compact { padding: 0.1rem 0.35rem; font-size: 0.68rem; }
  .explicit { background: #dcfce7; color: #166534; }
  .inferred { background: #fef9c3; color: #854d0e; }
  .recommendation { background: #dbeafe; color: #1e40af; }
  .weak { background: #fef2f2; color: #991b1b; }
  .conflicting { background: #f3e8ff; color: #6b21a8; }
  .confidence { font-weight: 400; opacity: 0.8; }
</style>

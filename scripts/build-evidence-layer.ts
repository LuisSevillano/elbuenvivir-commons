import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  ConflictingApproach,
  Confidence,
  EvidenceClaim,
  EvidenceClaimType,
  EvidenceExtract,
  EvidenceHealth,
  EvidenceTopicLayer,
  ExtractedSection,
  GeneratedTopicReference,
  SourceDocument,
  TaxonomyTopic
} from '../src/lib/content/types';

const root = process.cwd();
const taxonomyPath = join(root, 'taxonomy/topics.json');
const documentsPath = join(root, 'src/content/documents/documents.json');
const sectionsDir = join(root, 'src/content/generated/sections');
const referencesPath = join(root, 'src/content/generated/topic-references.json');
const evidenceDir = join(root, 'src/content/generated/evidence');
const reportPath = join(root, 'src/content/generated/evidence-report.json');
const qualityReportPath = join(root, 'src/content/generated/evidence-quality-report.json');
const maxSnippetChars = 800;
const minParagraphChars = 40;
const prioritySlugs = new Set([
  'invitados',
  'reservas_estancias_pernoctas',
  'desigualdad_aportaciones',
  'baja_socio',
  'toma_decisiones',
  'uso_espacios_comunes'
]);

interface ClaimBlueprint {
  conceptKey: string;
  statement: string;
  terms: string[];
  contextTerms?: string[];
  negativeTerms?: string[];
  window?: number;
  approachGroup?: string;
}

interface ConflictingBlueprint {
  question: string;
  approachGroups: string[][];
}

interface DegradedClaim {
  claimId: string;
  originalType: EvidenceClaimType;
  newType: EvidenceClaimType;
  reason: string[];
  filteredExtracts: number;
}

interface DiscardedSnippet {
  extractId: string;
  claimId: string;
  reason: string;
}

interface EvidenceQualityTopic {
  topicSlug: string;
  degradedClaims: DegradedClaim[];
  discardedSnippets: DiscardedSnippet[];
  nonSubstantiveFiltered: number;
  evidenceHealth: EvidenceHealth;
}

const claimBlueprints: Record<string, ClaimBlueprint[]> = {
  invitados: [
    { conceptKey: 'guests_allowed', statement: 'Las personas socias pueden invitar a terceros a las instalaciones', terms: ['invitados', 'invitadas', 'visitas'], contextTerms: ['socio', 'socia', 'pernocta', 'estancia', 'espacio'], window: 24, approachGroup: 'acceso' },
    { conceptKey: 'notice', statement: 'La persona socia debe avisar o solicitar autorización para invitar', terms: ['avisar', 'aviso', 'comunicar', 'comunicacion', 'solicitud', 'autorizacion'], contextTerms: ['invitados', 'visitas', 'pernocta', 'estancia'], window: 20, approachGroup: 'aviso' },
    { conceptKey: 'guest_limit', statement: 'Existe un límite de noches o estancias para personas invitadas', terms: ['limite', 'maximo', 'pernocta', 'noches', 'estancia'], contextTerms: ['invitados', 'visitas', 'anual', 'periodo'], negativeTerms: ['economico', 'financiero'], window: 18, approachGroup: 'limite' },
    { conceptKey: 'guest_responsibility', statement: 'La persona socia es responsable de los daños causados por sus invitados', terms: ['responsabilidad', 'responsable', 'danos', 'daños', 'desperfectos'], contextTerms: ['invitados', 'visitas', 'anfitrion'], window: 20, approachGroup: 'responsabilidad' },
    { conceptKey: 'guest_common_spaces', statement: 'Las personas invitadas pueden usar espacios comunes', terms: ['espacios comunes', 'zonas comunes', 'uso comun', 'sala comun'], contextTerms: ['invitados', 'visitas', 'acompanados'], window: 22, approachGroup: 'espacios' },
    { conceptKey: 'guest_alone', statement: 'Personas invitadas pueden estar sin la persona socia presente', terms: ['sola', 'solo', 'sin presencia', 'sin estar presente'], contextTerms: ['invitados', 'visitas', 'terceros', 'espacio'], window: 24, approachGroup: 'presencia' }
  ],
  reservas_estancias_pernoctas: [
    { conceptKey: 'booking_system', statement: 'El uso de espacios requiere calendario, reserva o turno', terms: ['reserva', 'reservas', 'reservar', 'calendario', 'turno', 'turnos'], contextTerms: ['estancia', 'habitacion', 'pernocta', 'espacio', 'uso', 'disponibilidad'], negativeTerms: ['fondo de reserva', 'reserva legal', 'contable', 'capital social'], window: 18, approachGroup: 'sistema_reserva' },
    { conceptKey: 'priority', statement: 'Las personas socias tienen prioridad sobre invitados en espacios', terms: ['prioridad', 'preferencia', 'preferente', 'prelacion'], contextTerms: ['socios', 'socias', 'invitados', 'espacio', 'uso', 'reserva'], window: 22, approachGroup: 'prioridad' },
    { conceptKey: 'saturation_rules', statement: 'Existen reglas específicas para periodos de alta demanda', terms: ['saturacion', 'alta demanda', 'pico', 'festivos', 'finde semana', 'periodo'], contextTerms: ['reserva', 'espacio', 'uso', 'prioridad', 'rotacion'], window: 20, approachGroup: 'saturacion' },
    { conceptKey: 'cancellation', statement: 'Las cancelaciones tienen aviso y consecuencias', terms: ['cancelacion', 'cancelar', 'anulacion', 'no show'], contextTerms: ['reserva', 'estancia', 'aviso', 'plazo'], window: 18, approachGroup: 'cancelacion' }
  ],
  desigualdad_aportaciones: [
    { conceptKey: 'one_member_one_vote', statement: 'Cada persona socia tiene un voto independientemente de su aportación', terms: ['un socio un voto', 'una persona socia un voto', 'igualdad de voto', 'voto igual'], contextTerms: ['socio', 'socia', 'aportacion', 'capital', 'derechos politicos'], window: 24, approachGroup: 'igualdad_politica' },
    { conceptKey: 'voluntary_contributions', statement: 'Se permiten aportaciones voluntarias adicionales a las obligatorias', terms: ['aportacion voluntaria', 'aportaciones voluntarias', 'prestamo', 'prestamos'], contextTerms: ['capital', 'socio', 'socia', 'financiacion'], negativeTerms: ['fondo de reserva'], window: 24, approachGroup: 'instrumentos' },
    { conceptKey: 'unequal_effects', statement: 'Las aportaciones desiguales no alteran derechos de uso ni prioridad', terms: ['desigual', 'diferentes aportaciones', 'distintas aportaciones'], contextTerms: ['derechos', 'voto', 'uso', 'socio', 'socia'], window: 26, approachGroup: 'efectos' },
    { conceptKey: 'economic_rights_separate', statement: 'Los derechos económicos pueden diferenciarse de los derechos políticos', terms: ['reembolso', 'retorno', 'interes', 'deduccion', 'liquidacion'], contextTerms: ['aportacion', 'capital', 'prestamo', 'baja'], window: 26, approachGroup: 'derechos_economicos' },
    { conceptKey: 'contribution_refund', statement: 'Las aportaciones voluntarias tienen condiciones de reembolso distintas', terms: ['reembolso', 'devolucion', 'plazo', 'deduccion'], contextTerms: ['aportacion voluntaria', 'prestamo', 'capital', 'baja'], window: 24, approachGroup: 'reembolso' }
  ],
  baja_socio: [
    { conceptKey: 'voluntary_exit', statement: 'La persona socia puede solicitar baja voluntaria', terms: ['baja voluntaria', 'solicitud de baja', 'perdida de condicion', 'salida voluntaria'], contextTerms: ['socio', 'socia', 'preaviso', 'reembolso'], window: 24, approachGroup: 'proceso_salida' },
    { conceptKey: 'notice_period', statement: 'Existe un plazo de preaviso para la baja', terms: ['preaviso', 'plazo', 'dias', 'antelacion'], contextTerms: ['baja', 'comunicacion', 'salida', 'socio'], window: 20, approachGroup: 'preaviso' },
    { conceptKey: 'reimbursement_terms', statement: 'El reembolso de aportaciones tiene plazos y deducciones definidos', terms: ['reembolso', 'devolucion', 'deduccion', 'deducciones', 'liquidacion'], contextTerms: ['baja', 'aportacion', 'capital', 'plazo', 'socio'], window: 26, approachGroup: 'reembolso' },
    { conceptKey: 'replacement', statement: 'La baja se coordina con la entrada de una nueva persona socia', terms: ['lista de espera', 'sustitucion', 'nueva persona socia', 'nueva socia', 'nuevo socio'], contextTerms: ['baja', 'salida', 'derecho de uso', 'admision'], window: 26, approachGroup: 'sustitucion' },
    { conceptKey: 'exit_transition', statement: 'La salida incluye entrega de llaves, cierre de uso y documentación', terms: ['llaves', 'entrega', 'cierre', 'uso', 'transicion', 'desalojo'], contextTerms: ['baja', 'salida', 'espacio', 'habitacion', 'vivienda'], window: 22, approachGroup: 'transicion' }
  ],
  toma_decisiones: [
    { conceptKey: 'majority_rules', statement: 'Las decisiones se toman por mayoría simple o cualificada', terms: ['mayoria simple', 'mayoria', 'mayoria cualificada', 'votacion', 'quorum'], contextTerms: ['asamblea', 'acuerdo', 'decision', 'socios'], window: 24, approachGroup: 'regla_votacion' },
    { conceptKey: 'consensus', statement: 'Se busca consenso o unanimidad en decisiones relevantes', terms: ['consenso', 'unanimidad', 'acuerdo unanime', 'bloqueo'], contextTerms: ['decision', 'asamblea', 'acuerdo', 'materia sensible'], window: 24, approachGroup: 'consenso' },
    { conceptKey: 'delegation', statement: 'El consejo rector u órgano delegado puede tomar decisiones ordinarias', terms: ['consejo rector', 'organo de administracion', 'delegacion', 'delegado', 'comision'], contextTerms: ['competencia', 'acuerdo', 'asamblea', 'decision', 'facultad'], window: 26, approachGroup: 'delegacion' },
    { conceptKey: 'protected_matters', statement: 'Ciertas materias requieren mayoría reforzada o están reservadas a asamblea', terms: ['materia protegida', 'reservado a asamblea', 'mayoria reforzada', 'mayoria cualificada', 'mayoria estatutaria'], contextTerms: ['decision', 'modificacion', 'estatutos', 'disolucion', 'fusion'], window: 24, approachGroup: 'materias_protegidas' }
  ],
  uso_espacios_comunes: [
    { conceptKey: 'common_space_rules', statement: 'Los espacios comunes tienen reglas de uso definidas', terms: ['espacios comunes', 'zonas comunes', 'uso comun', 'espacio comun'], contextTerms: ['uso', 'reserva', 'normas', 'convivencia', 'limpieza'], window: 22, approachGroup: 'normas_espacios' },
    { conceptKey: 'care_responsibility', statement: 'El cuidado, limpieza y mantenimiento tienen responsables asignados', terms: ['limpieza', 'mantenimiento', 'cuidado', 'cuidados', 'tareas comunes'], contextTerms: ['responsable', 'turno', 'comun', 'espacio', 'uso'], window: 22, approachGroup: 'cuidado' },
    { conceptKey: 'space_booking', statement: 'Algunos espacios requieren reserva previa', terms: ['reserva', 'reservar', 'calendario', 'turno', 'turnos'], contextTerms: ['espacio', 'sala', 'comun', 'uso', 'disponibilidad'], negativeTerms: ['fondo de reserva', 'contable'], window: 18, approachGroup: 'reserva' },
    { conceptKey: 'damage_liability', statement: 'Los daños en espacios comunes tienen un régimen de responsabilidad', terms: ['danos', 'daños', 'desperfectos', 'reparacion'], contextTerms: ['responsabilidad', 'responsable', 'comun', 'espacio', 'socio'], window: 20, approachGroup: 'danos' },
    { conceptKey: 'quiet_enjoyment', statement: 'Se garantiza el derecho al uso pacífico de los espacios comunes', terms: ['uso pacifico', 'disfrute', 'uso comun', 'acceso'], contextTerms: ['todos los socios', 'todas las socias', 'derecho', 'espacio'], window: 22, approachGroup: 'disfrute' }
  ]
};

const conflictingBlueprints: ConflictingBlueprint[] = [
  { question: 'Acceso de personas invitadas', approachGroups: [['acceso', 'aviso'], ['limite'], ['presencia']] },
  { question: 'Sistema de reservas', approachGroups: [['sistema_reserva'], ['prioridad', 'saturacion'], ['cancelacion']] },
  { question: 'Aportaciones económicas', approachGroups: [['igualdad_politica'], ['instrumentos', 'efectos'], ['derechos_economicos', 'reembolso']] },
  { question: 'Proceso de baja', approachGroups: [['proceso_salida', 'preaviso'], ['reembolso'], ['sustitucion', 'transicion']] },
  { question: 'Toma de decisiones', approachGroups: [['regla_votacion'], ['consenso'], ['delegacion'], ['materias_protegidas']] },
  { question: 'Uso de espacios comunes', approachGroups: [['normas_espacios', 'disfrute'], ['cuidado'], ['reserva'], ['danos']] }
];

// --- NON-SUBSTANTIVE SNIPPET DETECTION ---

const nonSubstantivePatterns: RegExp[] = [
  /^gu[íi]a pr[áa]ctica[^a-z]/i,
  /^t[tíi]tulo original[^a-z]/i,
  /^presentaci[óo]n de la gu[íi]a/i,
  /^[íi]ndice$/im,
  /^contenido$/im,
];

const nonSubstantiveExact: string[] = [
  'hispacoop no se hace responsable',
  'no constituye una recomendacion',
  'reproducion total o parcial',
  'sin el permiso por escrito',
  'todos los derechos reservados',
  'informacion publicada en este documento es exclusivamente a titulo informativo',
];

const nonSubstantiveSoloPatterns: RegExp[] = [
  /^(gu[íi]a pr[áa]ctica|t[tíi]tulo original|presentaci[óo]n)/i,
];

const reservaEconomicTerms: string[] = [
  'fondo de reserva', 'reserva legal', 'reserva obligatoria',
  'reserva voluntaria', 'reservas sociales', 'reserva de educacion',
  'reserva de promocion', 'capital social', 'cuenta contable',
  'plan general contable', 'inmovilizado', 'patrimonio neto',
  'balance', 'ejercicio economico', 'fondo de reserva obligatorio',
];

const reservaUsageTerms: string[] = [
  'estancia', 'pernocta', 'invitado', 'calendario',
  'turno', 'habitacion', 'espacio comun', 'disponibilidad',
  'cancelacion', 'anulacion', 'no show',
];

const guestTerms: string[] = [
  'invitado', 'invitada', 'visita', 'persona invitada',
  'familiar', 'pernocta', 'acompanante', 'anfitrion', 'anfitriona',
  'tercero no socio', 'terceros',
];

const desigualdadFilterTerms: string[] = [
  'plan general contable', 'normas contables', 'pgce',
  'inmovilizado', 'patrimonio neto', 'cuenta contable',
  'amortizacion', 'balance de situacion',
];

// --- HELPERS ---

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function cleanText(value: string): string {
  return normalize(value).replace(/[^a-z0-9ñç\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function words(value: string): string[] {
  return cleanText(value).split(' ').filter(Boolean);
}

function phrasePositions(tokens: string[], phrase: string): number[] {
  const phraseTokens = words(phrase);
  const positions: number[] = [];
  if (phraseTokens.length === 0) return positions;
  for (let i = 0; i <= tokens.length - phraseTokens.length; i++) {
    if (phraseTokens.every((t, o) => tokens[i + o] === t)) {
      positions.push(i);
    }
  }
  return positions;
}

function hasNearContext(tokens: string[], positions: number[], contextTerms: string[], window: number): boolean {
  if (contextTerms.length === 0) return true;
  const contextPositions = contextTerms.flatMap((term) => phrasePositions(tokens, term));
  return positions.some((p) => contextPositions.some((cp) => Math.abs(p - cp) <= window));
}

// --- QUALITY GATE FUNCTIONS ---

function isNonSubstantiveSnippet(text: string, heading: string): boolean {
  const combined = `${heading} ${text}`;
  const clean = combined.replace(/\s+/g, ' ').trim();

  if (clean.length < 120) return true;

  const firstChars = clean.slice(0, 300);
  for (const pattern of nonSubstantivePatterns) {
    if (pattern.test(firstChars)) return true;
  }

  const normalizedStart = normalize(firstChars);
  for (const phrase of nonSubstantiveExact) {
    if (normalizedStart.includes(phrase)) return true;
  }

  if (/^\s*\d+\s*$/.test(clean)) return true;

  return false;
}

function isReservaEconomicContext(text: string, heading: string): boolean {
  const combined = normalize(`${heading} ${text}`);
  const hasEconomic = reservaEconomicTerms.some((t) => combined.includes(t));
  const hasUsage = reservaUsageTerms.some((t) => combined.includes(t));
  return hasEconomic && !hasUsage;
}

function hasGuestTermsInSnippet(text: string, heading: string): boolean {
  const combined = normalize(`${heading} ${text}`);
  return guestTerms.some((t) => combined.includes(t));
}

function isDesigualdadNonPreferred(text: string, heading: string, documentType: string): boolean {
  if (documentType === 'ley' || documentType === 'otro') {
    const combined = normalize(`${heading} ${text}`);
    const isGeneralAccounting = desigualdadFilterTerms.some((t) => combined.includes(t));
    if (isGeneralAccounting) return true;
  }
  return false;
}

function validateExplicitClaim(
  blueprint: ClaimBlueprint,
  matchedSections: { section: ExtractedSection; nonSubstantive: boolean }[]
): { valid: boolean; reasons: string[]; filteredCount: number } {
  const reasons: string[] = [];
  const substantiveSections = matchedSections.filter((m) => !m.nonSubstantive);

  if (substantiveSections.length < 2) {
    reasons.push(`Solo ${substantiveSections.length} extracto(s) sustantivo(s) (se requieren al menos 2)`);
    return { valid: false, reasons, filteredCount: matchedSections.length - substantiveSections.length };
  }

  const hasTermInSubstantive = substantiveSections.some((m) => {
    const text = `${m.section.heading} ${m.section.text}`;
    return blueprint.terms.some((t) => normalize(text).includes(normalize(t)));
  });

  if (!hasTermInSubstantive) {
    reasons.push('Ningún extracto sustantivo contiene los términos centrales de la afirmación');
    return { valid: false, reasons, filteredCount: matchedSections.length - substantiveSections.length };
  }

  const reservaTermsPresent = blueprint.terms.some((t) => normalize(t).includes('reserva'));
  if (reservaTermsPresent) {
    const sectionsWithReserva = substantiveSections.filter((m) => {
      const text = `${m.section.heading} ${m.section.text}`;
      return normalize(text).includes('reserva');
    });
    if (sectionsWithReserva.length > 0) {
      const hasRealReserva = sectionsWithReserva.some((m) => {
        const text = `${m.section.heading} ${m.section.text}`;
        return !isReservaEconomicContext(text, m.section.heading);
      });
      if (!hasRealReserva) {
        reasons.push('"reserva" en los extractos aparece solo en contexto económico (fondo de reserva, reserva legal, etc.)');
        return { valid: false, reasons, filteredCount: matchedSections.length - substantiveSections.length };
      }
    }
  }

  if (blueprint.conceptKey && blueprint.conceptKey.includes('guest')) {
    const hasGuestText = substantiveSections.some((m) => {
      const text = `${m.section.heading} ${m.section.text}`;
      return hasGuestTermsInSnippet(text, m.section.heading);
    });
    if (!hasGuestText) {
      reasons.push('Ningún extracto sustantivo contiene términos de invitados');
      return { valid: false, reasons, filteredCount: matchedSections.length - substantiveSections.length };
    }
  }

  return { valid: true, reasons: [], filteredCount: matchedSections.length - substantiveSections.length };
}

function calculateEvidenceHealth(layer: EvidenceTopicLayer): EvidenceHealth {
  const total = layer.evidenceSummary.totalClaims || 1;
  const explicitRatio = layer.evidenceSummary.explicitCount / total;
  const weakRatio = layer.evidenceSummary.weakEvidenceCount / total;
  const highConfRatio = layer.evidenceSummary.highConfidenceCount / total;
  const nonSubstantive = layer.nonSubstantiveFiltered || 0;
  const totalExtracts = layer.extracts.length;
  const nonSubstantiveRatio = totalExtracts > 0 ? nonSubstantive / totalExtracts : 0;

  if (explicitRatio >= 0.6 && highConfRatio >= 0.4 && nonSubstantiveRatio < 0.3) return 'strong';
  if (explicitRatio >= 0.3 && highConfRatio >= 0.2 && nonSubstantiveRatio < 0.5) return 'moderate';
  if (weakRatio < 0.8 && nonSubstantiveRatio < 0.7) return 'weak';
  return 'insufficient';
}

// --- EXISTING HELPERS ---

function conceptHitCount(
  section: ExtractedSection,
  blueprint: ClaimBlueprint
): { score: number; explicitHits: number; headingHit: boolean; contextualHits: number; contaminated: boolean; nonSubstantive: boolean } {
  const text = `${section.heading} ${section.text}`;
  const nonSubstantive = isNonSubstantiveSnippet(text, section.heading);
  const tokens = words(text);
  const negativeTerms = blueprint.negativeTerms ?? [];
  const contextTerms = blueprint.contextTerms ?? [];
  const w = blueprint.window ?? 24;
  const negativeHits = negativeTerms.reduce((t, term) => t + phrasePositions(tokens, term).length, 0);
  const contaminated = negativeHits > 0;
  let explicitScore = 0;
  let contextualScore = 0;
  let headingHit = false;

  for (const term of blueprint.terms) {
    const positions = phrasePositions(tokens, term);
    if (positions.length === 0) continue;
    if (!hasNearContext(tokens, positions, contextTerms, w)) {
      contextualScore += positions.length;
      continue;
    }
    explicitScore += positions.length * (term.includes(' ') ? 5 : 2);
  }

  if (nonSubstantive) {
    explicitScore = 0;
  }

  if (negativeHits > 0 && negativeHits * 6 >= explicitScore) {
    return { score: 0, explicitHits: 0, headingHit: false, contextualHits: 0, contaminated: true, nonSubstantive };
  }

  headingHit = blueprint.terms.some((term) => cleanText(section.heading).includes(cleanText(term)));
  const headingBoost = headingHit ? 6 : 0;
  const densityBoost = contextTerms.some((term) => text.includes(cleanText(term))) ? 3 : 0;
  const score = explicitScore + contextualScore * 1 + headingBoost + densityBoost - negativeHits * 4;

  return { score, explicitHits: explicitScore, headingHit, contextualHits: contextualScore, contaminated, nonSubstantive };
}

function trimSnippet(text: string, terms: string[], maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const normalized = normalize(clean);
  const firstMatch = terms
    .flatMap((t) => words(t))
    .map((t) => normalized.indexOf(t))
    .filter((i) => i >= 0)
    .toSorted((a, b) => a - b)[0];
  const start = firstMatch === undefined ? 0 : Math.max(0, firstMatch - 100);
  const end = Math.min(start + maxChars, clean.length);
  const snippet = clean.slice(start, end).trim();
  const prefix = start > 0 ? '...' : '';
  const suffix = end < clean.length ? '...' : '';

  const paragraphs = (prefix + snippet + suffix).split('\n').filter((p) => p.trim().length > minParagraphChars);
  return paragraphs.slice(0, 4).join('\n\n') || prefix + snippet + suffix;
}

function buildExplanation(
  evidenceType: EvidenceClaimType,
  matchedCount: number,
  uniqueProjectsCount: number,
  contaminatedCount: number,
  nonSubstantiveCount: number,
  totalBlueprintSections: number
): string {
  if (evidenceType === 'explicit') {
    return `Se ha detectado explícitamente en ${uniqueProjectsCount} proyecto(s) con ${matchedCount} referencia(s) directa(s).`;
  }

  if (evidenceType === 'inferred') {
    return `Parece inferirse en ${uniqueProjectsCount} proyecto(s), aunque sin mención explícita y directa.`;
  }

  if (evidenceType === 'weak_evidence') {
    const substantiveCount = totalBlueprintSections - nonSubstantiveCount;

    if (matchedCount >= 5 && contaminatedCount > 0) {
      return `Hay ${matchedCount} referencia(s) en ${uniqueProjectsCount} proyecto(s), pero están contaminadas por contexto no deseado.`;
    }

    if (matchedCount >= 5) {
      return `Hay ${matchedCount} referencia(s) en ${uniqueProjectsCount} proyecto(s), pero no contienen los términos centrales de la afirmación.`;
    }

    if (nonSubstantiveCount > 0 && substantiveCount === 0) {
      return `Las ${matchedCount} referencia(s) encontradas corresponden a contenido no sustantivo (portadas, índices, créditos) y no pueden sostener la afirmación.`;
    }

    return `Solo ${matchedCount} referencia(s) en ${uniqueProjectsCount} proyecto(s), y ninguna contiene evidencia suficiente.`;
  }

  return undefined;
}

function approachGroupClaims(approachGroup: string | undefined, claims: EvidenceClaim[]): EvidenceClaim[] {
  return claims.filter((c) => {
    const pid = c.id.split('-')[0];
    const blueprint = Object.values(claimBlueprints).flat().find((b) => b.conceptKey === pid);
    return blueprint?.approachGroup === approachGroup;
  });
}

function detectConflictingApproaches(topicSlug: string, claims: EvidenceClaim[]): ConflictingApproach[] {
  const topicConflicts = conflictingBlueprints;
  if (topicSlug === 'invitados') {
    return topicConflicts.slice(0, 1).map((conflict) => {
      const groupClaims = conflict.approachGroups.flatMap((group) =>
        claims.filter((c) => approachGroupClaims(group[0], [c]).length > 0)
      );
      const projectRefs = [...new Set(groupClaims.flatMap((c) => c.supportingReferences))];
      if (projectRefs.length < 2) return null;
      return {
        id: `${topicSlug}-${normalize(conflict.question).replace(/\s+/g, '_').slice(0, 30)}`,
        question: conflict.question,
        approaches: conflict.approachGroups.map((g) => g.join(' / ')),
        summary: `Se han detectado enfoques distintos entre proyectos respecto a ${conflict.question.toLowerCase()}. Algunos establecen reglas abiertas, otros límites estrictos.`,
        projectReferences: projectRefs.slice(0, 6)
      };
    }).filter(Boolean) as ConflictingApproach[];
  }

  return [];
}

function readSections(): ExtractedSection[] {
  if (!existsSync(sectionsDir)) return [];
  return readdirSync(sectionsDir)
    .filter((f) => f.endsWith('.sections.json'))
    .toSorted()
    .flatMap((f) => readJson<ExtractedSection[]>(join(sectionsDir, f)));
}

function buildEvidenceLayer(
  topic: TaxonomyTopic,
  references: GeneratedTopicReference[],
  sections: ExtractedSection[],
  documentsBySlug: Map<string, SourceDocument>
): { layer: EvidenceTopicLayer; quality: EvidenceQualityTopic } {
  const blueprints = claimBlueprints[topic.slug];
  if (!blueprints || references.length === 0) {
    return {
      layer: {
        topicSlug: topic.slug,
        generatedAt: new Date().toISOString(),
        claims: [],
        conflictingApproaches: [],
        evidenceSummary: {
          totalClaims: 0, explicitCount: 0, inferredCount: 0, recommendationCount: 0,
          weakEvidenceCount: 0, conflictingCount: 0, highConfidenceCount: 0,
          mediumConfidenceCount: 0, lowConfidenceCount: 0
        },
        extracts: [],
        nonSubstantiveFiltered: 0,
        evidenceHealth: 'insufficient'
      },
      quality: {
        topicSlug: topic.slug,
        degradedClaims: [],
        discardedSnippets: [],
        nonSubstantiveFiltered: 0,
        evidenceHealth: 'insufficient'
      }
    };
  }

  const claims: EvidenceClaim[] = [];
  const extracts: EvidenceExtract[] = [];
  const degradedClaims: DegradedClaim[] = [];
  const discardedSnippets: DiscardedSnippet[] = [];
  let totalNonSubstantive = 0;

  const sectionsWithText = references
    .map((ref) => ({
      ref,
      section: sections.find((s) => s.documentSlug === ref.documentSlug && s.heading === ref.articleOrSection),
      document: documentsBySlug.get(ref.documentSlug)
    }))
    .filter((item) => item.section && item.document);

  for (const blueprint of blueprints) {
    const sectionCandidates = sectionsWithText.filter((item) => {
      const result = conceptHitCount(item.section!, blueprint);
      return result.score > 0;
    });

    if (sectionCandidates.length === 0) {
      claims.push({
        id: `${topic.slug}-${blueprint.conceptKey}`,
        statement: blueprint.statement,
        evidenceType: 'weak_evidence',
        confidence: 'low',
        supportingReferences: [],
        explanation: `No se ha encontrado evidencia documental que respalde: "${blueprint.statement}". Puede estar resolviéndose informalmente o no estar documentado en las fuentes analizadas.`
      });
      continue;
    }

    const matchedData = sectionCandidates.map((item) => {
      const result = conceptHitCount(item.section!, blueprint);
      return { ...item, result };
    });

    const totalHits = matchedData.reduce((t, item) => t + item.result.score, 0);
    const explicitTotal = matchedData.reduce((t, item) => t + item.result.explicitHits, 0);
    const headingTotal = matchedData.filter((item) => item.result.headingHit).length;
    const contaminatedTotal = matchedData.filter((item) => item.result.contaminated).length;
    const nonSubstantiveCandidates = matchedData.filter((item) => item.result.nonSubstantive).length;
    const nonSubstantiveMatchData = matchedData.filter((item) => item.result.nonSubstantive);
    const uniqueProjects = new Set(matchedData.map((item) => item.document!.projectName || item.document!.title));
    const projectRefs = [...new Set(matchedData.map((item) => item.ref.documentSlug))];

    const hasReservaTerms = blueprint.terms.some((t) => normalize(t).includes('reserva'));
    const reservaEconomicOnly = hasReservaTerms && matchedData.every((item) => {
      const text = `${item.section!.heading} ${item.section!.text}`;
      return isReservaEconomicContext(text, item.section!.heading);
    });
    const hasGuestBlueprint = blueprint.conceptKey && (
      blueprint.conceptKey.includes('guest') || blueprint.conceptKey.includes('notice')
    );
    const noGuestTerms = hasGuestBlueprint && matchedData.every((item) => {
      const text = `${item.section!.heading} ${item.section!.text}`;
      return !hasGuestTermsInSnippet(text, item.section!.heading);
    });

    const evTypeInput = reservaEconomicOnly ? 0 : explicitTotal;
    const contaminatedEffective = contaminatedTotal > 0 || reservaEconomicOnly;
    let evType: EvidenceClaimType;
    if (evTypeInput >= 3 && uniqueProjects.size >= 2 && !contaminatedEffective) {
      evType = 'explicit';
    } else if (evTypeInput >= 1 && uniqueProjects.size >= 1 && !contaminatedEffective) {
      evType = 'explicit';
    } else if (matchedData.length >= 2 && !contaminatedEffective) {
      evType = 'inferred';
    } else {
      evType = 'weak_evidence';
    }

    const explicitValidation = validateExplicitClaim(blueprint, matchedData.map((m) => ({
      section: m.section!,
      nonSubstantive: m.result.nonSubstantive
    })));

    const originalType = evType;
    if (evType === 'explicit' && !explicitValidation.valid) {
      evType = matchedData.length >= 2 ? 'inferred' : 'weak_evidence';
      degradedClaims.push({
        claimId: `${topic.slug}-${blueprint.conceptKey}`,
        originalType,
        newType: evType,
        reason: explicitValidation.reasons,
        filteredExtracts: explicitValidation.filteredCount
      });
    }

    if (noGuestTerms && (evType === 'explicit' || evType === 'inferred')) {
      const origForGuest = evType;
      evType = 'weak_evidence';
      if (origForGuest !== evType) {
        degradedClaims.push({
          claimId: `${topic.slug}-${blueprint.conceptKey}`,
          originalType: origForGuest,
          newType: evType,
          reason: ['Ningún extracto contiene términos de invitados (invitado, visita, familiar, etc.)'],
          filteredExtracts: 0
        });
      }
    }

    const conf: Confidence = (() => {
      if (evType === 'explicit' && uniqueProjects.size >= 2 && matchedData.length >= 3) return 'high';
      if (evType === 'explicit' || (evType === 'inferred' && uniqueProjects.size >= 2 && matchedData.length >= 3)) return 'medium';
      return 'low';
    })();

    const supportingRefs = matchedData.slice(0, 8).map((item) => item.ref.documentSlug);
    const claimId = `${topic.slug}-${blueprint.conceptKey}`;

    const explanation = buildExplanation(evType, matchedData.length, uniqueProjects.size, contaminatedTotal, nonSubstantiveCandidates, sectionCandidates.length);

    const claim: EvidenceClaim = {
      id: claimId,
      statement: blueprint.statement,
      evidenceType: evType,
      confidence: conf,
      supportingReferences: supportingRefs,
      explanation
    };

    claims.push(claim);

    for (const item of matchedData.slice(0, 3)) {
      const hitResult = item.result;
      const text = `${item.section!.heading} ${item.section!.text}`;
      const nonSubstantive = hitResult.nonSubstantive;

  const blueprintHasReservaTerm = blueprint.terms.some((t) => normalize(t).includes('reserva'));

  const discardReasons: string[] = [];
  if (nonSubstantive) discardReasons.push('contenido no sustantivo');
  if (blueprintHasReservaTerm && isReservaEconomicContext(text, item.section!.heading)) discardReasons.push('reserva en contexto económico');
  if (hasGuestBlueprint && !hasGuestTermsInSnippet(text, item.section!.heading)) {
    discardReasons.push('sin términos de invitados');
  }
  if (topic.slug === 'desigualdad_aportaciones' && isDesigualdadNonPreferred(text, item.section!.heading, item.ref.documentType)) {
    discardReasons.push('normativa contable general, no específica cooperativa');
  }

  if (discardReasons.length > 0) {
    totalNonSubstantive++;
        discardedSnippets.push({
          extractId: `${claimId}-${item.ref.documentSlug}-${item.section!.order}`,
          claimId,
          reason: discardReasons.join('; ')
        });
      }

      extracts.push({
        id: `${claimId}-${item.ref.documentSlug}-${item.section!.order}`,
        claimId,
        documentSlug: item.ref.documentSlug,
        documentTitle: item.ref.documentTitle,
        documentType: item.ref.documentType,
        projectName: item.ref.projectName,
        sourcePath: item.document!.sourcePath,
        articleOrSection: item.section!.heading,
        snippet: trimSnippet(item.section!.text, blueprint.terms, maxSnippetChars),
        score: hitResult.score,
        relevanceFactors: {
          explicit: hitResult.explicitHits > 0,
          headingRelevant: hitResult.headingHit,
          contextualCooccurrence: hitResult.contextualHits > 0,
          topicDensity: hitResult.score > 15,
          conceptProximity: hitResult.score > 10
        },
        contaminationFlags: hitResult.contaminated ? ['términos negativos detectados'] : undefined
      });
    }
  }

  const conflictingApproaches = detectConflictingApproaches(topic.slug, claims);

  const evidenceSummary = {
    totalClaims: claims.length,
    explicitCount: claims.filter((c) => c.evidenceType === 'explicit').length,
    inferredCount: claims.filter((c) => c.evidenceType === 'inferred').length,
    recommendationCount: claims.filter((c) => c.evidenceType === 'recommendation').length,
    weakEvidenceCount: claims.filter((c) => c.evidenceType === 'weak_evidence').length,
    conflictingCount: conflictingApproaches.length,
    highConfidenceCount: claims.filter((c) => c.confidence === 'high').length,
    mediumConfidenceCount: claims.filter((c) => c.confidence === 'medium').length,
    lowConfidenceCount: claims.filter((c) => c.confidence === 'low').length
  };

  const layer: EvidenceTopicLayer = {
    topicSlug: topic.slug,
    generatedAt: new Date().toISOString(),
    claims,
    conflictingApproaches,
    evidenceSummary,
    extracts,
    nonSubstantiveFiltered: totalNonSubstantive,
    evidenceHealth: calculateEvidenceHealth({
      ...{ topicSlug: topic.slug, generatedAt: '', conflictingApproaches: [], extracts, evidenceSummary, claims, nonSubstantiveFiltered: totalNonSubstantive },
      evidenceHealth: 'weak'
    })
  };

  layer.evidenceHealth = calculateEvidenceHealth(layer);

  return {
    layer,
    quality: {
      topicSlug: topic.slug,
      degradedClaims,
      discardedSnippets,
      nonSubstantiveFiltered: totalNonSubstantive,
      evidenceHealth: layer.evidenceHealth
    }
  };
}

// --- MAIN ---

const taxonomy = readJson<TaxonomyTopic[]>(taxonomyPath).filter((t) => t.status !== 'merged');
const documents = readJson<SourceDocument[]>(documentsPath);
const allReferences = (readJson<{ references: GeneratedTopicReference[] }>(referencesPath)).references ?? [];
const sections = readSections();
const documentsBySlug = new Map(documents.map((d) => [d.slug, d]));
const topicsBySlug = new Map(taxonomy.map((t) => [t.slug, t]));
const layers: EvidenceTopicLayer[] = [];
const qualityTopics: EvidenceQualityTopic[] = [];

if (!existsSync(evidenceDir)) {
  mkdirSync(evidenceDir, { recursive: true });
}

for (const slug of prioritySlugs) {
  const topic = topicsBySlug.get(slug);
  if (!topic) {
    console.warn(`  [SKIP] Topic "${slug}" not found in taxonomy.`);
    continue;
  }

  const references = allReferences.filter((ref) => ref.topicSlug === slug);
  console.log(`  [BUILD] ${topic.title} (${slug}): ${references.length} references`);

  const { layer, quality } = buildEvidenceLayer(topic, references, sections, documentsBySlug);
  layers.push(layer);
  qualityTopics.push(quality);
  writeFileSync(join(evidenceDir, `${slug}.json`), `${JSON.stringify(layer, null, 2)}\n`);
  console.log(`    --> ${layer.claims.length} claims, ${layer.extracts.length} extracts, ${layer.nonSubstantiveFiltered} non-substantive filtered, health=${layer.evidenceHealth}`);

  for (const degraded of quality.degradedClaims) {
    console.log(`    [DEGRADED] ${degraded.claimId}: ${degraded.originalType} -> ${degraded.newType}`);
  }
}

// --- QUALITY REPORT (evidence-report.json - existing format) ---

const qualityTopicsSummary = layers.map((l) => {
  const total = l.evidenceSummary.totalClaims || 1;
  const explicitRatio = l.evidenceSummary.explicitCount / total;
  const weakRatio = l.evidenceSummary.weakEvidenceCount / total;
  const inferredRatio = l.evidenceSummary.inferredCount / total;
  const hasConflicts = l.conflictingApproaches.length > 0;
  const nonSubstantiveRatio = l.extracts.length > 0 ? (l.nonSubstantiveFiltered / l.extracts.length) : 0;

  const groundingScore = Math.round(
    (explicitRatio * 40) +
    (l.evidenceSummary.highConfidenceCount / total * 15) +
    (l.evidenceSummary.mediumConfidenceCount / total * 10) +
    (hasConflicts ? 10 : -5) -
    (weakRatio * 30) -
    (inferredRatio * 10) -
    (nonSubstantiveRatio * 20)
  );

  return {
    topicSlug: l.topicSlug,
    groundingScore: Math.max(0, Math.min(100, groundingScore)),
    totalClaims: l.evidenceSummary.totalClaims,
    explicitCount: l.evidenceSummary.explicitCount,
    inferredCount: l.evidenceSummary.inferredCount,
    weakEvidenceCount: l.evidenceSummary.weakEvidenceCount,
    conflictingCount: l.evidenceSummary.conflictingCount,
    highConfidenceCount: l.evidenceSummary.highConfidenceCount,
    mediumConfidenceCount: l.evidenceSummary.mediumConfidenceCount,
    lowConfidenceCount: l.evidenceSummary.lowConfidenceCount,
    extracts: l.extracts.length,
    nonSubstantiveFiltered: l.nonSubstantiveFiltered,
    evidenceHealth: l.evidenceHealth,
    flags: [
      ...(weakRatio > 0.5 ? ['ALTA_PROPORCION_EVIDENCIA_DEBIL'] : []),
      ...(l.evidenceSummary.highConfidenceCount === 0 ? ['SIN_EVIDENCIA_ALTA'] : []),
      ...(hasConflicts ? [] : ['SIN_CONFLICTOS_DETECTADOS']),
      ...(explicitRatio < 0.3 && total > 2 ? ['BAJA_PROPORCION_EVIDENCIA_EXPLICITA'] : []),
      ...(nonSubstantiveRatio > 0.4 ? ['ALTA_PROPORCION_SNIPPETS_NO_SUSTANTIVOS'] : [])
    ]
  };
});

writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  qualitySummary: {
    averageGroundingScore: Math.round(qualityTopicsSummary.reduce((t, q) => t + q.groundingScore, 0) / (qualityTopicsSummary.length || 1)),
    topicsWithHighConfidence: qualityTopicsSummary.filter((q) => q.highConfidenceCount > 0).length,
    topicsWithConflicts: qualityTopicsSummary.filter((q) => q.conflictingCount > 0).length,
    topicsWithWeakDominance: qualityTopicsSummary.filter((q) => q.flags.includes('ALTA_PROPORCION_EVIDENCIA_DEBIL')).length
  },
  topics: qualityTopicsSummary
}, null, 2)}\n`);

// --- EVIDENCE QUALITY REPORT (evidence-quality-report.json - new) ---

const totalDegraded = qualityTopics.reduce((t, q) => t + q.degradedClaims.length, 0);
const totalDiscarded = qualityTopics.reduce((t, q) => t + q.discardedSnippets.length, 0);
const insufficientTopics = qualityTopics.filter((q) => q.evidenceHealth === 'insufficient').map((q) => q.topicSlug);
const weakTopics = qualityTopics.filter((q) => q.evidenceHealth === 'weak').map((q) => q.topicSlug);

writeFileSync(qualityReportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  summary: {
    totalTopics: qualityTopics.length,
    totalDegradedClaims: totalDegraded,
    totalDiscardedSnippets: totalDiscarded,
    strongTopics: qualityTopics.filter((q) => q.evidenceHealth === 'strong').length,
    moderateTopics: qualityTopics.filter((q) => q.evidenceHealth === 'moderate').length,
    weakTopics: weakTopics.length,
    insufficientTopics: insufficientTopics.length
  },
  topics: qualityTopics
}, null, 2)}\n`);

console.log(`\nGenerated ${layers.length} evidence layer file(s).`);
console.log('Wrote src/content/generated/evidence/*.json.');
console.log('Wrote src/content/generated/evidence-report.json.');
console.log('Wrote src/content/generated/evidence-quality-report.json.');
console.log(`\nQuality gate results:`);
console.log(`  Claims degraded: ${totalDegraded}`);
console.log(`  Snippets discarded: ${totalDiscarded}`);
if (insufficientTopics.length > 0) console.log(`  Insufficient evidence topics: ${insufficientTopics.join(', ')}`);
if (weakTopics.length > 0) console.log(`  Weak evidence topics: ${weakTopics.join(', ')}`);

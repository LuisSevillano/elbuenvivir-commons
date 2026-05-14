import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { EvidenceHealth, EvidenceTopicLayer, GeneratedTopicReference, GeneratedTopicSynthesis } from '../src/lib/content/types';

interface TopicReferencesFile {
  references: GeneratedTopicReference[];
}

interface CriterionScore {
  score: number;
  max: number;
  notes: string[];
}

interface GenericPhraseFinding {
  phrase: string;
  count: number;
}

interface SynthesisQualityItem {
  slug: string;
  score: number;
  grade: 'strong' | 'usable' | 'weak' | 'critical';
  referencesCount: number;
  documentDiversity: {
    documents: number;
    documentTypes: string[];
  };
  usefulLength: {
    words: number;
    nonGenericWords: number;
  };
  genericPhrases: {
    findings: GenericPhraseFinding[];
    totalOccurrences: number;
    dominatesContent: boolean;
  };
  substantiveConcepts: string[];
  answersHowOthersManageIt: boolean;
  hasUsefulBuenVivirRecommendations: boolean;
  differentiatesStatutesAndRRI: boolean;
  hasConcreteRisks: boolean;
  evidenceHealth: string | null;
  criteria: {
    references: CriterionScore;
    documentDiversity: CriterionScore;
    usefulLength: CriterionScore;
    genericPhrases: CriterionScore;
    substantiveConcepts: CriterionScore;
    comparativeAnswer: CriterionScore;
    buenVivirRecommendations: CriterionScore;
    statutesVsRRI: CriterionScore;
    concreteRisks: CriterionScore;
    evidenceQuality: CriterionScore;
  };
  improvementPriorities: string[];
}

interface QualityReport {
  generatedAt: string;
  inputs: {
    synthesesDir: string;
    topicReferences: string;
  };
  summary: {
    totalTopics: number;
    averageScore: number;
    strong: number;
    usable: number;
    weak: number;
    critical: number;
    weakestTopics: string[];
  };
  topics: SynthesisQualityItem[];
}

const root = process.cwd();
const synthesesDir = join(root, 'src/content/generated/syntheses');
const topicReferencesPath = join(root, 'src/content/generated/topic-references.json');
const evidenceDir = join(root, 'src/content/generated/evidence');
const jsonOutputPath = join(root, 'src/content/generated/synthesis-quality-report.json');
const markdownOutputPath = join(root, 'docs/reports/synthesis-quality-report.md');

const poorPhrases = [
  'parece frecuente',
  'se recomienda revisar',
  'información limitada',
  'informacion limitada',
  'documentos analizados',
  'referencias asociadas',
  'conviene contrastar'
];

const substantiveConcepts = [
  'admisión',
  'admision',
  'baja',
  'expulsión',
  'expulsion',
  'aportación',
  'aportacion',
  'reembolso',
  'cuota',
  'capital social',
  'derecho de uso',
  'uso compartido',
  'espacios comunes',
  'reserva',
  'mantenimiento',
  'convivencia',
  'mediación',
  'mediacion',
  'asamblea',
  'consejo rector',
  'mayoría',
  'mayoria',
  'quórum',
  'quorum',
  'voto',
  'estatutos',
  'rri',
  'reglamento',
  'régimen disciplinario',
  'regimen disciplinario',
  'sanción',
  'sancion',
  'lista de espera',
  'invitados',
  'pernocta',
  'cuidados',
  'liquidez',
  'procedimiento',
  'plazo',
  'criterio',
  'obligación',
  'obligacion',
  'derecho',
  'financiación',
  'financiacion'
];

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clamp(score: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(score)));
}

function flattenSynthesis(synthesis: GeneratedTopicSynthesis): string[] {
  return [
    ...synthesis.summary.overview,
    ...synthesis.summary.commonPatterns,
    ...synthesis.summary.majorDifferences,
    ...synthesis.summary.commonRisks,
    ...synthesis.summary.commonTradeoffs,
    ...synthesis.governancePlacement.usuallyInStatutes,
    ...synthesis.governancePlacement.usuallyInRRI,
    ...synthesis.governancePlacement.mixedApproaches,
    ...synthesis.governancePlacement.notes,
    ...synthesis.recommendationsForBuenVivir.minimalApproach,
    ...synthesis.recommendationsForBuenVivir.flexibleApproach,
    ...synthesis.recommendationsForBuenVivir.pointsToDecideSoon,
    ...synthesis.recommendationsForBuenVivir.pointsThatCanWait,
    ...synthesis.detectedTensions,
    ...synthesis.notableProjects.flatMap((project) => [
      project.projectName,
      project.notableBecause,
      ...project.references
    ])
  ].filter(Boolean);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countPhrase(text: string, phrase: string): number {
  const normalizedText = normalize(text);
  const normalizedPhrase = normalize(phrase);
  return normalizedText.split(normalizedPhrase).length - 1;
}

function scoreReferences(referencesCount: number): CriterionScore {
  const score = referencesCount >= 20 ? 10 : referencesCount >= 10 ? 8 : referencesCount >= 5 ? 5 : referencesCount >= 1 ? 2 : 0;
  const notes = [`${referencesCount} referencias detectadas.`];

  if (referencesCount < 5) {
    notes.push('Base documental baja para una síntesis comparativa.');
  }

  return { score, max: 10, notes };
}

function scoreDocumentDiversity(documentCount: number, documentTypes: string[]): CriterionScore {
  const documentScore = documentCount >= 8 ? 7 : documentCount >= 5 ? 5 : documentCount >= 3 ? 3 : documentCount >= 1 ? 1 : 0;
  const typeScore = documentTypes.length >= 3 ? 5 : documentTypes.length === 2 ? 3 : documentTypes.length === 1 ? 1 : 0;
  const notes = [`${documentCount} documentos únicos y ${documentTypes.length} tipos documentales.`];

  if (documentTypes.length < 2) {
    notes.push('La comparación depende de pocos tipos documentales.');
  }

  return { score: documentScore + typeScore, max: 12, notes };
}

function scoreUsefulLength(words: number, nonGenericWords: number): CriterionScore {
  const score = nonGenericWords >= 450 ? 12 : nonGenericWords >= 300 ? 9 : nonGenericWords >= 180 ? 6 : nonGenericWords >= 90 ? 3 : 0;
  const notes = [`${words} palabras totales; ${nonGenericWords} palabras no asociadas a frases pobres detectadas.`];

  if (nonGenericWords < 180) {
    notes.push('La síntesis parece demasiado breve para orientar decisiones.');
  }

  return { score, max: 12, notes };
}

function scoreGenericPhrases(findings: GenericPhraseFinding[], totalOccurrences: number, words: number): CriterionScore {
  const density = words === 0 ? 0 : totalOccurrences / words;
  const dominates = totalOccurrences >= 5 || density > 0.012;
  const score = totalOccurrences === 0 ? 10 : dominates ? 3 : totalOccurrences >= 3 ? 6 : 8;
  const notes = findings.length
    ? findings.map((finding) => `"${finding.phrase}" aparece ${finding.count} vez/veces.`)
    : ['No se detectan frases pobres configuradas.'];

  if (dominates) {
    notes.push('Las frases genéricas tienen demasiado peso relativo.');
  }

  return { score, max: 10, notes };
}

function scoreSubstantiveConcepts(concepts: string[]): CriterionScore {
  const score = concepts.length >= 8 ? 12 : concepts.length >= 5 ? 9 : concepts.length >= 3 ? 6 : concepts.length >= 1 ? 3 : 0;
  const notes = concepts.length
    ? [`Conceptos detectados: ${concepts.slice(0, 10).join(', ')}.`]
    : ['No se detectan conceptos sustantivos suficientes.'];

  return { score, max: 12, notes };
}

function scoreComparativeAnswer(synthesis: GeneratedTopicSynthesis): CriterionScore {
  const hasProjects = synthesis.notableProjects.length >= 3;
  const hasPatterns = synthesis.summary.commonPatterns.length >= 2;
  const hasDifferences = synthesis.summary.majorDifferences.length >= 1;
  const score = (hasProjects ? 5 : 0) + (hasPatterns ? 4 : 0) + (hasDifferences ? 3 : 0);
  const notes = [
    `${synthesis.notableProjects.length} proyectos destacados.`,
    `${synthesis.summary.commonPatterns.length} patrones y ${synthesis.summary.majorDifferences.length} diferencias.`
  ];

  if (score < 8) {
    notes.push('Puede no responder claramente a cómo lo gestionan otros grupos.');
  }

  return { score, max: 12, notes };
}

function scoreBuenVivirRecommendations(synthesis: GeneratedTopicSynthesis): CriterionScore {
  const recommendations = [
    ...synthesis.recommendationsForBuenVivir.minimalApproach,
    ...synthesis.recommendationsForBuenVivir.flexibleApproach,
    ...synthesis.recommendationsForBuenVivir.pointsToDecideSoon
  ];
  const actionItems = recommendations.filter((item) => /decidir|definir|separar|fijar|evitar|remitir|mantener/i.test(item));
  const concreteItems = actionItems.filter((item) => countWords(item) >= 7);
  const score = concreteItems.length >= 5 ? 10 : concreteItems.length >= 3 ? 7 : concreteItems.length >= 1 ? 4 : 0;
  const notes = [`${concreteItems.length} recomendaciones accionables detectadas.`];

  if (score < 7) {
    notes.push('Faltan decisiones concretas para El Buen Vivir.');
  }

  return { score, max: 10, notes };
}

function scoreStatutesVsRRI(synthesis: GeneratedTopicSynthesis): CriterionScore {
  const statutes = synthesis.governancePlacement.usuallyInStatutes.filter((item) => countWords(item) >= 3);
  const rri = synthesis.governancePlacement.usuallyInRRI.filter((item) => countWords(item) >= 3);
  const mixed = synthesis.governancePlacement.mixedApproaches.length;
  const score = (statutes.length >= 2 ? 5 : statutes.length > 0 ? 3 : 0) + (rri.length >= 2 ? 5 : rri.length > 0 ? 3 : 0) + (mixed > 0 ? 2 : 0);
  const notes = [`${statutes.length} elementos para Estatutos, ${rri.length} para RRI y ${mixed} enfoques mixtos.`];

  if (score < 8) {
    notes.push('La separación Estatutos/RRI necesita más precisión.');
  }

  return { score, max: 12, notes };
}

function scoreConcreteRisks(synthesis: GeneratedTopicSynthesis): CriterionScore {
  const risks = synthesis.summary.commonRisks.filter((risk) => countWords(risk) >= 8);
  const tensions = synthesis.detectedTensions.filter((tension) => tension.includes(' vs '));
  const score = (risks.length >= 4 ? 7 : risks.length >= 2 ? 5 : risks.length === 1 ? 2 : 0) + (tensions.length >= 2 ? 3 : tensions.length === 1 ? 2 : 0);
  const notes = [`${risks.length} riesgos concretos y ${tensions.length} tensiones detectadas.`];

  if (score < 7) {
    notes.push('Faltan riesgos concretos vinculados a decisiones reales.');
  }

  return { score, max: 10, notes };
}

function readEvidenceLayer(slug: string): EvidenceTopicLayer | null {
  const path = join(evidenceDir, `${slug}.json`);
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as EvidenceTopicLayer;
  } catch {
    return null;
  }
}

function scoreEvidenceQuality(slug: string): { score: number; max: number; notes: string[]; health: EvidenceHealth | null } {
  const layer = readEvidenceLayer(slug);
  const defaultResult = { score: 0, max: 12, notes: ['No se encontró capa de evidencia.'], health: null as EvidenceHealth | null };

  if (!layer) return defaultResult;

  const health = layer.evidenceHealth;
  const nonSubstantiveRatio = layer.extracts.length > 0 ? (layer.nonSubstantiveFiltered / layer.extracts.length) : 0;
  const explicitRatio = layer.evidenceSummary.totalClaims > 0 ? (layer.evidenceSummary.explicitCount / layer.evidenceSummary.totalClaims) : 0;
  const notes: string[] = [];
  let penalty = 0;

  notes.push(`Salud de evidencia: ${health}`);
  notes.push(`Filtrados no sustantivos: ${layer.nonSubstantiveFiltered}/${layer.extracts.length}`);

  if (health === 'strong' && explicitRatio >= 0.5 && nonSubstantiveRatio < 0.2) {
    return { score: 12, max: 12, notes: [...notes, 'Evidencia sólida y bien filtrada.'], health };
  }

  if (health === 'strong') penalty = 2;
  else if (health === 'moderate') penalty = 4;
  else if (health === 'weak') penalty = 7;
  else penalty = 10;

  if (nonSubstantiveRatio > 0.5) {
    penalty += 2;
    notes.push('Alta proporción de snippets no sustantivos.');
  }

  if (explicitRatio < 0.2 && layer.evidenceSummary.totalClaims > 2) {
    penalty += 2;
    notes.push('Muy baja proporción de evidencia explícita.');
  }

  return {
    score: Math.max(0, 12 - penalty),
    max: 12,
    notes,
    health
  };
}

function grade(score: number): SynthesisQualityItem['grade'] {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'usable';
  if (score >= 40) return 'weak';
  return 'critical';
}

function buildImprovementPriorities(item: Omit<SynthesisQualityItem, 'improvementPriorities'>): string[] {
  const priorities: string[] = [];

  if (item.referencesCount < 5) priorities.push('Aumentar o revisar referencias de base.');
  if (item.documentDiversity.documents < 3) priorities.push('Incorporar más documentos distintos a la comparación.');
  if (item.genericPhrases.dominatesContent) priorities.push('Sustituir frases genéricas por observaciones basadas en extractos.');
  if (item.substantiveConcepts.length < 3) priorities.push('Añadir conceptos jurídicos o prácticos específicos del tema.');
  if (!item.answersHowOthersManageIt) priorities.push('Explicar mejor cómo lo resuelven otros proyectos.');
  if (!item.hasUsefulBuenVivirRecommendations) priorities.push('Convertir la síntesis en decisiones concretas para El Buen Vivir.');
  if (!item.differentiatesStatutesAndRRI) priorities.push('Distinguir con más claridad qué va en Estatutos y qué va en RRI.');
  if (!item.hasConcreteRisks) priorities.push('Añadir riesgos concretos y tensiones operativas.');
  if (item.evidenceHealth === 'weak' || item.evidenceHealth === 'insufficient') {
    priorities.push('La evidencia documental es limitada; revisar antes de usar como base de acuerdos.');
  }

  return priorities.length ? priorities : ['Mantener como síntesis útil y revisar solo estilo o precisión jurídica.'];
}

function auditSynthesis(synthesis: GeneratedTopicSynthesis, references: GeneratedTopicReference[]): SynthesisQualityItem {
  const topicReferences = references.filter((reference) => reference.topicSlug === synthesis.slug);
  const documents = unique([
    ...synthesis.generatedFrom.documents,
    ...topicReferences.map((reference) => reference.documentSlug)
  ].filter(Boolean));
  const documentTypes = unique(topicReferences.map((reference) => reference.documentType).filter(Boolean)).sort();
  const textParts = flattenSynthesis(synthesis);
  const fullText = textParts.join('\n');
  const words = countWords(fullText);
  const findings = poorPhrases
    .map((phrase) => ({ phrase, count: countPhrase(fullText, phrase) }))
    .filter((finding) => finding.count > 0);
  const totalGenericOccurrences = findings.reduce((total, finding) => total + finding.count, 0);
  const genericWords = findings.reduce((total, finding) => total + countWords(finding.phrase) * finding.count, 0);
  const nonGenericWords = Math.max(0, words - genericWords);
  const concepts = substantiveConcepts.filter((concept) => normalize(fullText).includes(normalize(concept)));

  const evidenceQuality = scoreEvidenceQuality(synthesis.slug);
  const criteria = {
    references: scoreReferences(Math.max(synthesis.generatedFrom.referencesCount, topicReferences.length)),
    documentDiversity: scoreDocumentDiversity(documents.length, documentTypes),
    usefulLength: scoreUsefulLength(words, nonGenericWords),
    genericPhrases: scoreGenericPhrases(findings, totalGenericOccurrences, words),
    substantiveConcepts: scoreSubstantiveConcepts(concepts),
    comparativeAnswer: scoreComparativeAnswer(synthesis),
    buenVivirRecommendations: scoreBuenVivirRecommendations(synthesis),
    statutesVsRRI: scoreStatutesVsRRI(synthesis),
    concreteRisks: scoreConcreteRisks(synthesis),
    evidenceQuality
  };
  const score = clamp(
    Object.values(criteria).reduce((total, criterion) => total + criterion.score, 0),
    100
  );
  const genericPhraseScore = criteria.genericPhrases;
  const itemWithoutPriorities = {
    slug: synthesis.slug,
    score,
    grade: grade(score),
    referencesCount: Math.max(synthesis.generatedFrom.referencesCount, topicReferences.length),
    documentDiversity: {
      documents: documents.length,
      documentTypes
    },
    usefulLength: {
      words,
      nonGenericWords
    },
    genericPhrases: {
      findings,
      totalOccurrences: totalGenericOccurrences,
      dominatesContent: genericPhraseScore.notes.some((note) => note.includes('demasiado peso'))
    },
    substantiveConcepts: concepts,
    answersHowOthersManageIt: criteria.comparativeAnswer.score >= 8,
    hasUsefulBuenVivirRecommendations: criteria.buenVivirRecommendations.score >= 7,
    differentiatesStatutesAndRRI: criteria.statutesVsRRI.score >= 8,
    hasConcreteRisks: criteria.concreteRisks.score >= 7,
    evidenceHealth: evidenceQuality.health,
    criteria
  } satisfies Omit<SynthesisQualityItem, 'improvementPriorities'>;

  return {
    ...itemWithoutPriorities,
    improvementPriorities: buildImprovementPriorities(itemWithoutPriorities)
  };
}

function buildMarkdown(report: QualityReport): string {
  const lines = [
    '# Informe de calidad editorial de síntesis',
    '',
    `Generado: ${report.generatedAt}`,
    '',
    '## Resumen',
    '',
    `- Temas auditados: ${report.summary.totalTopics}`,
    `- Puntuación media: ${report.summary.averageScore}/100`,
    `- Fuertes: ${report.summary.strong}`,
    `- Utilizables: ${report.summary.usable}`,
    `- Débiles: ${report.summary.weak}`,
    `- Críticas: ${report.summary.critical}`,
    `- Temas más débiles: ${report.summary.weakestTopics.join(', ') || 'ninguno'}`,
    '',
    '## Criterios',
    '',
    '- Referencias: volumen mínimo de evidencia detectada.',
    '- Diversidad documental: documentos únicos y tipos de fuente.',
    '- Longitud útil: extensión no dominada por frases pobres.',
    '- Frases genéricas: penaliza si dominan el contenido, no por aparecer una vez.',
    '- Conceptos sustantivos: presencia de vocabulario jurídico o práctico específico.',
    '- Comparación: capacidad de responder cómo lo gestionan otros grupos.',
    '- Recomendaciones: utilidad práctica para El Buen Vivir.',
    '- Estatutos/RRI: claridad sobre ubicación normativa.',
    '- Riesgos: concreción de riesgos y tensiones.',
    '- Calidad de evidencia: salud de la capa de evidencia (solo en temas con evidencia generada).',
    '',
    '## Temas',
    ''
  ];

  for (const topic of report.topics) {
    lines.push(`### ${topic.slug}`);
    lines.push('');
    lines.push(`- Puntuación: ${topic.score}/100 (${topic.grade})`);
    lines.push(`- Referencias: ${topic.referencesCount}`);
    lines.push(`- Documentos únicos: ${topic.documentDiversity.documents}`);
    lines.push(`- Tipos documentales: ${topic.documentDiversity.documentTypes.join(', ') || 'sin datos'}`);
    lines.push(`- Longitud útil: ${topic.usefulLength.nonGenericWords}/${topic.usefulLength.words} palabras`);
    lines.push(`- Frases genéricas: ${topic.genericPhrases.totalOccurrences}${topic.genericPhrases.dominatesContent ? ' (dominan el contenido)' : ''}`);
    lines.push(`- Conceptos sustantivos: ${topic.substantiveConcepts.slice(0, 8).join(', ') || 'insuficientes'}`);
    lines.push(`- Responde cómo lo gestionan otros grupos: ${topic.answersHowOthersManageIt ? 'sí' : 'no'}`);
    lines.push(`- Recomendaciones útiles para El Buen Vivir: ${topic.hasUsefulBuenVivirRecommendations ? 'sí' : 'no'}`);
    lines.push(`- Diferencia Estatutos/RRI: ${topic.differentiatesStatutesAndRRI ? 'sí' : 'no'}`);
    lines.push(`- Riesgos concretos: ${topic.hasConcreteRisks ? 'sí' : 'no'}`);
    lines.push(`- Salud de evidencia: ${topic.evidenceHealth || 'sin capa de evidencia'}`);
    lines.push(`- Calidad evidencia: ${topic.criteria.evidenceQuality.score}/${topic.criteria.evidenceQuality.max}`);
    lines.push(`- Prioridades: ${topic.improvementPriorities.join(' ')}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  if (!existsSync(synthesesDir)) {
    throw new Error(`No existe el directorio de síntesis: ${synthesesDir}`);
  }

  if (!existsSync(topicReferencesPath)) {
    throw new Error(`No existe el índice de referencias: ${topicReferencesPath}`);
  }

  const referencesFile = readJson<TopicReferencesFile>(topicReferencesPath);
  const synthesisFiles = readdirSync(synthesesDir)
    .filter((file) => file.endsWith('.generated.json'))
    .sort();
  const topics = synthesisFiles
    .map((file) => readJson<GeneratedTopicSynthesis>(join(synthesesDir, file)))
    .map((synthesis) => auditSynthesis(synthesis, referencesFile.references))
    .sort((a, b) => a.score - b.score || a.slug.localeCompare(b.slug));
  const averageScore = topics.length
    ? Math.round(topics.reduce((total, topic) => total + topic.score, 0) / topics.length)
    : 0;
  const report: QualityReport = {
    generatedAt: new Date().toISOString(),
    inputs: {
      synthesesDir: `src/content/generated/syntheses (${synthesisFiles.length} archivos)`,
      topicReferences: 'src/content/generated/topic-references.json'
    },
    summary: {
      totalTopics: topics.length,
      averageScore,
      strong: topics.filter((topic) => topic.grade === 'strong').length,
      usable: topics.filter((topic) => topic.grade === 'usable').length,
      weak: topics.filter((topic) => topic.grade === 'weak').length,
      critical: topics.filter((topic) => topic.grade === 'critical').length,
      weakestTopics: topics.slice(0, 5).map((topic) => `${topic.slug} (${topic.score})`)
    },
    topics
  };

  mkdirSync(join(root, 'src/content/generated'), { recursive: true });
  mkdirSync(join(root, 'docs/reports'), { recursive: true });
  writeFileSync(jsonOutputPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownOutputPath, buildMarkdown(report));

  console.log(`Audited ${topics.length} syntheses.`);
  console.log(`JSON report: ${basename(jsonOutputPath)}`);
  console.log(`Markdown report: ${markdownOutputPath}`);
}

main();

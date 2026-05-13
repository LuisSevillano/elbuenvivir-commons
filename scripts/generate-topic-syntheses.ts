import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import type { GeneratedTopicReference, GeneratedTopicSynthesis, TaxonomyTopic } from '../src/lib/content/types';

interface PackReference {
  documentTitle: string;
  documentSlug: string;
  documentType: string;
  jurisdiction?: string;
  project?: string;
  articleOrSection?: string;
  confidence?: string;
  score?: number;
  excerpt: string;
}

const root = process.cwd();
const packsDir = join(root, 'src/content/research-packs');
const referencesPath = join(root, 'src/content/generated/topic-references.json');
const taxonomyPath = join(root, 'taxonomy/topics.json');
const outputDir = join(root, 'src/content/generated/syntheses');
const maxProjects = 6;

const statutesSignals = ['estatutos', 'capital social', 'aportaciones', 'baja', 'admision', 'expulsion', 'asamblea general', 'consejo rector', 'disolucion', 'reembolso'];
const rriSignals = ['rri', 'reglamento de regimen interno', 'normas internas', 'convivencia', 'uso', 'reservas', 'pernoctas', 'limpieza', 'mantenimiento', 'mediacion', 'procedimiento'];
const riskSignals = ['riesgo', 'sancion', 'expulsion', 'impugnacion', 'bloqueo', 'conflicto', 'incumplimiento', 'perdida', 'responsabilidad'];
const rigiditySignals = ['rigidez', 'rigido', 'modificacion', 'dificil de modificar', 'estatutos', 'mayoria reforzada'];
const flexibilitySignals = ['flexibilidad', 'adaptar', 'rri', 'reglamento', 'procedimiento interno', 'normas internas'];
const smallGroupSignals = ['grupo pequeño', 'comunidad', 'convivencia', 'acompañamiento', 'mediacion', 'consenso'];

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function cleanInline(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/`/g, '').replace(/\s+/g, ' ').trim();
  return cleaned && cleaned !== 'No disponible' ? cleaned : undefined;
}

function field(block: string, label: string): string | undefined {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return cleanInline(block.match(new RegExp(`^- ${escapedLabel}: (.*)$`, 'm'))?.[1]);
}

function parseReferences(pack: string): PackReference[] {
  return [...pack.matchAll(/### Referencia \d+[\s\S]*?(?=\n---\n|\n## |$)/g)].map((match) => {
    const block = match[0];
    const excerpt = block.match(/```text\n([\s\S]*?)\n```/)?.[1]?.trim() ?? '';

    return {
      documentTitle: field(block, 'Documento') ?? 'Documento no identificado',
      documentSlug: field(block, 'Slug documento') ?? 'documento_no_identificado',
      documentType: field(block, 'Tipo') ?? 'otro',
      jurisdiction: field(block, 'Jurisdicción'),
      project: field(block, 'Proyecto'),
      articleOrSection: field(block, 'Sección/artículo'),
      confidence: field(block, 'Confidence'),
      score: Number(field(block, 'Score') ?? 0) || undefined,
      excerpt
    };
  });
}

function packFiles(): string[] {
  if (!existsSync(packsDir)) {
    return [];
  }

  return readdirSync(packsDir)
    .filter((file) => file.endsWith('.md'))
    .toSorted()
    .map((file) => join(packsDir, file));
}

function includesAny(text: string, signals: string[]): boolean {
  const normalized = normalize(text);
  return signals.some((signal) => normalized.includes(normalize(signal)));
}

function countBy<T extends string>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function topValues(counts: Map<string, number>, max = 4): string[] {
  return [...counts.entries()]
    .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, max)
    .map(([value]) => value);
}

function referenceLabel(reference: PackReference): string {
  return reference.articleOrSection
    ? `${reference.documentTitle} - ${reference.articleOrSection}`
    : reference.documentTitle;
}

function projectName(reference: PackReference): string {
  return reference.project || reference.documentTitle;
}

function referencesForTopic(slug: string, allReferences: GeneratedTopicReference[]): GeneratedTopicReference[] {
  return allReferences.filter((reference) => reference.topicSlug === slug);
}

function signalsSummary(references: PackReference[], signals: string[]): PackReference[] {
  return references.filter((reference) => includesAny(`${reference.articleOrSection ?? ''} ${reference.excerpt}`, signals));
}

function sentenceFromEvidence(prefix: string, matches: PackReference[], fallback: string): string {
  if (matches.length === 0) {
    return fallback;
  }

  const docs = topValues(countBy(matches.map((reference) => reference.documentTitle)), 3);
  return `${prefix} en referencias de ${docs.join(', ')}.`;
}

function commonPatterns(topic: TaxonomyTopic, references: PackReference[]): string[] {
  if (references.length === 0) {
    return ['No hay referencias suficientes en el research pack para detectar patrones comparados.'];
  }

  const statutesMatches = signalsSummary(references, statutesSignals);
  const rriMatches = signalsSummary(references, rriSignals);
  const typeCounts = countBy(references.map((reference) => reference.documentType));
  const mainTypes = topValues(typeCounts, 3);

  return [
    `Parece frecuente que el tema aparezca en documentos de tipo ${mainTypes.join(', ') || 'no identificado'}.`,
    sentenceFromEvidence('Varios proyectos parecen tratar elementos estructurales o derechos básicos', statutesMatches, 'No se detecta evidencia suficiente para afirmar un patrón estatutario claro.'),
    sentenceFromEvidence('Algunos grupos parecen desarrollar aspectos operativos o de convivencia', rriMatches, 'No se detecta evidencia suficiente para afirmar un patrón claro de RRI.'),
    `La lectura automática sugiere revisar ${topic.keywords?.slice(0, 4).join(', ') || topic.title.toLowerCase()} como términos activadores principales.`
  ];
}

function majorDifferences(references: PackReference[]): string[] {
  const documentTypes = topValues(countBy(references.map((reference) => reference.documentType)), 5);
  const jurisdictions = topValues(countBy(references.map((reference) => reference.jurisdiction).filter((value): value is string => Boolean(value))), 5);
  const high = references.filter((reference) => reference.confidence === 'high').length;
  const low = references.filter((reference) => reference.confidence === 'low').length;

  return [
    documentTypes.length > 1
      ? `Aparecen diferencias por tipo documental: ${documentTypes.join(', ')}.`
      : 'No hay suficiente variedad de tipos documentales para comparar enfoques con seguridad.',
    jurisdictions.length > 1
      ? `Aparecen jurisdicciones distintas que conviene no mezclar sin revisión: ${jurisdictions.join(', ')}.`
      : 'La dimensión jurisdiccional no parece suficientemente diversa en las referencias disponibles.',
    high > 0 && low > 0
      ? `La evidencia combina referencias de confianza alta (${high}) y baja (${low}); conviene priorizar las primeras.`
      : 'La distribución de confidence no permite por sí sola comparar diferencias de calidad.'
  ];
}

function risksAndTradeoffs(references: PackReference[]): { risks: string[]; tradeoffs: string[]; tensions: string[] } {
  const riskMatches = signalsSummary(references, riskSignals);
  const rigidityMatches = signalsSummary(references, rigiditySignals);
  const flexibilityMatches = signalsSummary(references, flexibilitySignals);
  const smallGroupMatches = signalsSummary(references, smallGroupSignals);

  return {
    risks: [
      sentenceFromEvidence('Se detectan posibles riesgos o conflictos', riskMatches, 'No se detectan riesgos explícitos suficientes; aun así conviene revisar conflictos potenciales manualmente.'),
      sentenceFromEvidence('Puede existir riesgo de rigidez si se fija demasiado detalle', rigidityMatches, 'No se detecta señal fuerte de rigidez, pero conviene valorar cuánto detalle llevar a Estatutos.'),
      'No debe asumirse que una práctica de otro proyecto sea adecuada sin contrastar tamaño, fase y contexto de El Buen Vivir.'
    ],
    tradeoffs: [
      'El tradeoff principal parece estar entre claridad normativa y capacidad de adaptación futura.',
      sentenceFromEvidence('Las referencias sugieren margen para soluciones flexibles', flexibilityMatches, 'No hay evidencia suficiente para identificar una práctica flexible dominante.'),
      sentenceFromEvidence('Algunas señales parecen especialmente relevantes para grupos pequeños o de convivencia intensa', smallGroupMatches, 'No hay evidencia suficiente para afirmar compatibilidad específica con grupos pequeños.')
    ],
    tensions: [
      rigidityMatches.length > 0 ? 'Tensión entre fijar reglas en Estatutos y evitar rigidez futura.' : 'Tensión potencial entre seguridad y flexibilidad, pendiente de revisión.',
      riskMatches.length > 0 ? 'Tensión entre prevenir conflictos y no sobrerregular procedimientos internos.' : 'Tensión potencial por falta de evidencia explícita sobre conflictos.',
      flexibilityMatches.length > 0 ? 'Tensión entre autonomía comunitaria y necesidad de reglas claras.' : 'Tensión potencial entre detalle normativo y aprendizaje progresivo.'
    ]
  };
}

function governancePlacement(references: PackReference[]): GeneratedTopicSynthesis['governancePlacement'] {
  const statutesMatches = signalsSummary(references, statutesSignals);
  const rriMatches = signalsSummary(references, rriSignals);
  const both = references.filter((reference) => includesAny(reference.excerpt, statutesSignals) && includesAny(reference.excerpt, rriSignals));

  return {
    usuallyInStatutes: statutesMatches.length > 0
      ? [
          'Parece frecuente reservar para Estatutos principios, derechos, obligaciones o efectos estructurales.',
          sentenceFromEvidence('Esta señal aparece', statutesMatches, 'No hay evidencia estatutaria suficiente.')
        ]
      : ['No hay evidencia suficiente para afirmar que el tema suela ir en Estatutos.'],
    usuallyInRRI: rriMatches.length > 0
      ? [
          'Parece frecuente desarrollar en RRI aspectos operativos, convivencia, uso o procedimientos revisables.',
          sentenceFromEvidence('Esta señal aparece', rriMatches, 'No hay evidencia de RRI suficiente.')
        ]
      : ['No hay evidencia suficiente para afirmar que el tema suela ir en RRI.'],
    mixedApproaches: both.length > 0
      ? ['Algunas referencias combinan lenguaje estatutario y desarrollo operativo, lo que sugiere enfoques mixtos.']
      : ['No se detecta claramente un enfoque mixto; conviene revisar manualmente las referencias.'],
    notes: [
      'Esta lectura es generada automáticamente y no debe convertirse en regla sin revisión jurídica.',
      'La ubicación final debe diferenciar qué es principio estable y qué es procedimiento adaptable.'
    ]
  };
}

function recommendations(references: PackReference[]): GeneratedTopicSynthesis['recommendationsForBuenVivir'] {
  const flexibilityMatches = signalsSummary(references, flexibilitySignals);
  const riskMatches = signalsSummary(references, riskSignals);

  return {
    minimalApproach: [
      'Una opción prudente es fijar solo criterios mínimos verificables por las referencias disponibles.',
      'Conviene evitar reproducir detalles de otros proyectos sin validar su encaje en El Buen Vivir.',
      riskMatches.length > 0 ? 'Conviene cubrir explícitamente los riesgos más repetidos antes de añadir detalle operativo.' : 'Conviene identificar riesgos con revisión humana antes de ampliar el texto.'
    ],
    flexibleApproach: [
      flexibilityMatches.length > 0 ? 'Una práctica compatible con flexibilidad parece remitir procedimientos al RRI o normas internas.' : 'Si no hay evidencia flexible clara, conviene mantener el borrador abierto y revisable.',
      'Para grupos pequeños, parece más compatible separar principios estables de protocolos que puedan cambiar con la experiencia.'
    ],
    pointsToDecideSoon: [
      'Qué parte del tema afecta a derechos u obligaciones básicas.',
      'Qué decisiones requieren seguridad desde el inicio para evitar conflictos.',
      'Qué referencias de confianza alta merecen revisión prioritaria.'
    ],
    pointsThatCanWait: [
      'Detalles de procedimiento no respaldados por varias referencias.',
      'Protocolos operativos que puedan aprenderse con la práctica comunitaria.',
      'Formularios, calendarios internos y reglas menores que no afecten derechos básicos.'
    ]
  };
}

function notableProjects(references: PackReference[]): GeneratedTopicSynthesis['notableProjects'] {
  const grouped = new Map<string, PackReference[]>();

  for (const reference of references) {
    const key = projectName(reference);
    grouped.set(key, [...(grouped.get(key) ?? []), reference]);
  }

  return [...grouped.entries()]
    .toSorted((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es'))
    .slice(0, maxProjects)
    .map(([name, projectReferences]) => ({
      projectName: name,
      notableBecause: projectReferences.length > 1
        ? `Aporta ${projectReferences.length} referencias automáticas para comparar este tema.`
        : 'Aporta una referencia automática potencialmente útil para revisión.',
      references: projectReferences.slice(0, 5).map(referenceLabel)
    }));
}

function synthesize(topic: TaxonomyTopic, packPath: string, pack: string, topicReferences: GeneratedTopicReference[]): GeneratedTopicSynthesis {
  const references = parseReferences(pack);
  const documents = [...new Set(references.map((reference) => reference.documentSlug))].toSorted();
  const enoughInformation = references.length >= 3;
  const riskData = risksAndTradeoffs(references);

  return {
    slug: topic.slug,
    generatedAt: new Date().toISOString(),
    generatedFrom: {
      researchPack: packPath.replace(`${root}/`, ''),
      referencesCount: topicReferences.length || references.length,
      documents
    },
    summary: {
      overview: enoughInformation
        ? [
            `La síntesis compara ${references.length} referencias automáticas asociadas al tema "${topic.title}".`,
            'Las observaciones se formulan de forma prudente y deben verificarse contra las referencias originales.'
          ]
        : [
            `Hay información limitada para "${topic.title}"; la síntesis no permite afirmar patrones robustos.`,
            'Conviene generar más referencias o revisar manualmente los documentos antes de usar conclusiones.'
          ],
      commonPatterns: commonPatterns(topic, references),
      majorDifferences: majorDifferences(references),
      commonRisks: riskData.risks,
      commonTradeoffs: riskData.tradeoffs
    },
    governancePlacement: governancePlacement(references),
    recommendationsForBuenVivir: recommendations(references),
    detectedTensions: riskData.tensions,
    notableProjects: notableProjects(references),
    legalWarnings: [
      'Síntesis generada automáticamente sin revisión jurídica.',
      'No sustituye asesoramiento jurídico profesional.',
      'No debe usarse como contenido curado sin comprobar las referencias originales.',
      'La separación entre ley, proyectos e interpretación automática debe mantenerse visible.'
    ],
    generatedDisclaimer: 'Síntesis comparada generada automáticamente a partir de research packs y referencias heurísticas. Revisar jurídicamente y contrastar con fuentes originales antes de usar.',
    status: 'needs_legal_review'
  };
}

const taxonomy = readJson<TaxonomyTopic[]>(taxonomyPath).filter((topic) => topic.status !== 'merged');
const taxonomyBySlug = new Map(taxonomy.map((topic) => [topic.slug, topic]));
const references = readJson<{ references: GeneratedTopicReference[] }>(referencesPath).references;

mkdirSync(outputDir, { recursive: true });

let generated = 0;

for (const packPath of packFiles()) {
  const slug = basename(packPath, extname(packPath));
  const topic = taxonomyBySlug.get(slug);

  if (!topic) {
    continue;
  }

  const pack = readFileSync(packPath, 'utf8');
  const synthesis = synthesize(topic, packPath, pack, referencesForTopic(slug, references));
  writeFileSync(join(outputDir, `${slug}.generated.json`), `${JSON.stringify(synthesis, null, 2)}\n`);
  generated += 1;
}

console.log(`Generated ${generated} topic synthesis file(s).`);
console.log('Wrote src/content/generated/syntheses/*.generated.json.');

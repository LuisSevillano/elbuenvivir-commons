import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import type { GovernanceTopic, TaxonomyTopic } from '../src/lib/content/types';

type DraftPlacement = GovernanceTopic['governancePlacement'];
type RelatedTopic = NonNullable<GovernanceTopic['relatedTopics']>[number];

interface PackReference {
  documentTitle: string;
  documentSlug: string;
  documentType: string;
  jurisdiction?: string;
  project?: string;
  articleOrSection?: string;
  confidence?: string;
  score?: string;
  excerpt: string;
}

interface DraftTrace {
  generated: true;
  curated: false;
  sourceResearchPack: string;
  evidenceCount: number;
  highConfidenceEvidence: number;
  mediumConfidenceEvidence: number;
  lowConfidenceEvidence: number;
  evidence: {
    documentSlug: string;
    documentTitle: string;
    documentType: string;
    articleOrSection?: string;
    confidence?: string;
    excerpt: string;
  }[];
}

type TopicDraft = GovernanceTopic & {
  draftStatus: 'generated_not_curated';
  generatedFrom: DraftTrace;
};

const root = process.cwd();
const taxonomyPath = join(root, 'taxonomy/topics.json');
const packsDir = join(root, 'src/content/research-packs');
const draftsDir = join(root, 'src/content/drafts');
const maxEvidenceItems = 12;

const placementSignals = {
  statutes: [
    'estatutos',
    'estatuto',
    'capital social',
    'aportaciones',
    'baja',
    'admision',
    'expulsion',
    'asamblea general',
    'consejo rector',
    'disolucion',
    'reembolso'
  ],
  rri: [
    'rri',
    'reglamento de regimen interno',
    'normas internas',
    'convivencia',
    'uso',
    'reservas',
    'pernoctas',
    'limpieza',
    'mantenimiento',
    'mediacion',
    'procedimiento interno'
  ]
};

const riskSignals = {
  overregulation: ['sobrerregulacion', 'sobre regulacion', 'demasiado detalle', 'excesivo detalle', 'regular demasiado'],
  rigidity: ['rigidez', 'rigido', 'dificil de modificar', 'modificacion estatutaria', 'flexibilidad'],
  tradeoff: ['equilibrio', 'tradeoff', 'ponderar', 'compatibilizar', 'tension entre', 'por un lado'],
  conflict: ['conflicto', 'impugnacion', 'sancion', 'expulsion', 'bloqueo', 'desacuerdo', 'controversia']
};

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

function sentence(value: string): string {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function compactExcerpt(value: string, maxLength = 240): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).trim()}...`;
}

function countSignals(text: string, signals: string[]): number {
  const normalized = normalize(text);
  return signals.reduce((total, signal) => total + (normalized.includes(normalize(signal)) ? 1 : 0), 0);
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

function field(block: string, label: string): string | undefined {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return cleanInline(block.match(new RegExp(`^- ${escapedLabel}: (.*)$`, 'm'))?.[1]);
}

function parseReferences(pack: string): PackReference[] {
  return [...pack.matchAll(/### Referencia \d+[\s\S]*?(?=\n---\n|\n## |$)/g)].map((match) => {
    const block = match[0];
    const excerpt = block.match(/```text\n([\s\S]*?)\n```/)?.[1] ?? '';

    return {
      documentTitle: field(block, 'Documento') ?? 'Documento no identificado',
      documentSlug: field(block, 'Slug documento') ?? 'documento_no_identificado',
      documentType: field(block, 'Tipo') ?? 'otro',
      jurisdiction: field(block, 'Jurisdicción'),
      project: field(block, 'Proyecto'),
      articleOrSection: field(block, 'Sección/artículo'),
      confidence: field(block, 'Confidence'),
      score: field(block, 'Score'),
      excerpt
    };
  });
}

function packTitle(pack: string, fallback: string): string {
  return pack.match(/^# Research pack: (.*)$/m)?.[1]?.trim() || fallback;
}

function referenceLabel(reference: PackReference): string {
  const section = reference.articleOrSection ? `, ${reference.articleOrSection}` : '';
  return `${reference.documentTitle}${section}`;
}

function topReferences(references: PackReference[]): PackReference[] {
  const confidenceValue: Record<string, number> = { high: 3, medium: 2, low: 1 };

  return references
    .toSorted(
      (a, b) =>
        (confidenceValue[b.confidence ?? ''] ?? 0) - (confidenceValue[a.confidence ?? ''] ?? 0) ||
        Number(b.score ?? 0) - Number(a.score ?? 0)
    )
    .slice(0, maxEvidenceItems);
}

function contentNouns(topic: TaxonomyTopic, references: PackReference[]): string[] {
  const candidates = new Set([...(topic.keywords ?? []), ...(topic.aliases ?? [])]);

  for (const reference of references.slice(0, 8)) {
    if (reference.articleOrSection) {
      candidates.add(reference.articleOrSection.replace(/^Artículo\s+\d+[.\-ºª)]*\s*/i, ''));
    }
  }

  return [...candidates]
    .map((item) => item.replace(/[.:;]+$/g, '').trim())
    .filter((item) => item.length >= 4)
    .slice(0, 6);
}

function minimumContents(topic: TaxonomyTopic, references: PackReference[]): string[] {
  const nouns = contentNouns(topic, references);
  const items = nouns.map((item) => `Conviene valorar una regla mínima sobre ${item}, contrastando las referencias automáticas del research pack.`);

  items.push('Distinguir qué debe quedar como principio estable y qué conviene dejar como procedimiento adaptable.');
  items.push('Mantener trazabilidad entre cada regla propuesta y las referencias automáticas revisadas.');

  return [...new Set(items)].slice(0, 7);
}

function decisions(topic: TaxonomyTopic, references: PackReference[]): string[] {
  const documentTypes = new Set(references.map((reference) => reference.documentType));
  const hasStatutes = documentTypes.has('estatutos') || countSignals(references.map((reference) => reference.excerpt).join(' '), ['estatutos']) > 0;
  const hasRri = documentTypes.has('rri') || countSignals(references.map((reference) => reference.excerpt).join(' '), ['rri', 'reglamento de regimen interno']) > 0;

  return [
    `Conviene valorar si ${topic.title.toLowerCase()} debe formularse como principio, procedimiento o combinación de ambos.`,
    hasStatutes
      ? 'Otros proyectos suelen reflejar parte del tema en Estatutos cuando afecta a derechos, obligaciones o estructura básica.'
      : 'Si no hay evidencia estatutaria suficiente en el research pack, conviene evitar elevar detalles a Estatutos sin revisión.',
    hasRri
      ? 'Una opción frecuente es desarrollar aspectos operativos en el RRI para conservar capacidad de adaptación.'
      : 'Si el research pack no aporta evidencia de RRI, conviene tratar los procedimientos internos como hipótesis de trabajo.',
    'Conviene decidir qué tradeoffs aceptar entre claridad, flexibilidad y facilidad de modificación.',
    'Conviene marcar las partes que requieren revisión jurídica antes de convertir el borrador en contenido curado.'
  ];
}

function risks(references: PackReference[]): string[] {
  const evidenceText = references.map((reference) => reference.excerpt).join(' ');
  const risks = [
    'Sobre-regulación: conviene valorar si el research pack muestra demasiado detalle operativo para fijarlo en Estatutos.',
    'Rigidez: una regla estatutaria puede ser más difícil de adaptar que una regla de RRI.',
    'Tradeoffs: conviene equilibrar seguridad jurídica interna, claridad comunitaria y capacidad de aprendizaje.',
    'Conflictos potenciales: las reglas ambiguas o demasiado detalladas pueden generar interpretaciones divergentes.'
  ];

  if (countSignals(evidenceText, riskSignals.overregulation) === 0) {
    risks[0] = 'Sobre-regulación: no hay señal concluyente en el research pack, pero conviene revisar si el borrador introduce detalle excesivo.';
  }

  if (countSignals(evidenceText, riskSignals.rigidity) === 0) {
    risks[1] = 'Rigidez: no hay señal concluyente en el research pack, pero conviene diferenciar reglas estables y adaptables.';
  }

  if (countSignals(evidenceText, riskSignals.tradeoff) === 0) {
    risks[2] = 'Tradeoffs: el research pack debe revisarse para identificar tensiones entre flexibilidad, control y claridad.';
  }

  if (countSignals(evidenceText, riskSignals.conflict) === 0) {
    risks[3] = 'Conflictos potenciales: conviene revisar si el tema puede generar desacuerdos prácticos aunque no aparezcan expresamente.';
  }

  return risks;
}

function governancePlacement(references: PackReference[]): DraftPlacement {
  const evidenceText = references.map((reference) => `${reference.documentType} ${reference.articleOrSection ?? ''} ${reference.excerpt}`).join(' ');
  const statutesScore = countSignals(evidenceText, placementSignals.statutes);
  const rriScore = countSignals(evidenceText, placementSignals.rri);
  const recommendedPrimaryLocation: DraftPlacement['recommendedPrimaryLocation'] =
    statutesScore > rriScore + 2 ? 'estatutos' : rriScore > statutesScore + 2 ? 'rri' : 'mixed';

  return {
    recommendedPrimaryLocation,
    rationale: [
      'Conviene valorar Estatutos para principios, derechos, obligaciones y efectos estructurales detectados en el research pack.',
      'Conviene valorar RRI para procedimientos, usos cotidianos, ajustes operativos y reglas que puedan necesitar adaptación.',
      'La ubicación propuesta es automática y debe revisarse jurídicamente antes de incorporarse a contenido curado.'
    ],
    shouldBeInStatutes: [
      'Principios mínimos y efectos básicos cuando el research pack los conecte con derechos u obligaciones de las personas socias.',
      'Criterios generales que otros proyectos suelen tratar como marco estable.',
      'Remisiones prudentes al RRI cuando el detalle operativo deba poder cambiar.'
    ],
    shouldBeInRRI: [
      'Procedimientos internos y pasos de aplicación práctica.',
      'Criterios operativos revisables por la comunidad.',
      'Protocolos, formularios, calendarios o reglas de uso cotidiano si aparecen en las referencias.'
    ],
    canBeDeferredInitially: [
      'Detalles no respaldados claramente por extractos del research pack.',
      'Reglas que requieran contraste comunitario o jurídico adicional.'
    ],
    risksIfPlacedInStatutes: [
      'Una opción demasiado detallada puede producir rigidez y dificultar ajustes futuros.',
      'Conviene evitar incorporar procedimientos operativos sin evidencia clara y revisión jurídica.'
    ],
    risksIfPlacedInRRI: [
      'Una opción demasiado flexible puede dejar sin rango suficiente cuestiones esenciales.',
      'Conviene no rebajar a RRI derechos u obligaciones básicas si el research pack apunta a estructura estatutaria.'
    ]
  };
}

function relatedTopics(topic: TaxonomyTopic, taxonomy: TaxonomyTopic[], pack: string): RelatedTopic[] {
  const normalizedPack = normalize(pack);

  return taxonomy
    .filter((candidate) => candidate.slug !== topic.slug && candidate.status !== 'merged')
    .filter((candidate) => [candidate.title, ...(candidate.keywords ?? []), ...(candidate.aliases ?? [])].some((term) => normalizedPack.includes(normalize(term))))
    .slice(0, 5)
    .map((candidate) => ({
      topicSlug: candidate.slug,
      relationship: 'complements',
      explanation: 'Relación sugerida automáticamente porque el research pack contiene términos de ambos temas.'
    }));
}

function suggestedClause(topic: TaxonomyTopic, references: PackReference[]): GovernanceTopic['suggestedClause'] {
  const hasRriEvidence = references.some((reference) => normalize(`${reference.documentType} ${reference.excerpt}`).includes('rri'));
  const operationalTail = hasRriEvidence
    ? 'El Reglamento de Régimen Interno podrá desarrollar los procedimientos operativos, siempre que no contradiga los principios básicos aprobados.'
    : 'Los procedimientos operativos podrán desarrollarse en una norma interna revisable, si la cooperativa lo considera adecuado.';

  return {
    text: `La cooperativa podrá regular ${topic.title.toLowerCase()} mediante criterios mínimos aprobados por sus órganos competentes. Una opción frecuente es fijar en Estatutos los principios esenciales y remitir los detalles prácticos a normas internas. ${operationalTail}`,
    disclaimer: 'Borrador generado automáticamente desde research pack. Revisar jurídicamente antes de usar o incorporar a contenido curado.',
    status: 'draft'
  };
}

function trace(packPath: string, references: PackReference[]): DraftTrace {
  const evidence = topReferences(references).map((reference) => ({
    documentSlug: reference.documentSlug,
    documentTitle: reference.documentTitle,
    documentType: reference.documentType,
    ...(reference.articleOrSection ? { articleOrSection: reference.articleOrSection } : {}),
    ...(reference.confidence ? { confidence: reference.confidence } : {}),
    excerpt: compactExcerpt(reference.excerpt)
  }));

  return {
    generated: true,
    curated: false,
    sourceResearchPack: packPath.replace(`${root}/`, ''),
    evidenceCount: references.length,
    highConfidenceEvidence: references.filter((reference) => reference.confidence === 'high').length,
    mediumConfidenceEvidence: references.filter((reference) => reference.confidence === 'medium').length,
    lowConfidenceEvidence: references.filter((reference) => reference.confidence === 'low').length,
    evidence
  };
}

function draftFor(topic: TaxonomyTopic, taxonomy: TaxonomyTopic[], packPath: string, pack: string): TopicDraft {
  const references = parseReferences(pack);
  const title = packTitle(pack, topic.title);

  return {
    slug: topic.slug,
    title,
    shortDescription: `Borrador generado automáticamente desde research pack sobre ${title.toLowerCase()}; conviene valorar sus referencias antes de convertirlo en contenido curado.`,
    category: topic.category,
    minimumContents: minimumContents(topic, references),
    legalBasis: [],
    projectReferences: [],
    decisionsForBuenVivir: decisions(topic, references),
    risks: risks(references),
    governancePlacement: governancePlacement(references),
    relatedTopics: relatedTopics(topic, taxonomy, pack),
    suggestedClause: suggestedClause(topic, references),
    status: 'needs_legal_review',
    draftStatus: 'generated_not_curated',
    generatedFrom: trace(packPath, references)
  };
}

const taxonomy = readJson<TaxonomyTopic[]>(taxonomyPath);
const taxonomyBySlug = new Map(taxonomy.map((topic) => [topic.slug, topic]));

mkdirSync(draftsDir, { recursive: true });

let generated = 0;

for (const packPath of packFiles()) {
  const slug = basename(packPath, extname(packPath));
  const topic = taxonomyBySlug.get(slug);

  if (!topic || topic.status === 'merged') {
    continue;
  }

  const pack = readFileSync(packPath, 'utf8');
  const draft = draftFor(topic, taxonomy, packPath, pack);
  writeFileSync(join(draftsDir, `${slug}.draft.json`), `${JSON.stringify(draft, null, 2)}\n`);
  generated += 1;
}

console.log(`Generated ${generated} topic draft(s).`);
console.log('Wrote src/content/drafts/*.draft.json.');

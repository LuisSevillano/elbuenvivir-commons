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
  excerpt: string;
}

interface ConceptDefinition {
  label: string;
  terms: string[];
  pattern?: string;
  difference?: string;
  risk?: string;
  tradeoff?: string;
  statutes?: string;
  rri?: string;
  decision?: string;
}

interface DetectedConcept extends ConceptDefinition {
  key: string;
  count: number;
  references: PackReference[];
}

interface TopicInsights {
  overview: string[];
  commonPatterns: string[];
  majorDifferences: string[];
  commonRisks: string[];
  commonTradeoffs: string[];
  detectedTensions: string[];
  usuallyInStatutes: string[];
  usuallyInRRI: string[];
  mixedApproaches: string[];
  notes: string[];
  minimalApproach: string[];
  flexibleApproach: string[];
  pointsToDecideSoon: string[];
  pointsThatCanWait: string[];
}

const root = process.cwd();
const packsDir = join(root, 'src/content/research-packs');
const referencesPath = join(root, 'src/content/generated/topic-references.json');
const taxonomyPath = join(root, 'taxonomy/topics.json');
const outputDir = join(root, 'src/content/generated/syntheses');
const maxProjects = 6;

const conceptsByCategory: Partial<Record<string, Record<string, ConceptDefinition>>> = {
  socios: {
    admision: {
      label: 'admisión de personas socias',
      terms: ['admision', 'alta', 'nueva persona socia', 'incorporacion', 'solicitud de ingreso'],
      pattern: 'Varios textos tratan la entrada de personas socias como un procedimiento que combina solicitud, aceptación y verificación de condiciones.',
      risk: 'Si no se aclaran los criterios de entrada, puede aparecer discrecionalidad o conflicto sobre quién puede incorporarse.',
      statutes: 'criterios básicos de admisión y derechos de las personas socias',
      rri: 'pasos internos de solicitud, acompañamiento y documentación de la incorporación',
      decision: 'definir qué criterios de entrada son imprescindibles y qué parte del proceso puede quedar como práctica revisable'
    },
    baja: {
      label: 'baja o salida de una persona socia',
      terms: ['baja voluntaria', 'baja obligatoria', 'baja justificada', 'baja no justificada', 'perdida de condicion de socio', 'salida'],
      pattern: 'Varios proyectos distinguen tipos de baja o pérdida de condición de persona socia.',
      difference: 'La diferencia práctica suele estar entre una salida libre con preaviso y una salida condicionada por incumplimientos, sustitución o efectos económicos.',
      risk: 'Una salida mal regulada puede tensionar la liquidez, el uso de espacios y la continuidad del grupo.',
      tradeoff: 'salida flexible vs estabilidad económica del proyecto',
      statutes: 'causas y clases de baja, pérdida de condición de socia y efectos económicos básicos',
      rri: 'procedimiento interno de comunicación, acompañamiento de salida y cierre de usos o llaves',
      decision: 'decidir si la salida tendrá preaviso, sustitución acordada, lista de espera o reembolso diferido'
    },
    expulsion: {
      label: 'expulsión o sanción',
      terms: ['expulsion', 'sancion', 'falta grave', 'falta muy grave', 'procedimiento sancionador'],
      pattern: 'Cuando aparece expulsión, suele vincularse a incumplimientos graves y a un procedimiento con garantías.',
      risk: 'Sin garantías mínimas, el régimen disciplinario puede convertirse en una fuente de impugnación o conflicto interno.',
      statutes: 'causas generales de expulsión, garantías y órgano competente',
      rri: 'tramitación concreta, plazos de audiencia y mediación previa cuando proceda',
      decision: 'decidir qué conflictos deben pasar por mediación antes de convertirse en sanción'
    },
    transmision: {
      label: 'transmisión de derechos',
      terms: ['transmision', 'transmitir', 'cesion', 'derechos de uso', 'derecho de uso'],
      pattern: 'Algunos textos conectan la salida con transmisión de derechos o sustitución por otra persona.',
      risk: 'Si la transmisión no se delimita, puede confundirse un derecho cooperativo con una compraventa privada.',
      statutes: 'límites generales a la transmisión de derechos societarios o de uso',
      rri: 'pasos de comunicación y coordinación con lista de espera o personas candidatas',
      decision: 'aclarar si la salida depende de encontrar sustituto o si la cooperativa gestiona directamente la entrada siguiente'
    },
    fallecimiento: {
      label: 'fallecimiento',
      terms: ['fallecimiento', 'defuncion', 'herederos', 'herencia', 'causahabiente'],
      pattern: 'Algunos documentos prevén efectos específicos cuando la pérdida de condición deriva de fallecimiento.',
      risk: 'Si no se prevé este caso, pueden aparecer tensiones entre derechos económicos, convivencia y expectativas familiares.',
      statutes: 'efectos básicos del fallecimiento sobre la condición de socia y derechos económicos',
      rri: 'acompañamiento práctico y gestión temporal del uso del espacio',
      decision: 'decidir cómo se coordinan herederos, continuidad del proyecto y uso de espacios'
    },
    derechos_obligaciones: {
      label: 'derechos y obligaciones',
      terms: ['derechos', 'obligaciones', 'deberes', 'participacion', 'informacion'],
      pattern: 'Los textos suelen combinar derechos de participación e información con obligaciones económicas y de convivencia.',
      risk: 'Una lista amplia pero poco operativa puede dificultar distinguir obligaciones esenciales de prácticas cotidianas.',
      statutes: 'derechos y obligaciones esenciales de las personas socias',
      rri: 'pautas cotidianas para hacer efectivos esos derechos y deberes',
      decision: 'separar obligaciones esenciales de compromisos prácticos revisables'
    }
  },
  economico: {
    aportacion_obligatoria: {
      label: 'aportación obligatoria',
      terms: ['aportacion obligatoria', 'aportaciones obligatorias', 'capital social obligatorio', 'aportacion inicial'],
      pattern: 'La aportación obligatoria aparece como una condición económica básica de pertenencia o participación.',
      difference: 'Algunos textos parecen tratarla como capital social estable y otros la conectan con cuotas, financiación o derechos de uso.',
      risk: 'Si la aportación se vincula a poder, uso o permanencia sin límites claros, puede generar desigualdad interna.',
      tradeoff: 'igualdad formal vs aportaciones económicas desiguales',
      statutes: 'importe, naturaleza, exigibilidad y criterios básicos de devolución de aportaciones obligatorias',
      rri: 'calendario de pagos, comunicación interna y gestión de incidencias de pago',
      decision: 'decidir si todas las personas aportan igual y cómo se evita que una diferencia económica genere privilegios'
    },
    aportacion_voluntaria: {
      label: 'aportación voluntaria',
      terms: ['aportacion voluntaria', 'aportaciones voluntarias'],
      pattern: 'Las aportaciones voluntarias aparecen como instrumento de financiación adicional diferenciado de la obligación básica.',
      risk: 'Pueden generar expectativas de retorno o influencia si no se separan claramente de los derechos políticos.',
      statutes: 'marco general para aportaciones voluntarias y ausencia de privilegios políticos',
      rri: 'canales de propuesta, registro y seguimiento interno',
      decision: 'decidir si habrá aportaciones voluntarias y cómo se documentarán sin alterar la igualdad cooperativa'
    },
    cuotas: {
      label: 'cuotas',
      terms: ['cuota', 'cuotas', 'cuota periodica', 'gastos comunes'],
      pattern: 'Las cuotas suelen aparecer como mecanismo periódico para sostener gastos comunes o funcionamiento ordinario.',
      risk: 'Si cuotas y aportaciones se mezclan, puede ser difícil distinguir inversión, gasto y retorno.',
      statutes: 'posibilidad general de cuotas y órgano que las aprueba',
      rri: 'periodicidad, forma de pago y gestión de retrasos',
      decision: 'separar claramente aportación al capital, cuotas de gasto y pagos por uso'
    },
    reembolso: {
      label: 'reembolso',
      terms: ['reembolso', 'devolucion', 'devolver', 'liquidacion', 'deduccion', 'deducciones'],
      pattern: 'La devolución de aportaciones aparece vinculada al reembolso y, en algunos casos, a deducciones o plazos.',
      difference: 'La diferencia práctica suele estar entre devolución inmediata, devolución condicionada por liquidez y devolución vinculada a nueva incorporación.',
      risk: 'Un reembolso inmediato puede tensionar la caja; un reembolso indefinido puede generar inseguridad para quien sale.',
      tradeoff: 'derecho de salida vs estabilidad financiera del proyecto',
      statutes: 'derecho de reembolso, criterios generales de deducción y plazos máximos',
      rri: 'calendario interno de pagos, documentación y seguimiento del acuerdo de devolución',
      decision: 'decidir qué ocurre si no hay liquidez suficiente para devolver aportaciones en el momento de la baja'
    },
    financiacion: {
      label: 'financiación',
      terms: ['financiacion', 'prestamo', 'credito', 'fondos', 'inversion'],
      pattern: 'Algunos textos conectan aportaciones y cuotas con necesidades de financiación del proyecto.',
      risk: 'La financiación puede desplazar decisiones de convivencia si no se separan necesidades económicas y derechos de participación.',
      statutes: 'principios generales de financiación y límites a privilegios económicos',
      rri: 'seguimiento presupuestario y comunicación periódica al grupo',
      decision: 'decidir cómo se informará al grupo sobre necesidades financieras sin crear jerarquías internas'
    }
  },
  convivencia: {
    conflictos: {
      label: 'conflictos y mediación',
      terms: ['conflicto', 'mediacion', 'convivencia', 'resolucion de conflictos', 'desacuerdo'],
      pattern: 'Los conflictos suelen aparecer asociados a convivencia, uso cotidiano y necesidad de procedimientos escalonados.',
      risk: 'Sin un cauce claro, desacuerdos pequeños pueden convertirse en conflictos societarios.',
      tradeoff: 'autonomía comunitaria vs necesidad de procedimiento claro',
      statutes: 'principios de convivencia y posibilidad de mediación o régimen disciplinario',
      rri: 'pasos de mediación, tiempos de respuesta y personas de referencia',
      decision: 'decidir qué conflictos se gestionan informalmente y cuáles requieren procedimiento escrito'
    },
    mantenimiento: {
      label: 'mantenimiento y cuidados del espacio',
      terms: ['mantenimiento', 'limpieza', 'obras', 'reparacion', 'conservacion'],
      pattern: 'Las reglas de mantenimiento suelen concretar responsabilidades de cuidado, limpieza u obras.',
      risk: 'Si las tareas comunes no se reparten con claridad, pueden concentrarse cargas invisibles.',
      statutes: 'obligación general de contribuir al cuidado y conservación',
      rri: 'turnos, avisos, criterios de obras y gestión de incidencias',
      decision: 'decidir cómo se reparten tareas y costes sin convertir cada detalle en norma rígida'
    }
  },
  uso_espacios: {
    espacios_comunes: {
      label: 'espacios comunes',
      terms: ['espacios comunes', 'zonas comunes', 'uso comun', 'espacio comun'],
      pattern: 'El uso de espacios comunes suele regularse mediante reglas prácticas de reserva, cuidado y prioridad de usos.',
      risk: 'La falta de criterios puede generar conflictos entre uso individual, uso comunitario e invitados.',
      tradeoff: 'uso flexible del espacio vs prevención de conflictos de convivencia',
      statutes: 'principio general de uso compartido y respeto a acuerdos comunitarios',
      rri: 'reservas, horarios, prioridades, limpieza y criterios de uso cotidiano',
      decision: 'decidir qué usos requieren reserva y cuáles se gestionan por convivencia ordinaria'
    },
    invitados: {
      label: 'invitados y pernoctas',
      terms: ['invitados', 'visitas', 'pernocta', 'pernoctas', 'estancias'],
      pattern: 'Las visitas e invitados suelen conectarse con reservas, pernoctas, uso de espacios y convivencia.',
      risk: 'Si no hay criterios, puede tensionarse el equilibrio entre hospitalidad, intimidad y disponibilidad de espacios.',
      statutes: 'principio general de compatibilidad entre uso privado, convivencia y espacios comunes',
      rri: 'avisos, límites de pernocta, reservas y responsabilidades de la persona anfitriona',
      decision: 'decidir si habrá límites de pernocta, aviso previo y responsabilidad por invitados'
    },
    menores_animales: {
      label: 'menores o animales',
      terms: ['menores', 'ninos', 'niñas', 'animales', 'mascotas'],
      pattern: 'Cuando aparecen menores o animales, suelen tratarse como casos de convivencia práctica y cuidado de espacios.',
      risk: 'No preverlos puede trasladar conflictos cotidianos a decisiones improvisadas.',
      statutes: 'principio general de convivencia y cuidado',
      rri: 'reglas prácticas, responsabilidades y usos compatibles',
      decision: 'decidir qué casos necesitan regla previa y cuáles pueden resolverse caso por caso'
    }
  },
  gobernanza: {
    asamblea: {
      label: 'asamblea',
      terms: ['asamblea', 'asamblea general', 'convocatoria', 'orden del dia'],
      pattern: 'La asamblea aparece como espacio principal de decisión, control y aprobación de cuestiones estructurales.',
      risk: 'Si no se delimitan competencias y convocatoria, pueden aparecer bloqueos o decisiones poco trazables.',
      statutes: 'competencias, convocatoria, quorum y mayorías esenciales',
      rri: 'preparación de reuniones, dinámica interna, actas y seguimiento de acuerdos',
      decision: 'decidir qué decisiones pasan siempre por asamblea y cuáles pueden delegarse'
    },
    consejo_rector: {
      label: 'consejo rector u órgano de gestión',
      terms: ['consejo rector', 'organo de administracion', 'administradores', 'representacion'],
      pattern: 'El órgano de gestión suele concentrar representación, ejecución de acuerdos y administración ordinaria.',
      risk: 'Una delegación poco controlada puede alejar decisiones cotidianas del grupo.',
      tradeoff: 'agilidad de gestión vs control colectivo',
      statutes: 'composición, mandato, competencias y rendición de cuentas',
      rri: 'formas de coordinación, comunicación interna y preparación de acuerdos',
      decision: 'decidir qué autonomía tendrá el órgano de gestión y cómo rendirá cuentas'
    },
    mayorias: {
      label: 'mayorías, consenso y bloqueo',
      terms: ['mayoria', 'consenso', 'unanimidad', 'bloqueo', 'quorum', 'voto', 'delegacion de voto'],
      pattern: 'Las decisiones suelen combinar reglas de mayoría con mecanismos de participación, quorum o consenso según la importancia del asunto.',
      difference: 'Algunos proyectos priorizan agilidad mediante mayorías; otros refuerzan consenso o unanimidad para decisiones sensibles.',
      risk: 'La unanimidad puede proteger acuerdos importantes pero también generar bloqueo; mayorías simples pueden dejar minorías expuestas.',
      tradeoff: 'consenso vs riesgo de bloqueo',
      statutes: 'quorum, mayorías reforzadas y decisiones que requieren protección especial',
      rri: 'facilitación, preparación de decisiones y mecanismos previos para evitar bloqueos',
      decision: 'decidir qué materias requieren consenso, mayoría reforzada o mayoría ordinaria'
    },
    modificacion: {
      label: 'modificación de normas',
      terms: ['modificacion de estatutos', 'modificacion del reglamento', 'reforma', 'modificar estatutos', 'modificar reglamento'],
      pattern: 'La modificación de Estatutos suele requerir más estabilidad que la adaptación del RRI.',
      risk: 'Si todo se lleva a Estatutos, cualquier aprendizaje posterior puede requerir reformas pesadas.',
      tradeoff: 'seguridad jurídica vs capacidad de aprendizaje',
      statutes: 'materias estructurales y procedimiento de reforma estatutaria',
      rri: 'detalles revisables y procedimientos de actualización interna',
      decision: 'decidir qué debe quedar estable y qué conviene poder ajustar con experiencia'
    }
  }
};

const conceptsByTopicSlug: Record<string, Record<string, ConceptDefinition>> = {
  baja_socio: {
    ...(conceptsByCategory.socios ?? {}),
    ...(conceptsByCategory.economico ?? {})
  },
  aportaciones_obligatorias: {
    ...(conceptsByCategory.economico ?? {}),
    ...(conceptsByCategory.socios ?? {})
  },
  uso_espacios_comunes: {
    ...(conceptsByCategory.uso_espacios ?? {}),
    ...(conceptsByCategory.convivencia ?? {})
  },
  toma_decisiones: {
    ...(conceptsByCategory.gobernanza ?? {})
  },
  estatutos_vs_rri: {
    ...(conceptsByCategory.gobernanza ?? {}),
    ...(conceptsByCategory.socios ?? {}),
    ...(conceptsByCategory.economico ?? {}),
    ...(conceptsByCategory.uso_espacios ?? {}),
    ...(conceptsByCategory.convivencia ?? {})
  }
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
      excerpt
    };
  }).filter((reference) => reference.excerpt.length > 0);
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

function referencesForTopic(slug: string, allReferences: GeneratedTopicReference[]): GeneratedTopicReference[] {
  return allReferences.filter((reference) => reference.topicSlug === slug);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function pick(items: string[], max: number): string[] {
  return unique(items).slice(0, max);
}

function conceptDictionaryForTopic(topic: TaxonomyTopic): Record<string, ConceptDefinition> {
  return {
    ...(conceptsByCategory[topic.category] ?? {}),
    ...(conceptsByTopicSlug[topic.slug] ?? {})
  };
}

function detectConcepts(references: PackReference[], conceptDictionary: Record<string, ConceptDefinition>): DetectedConcept[] {
  const detected: DetectedConcept[] = [];

  for (const [key, definition] of Object.entries(conceptDictionary)) {
    const matches = references.filter((reference) => {
      const text = normalize(`${reference.articleOrSection ?? ''} ${reference.excerpt}`);
      return definition.terms.some((term) => text.includes(normalize(term)));
    });

    if (matches.length > 0) {
      detected.push({ ...definition, key, count: matches.length, references: matches });
    }
  }

  return detected.toSorted((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
}

function summarizeDetectedConcepts(detected: DetectedConcept[], topic: TaxonomyTopic): string[] {
  if (detected.length === 0) {
    return [`No se han detectado suficientes extractos claros sobre ${topic.title.toLowerCase()}.`];
  }

  const topConcepts = detected.slice(0, 3).map((concept) => concept.label);
  const projects = unique(detected.flatMap((concept) => concept.references.map((reference) => reference.project ?? reference.documentTitle))).slice(0, 4);
  const overview = [`Los extractos más claros relacionan este tema con ${topConcepts.join(', ')}.`];

  if (projects.length > 1) {
    overview.push(`Aparecen ejemplos en varios proyectos, entre ellos ${projects.join(', ')}.`);
  }

  const concretePattern = detected.find((concept) => concept.pattern)?.pattern;
  if (concretePattern) {
    overview.push(concretePattern);
  }

  return overview.slice(0, 3);
}

function buildFallbackInsights(topic: TaxonomyTopic): TopicInsights {
  const limited = `No se han detectado suficientes extractos claros sobre ${topic.title.toLowerCase()}.`;
  return {
    overview: [limited, 'Conviene revisar manualmente los documentos antes de convertir esta cuestión en una cláusula.'],
    commonPatterns: [limited],
    majorDifferences: ['No hay base suficiente para comparar soluciones prácticas entre proyectos.'],
    commonRisks: ['El principal riesgo es regular con una base documental demasiado débil.'],
    commonTradeoffs: ['Conviene mantener abierto el equilibrio entre seguridad jurídica y aprendizaje progresivo.'],
    detectedTensions: ['Información limitada: conviene evitar conclusiones fuertes hasta revisar más extractos.'],
    usuallyInStatutes: ['Solo conviene llevar a Estatutos principios o derechos básicos si se confirman en revisión jurídica.'],
    usuallyInRRI: ['Los detalles operativos deberían esperar a contar con ejemplos más claros o acuerdos internos.'],
    mixedApproaches: ['No se detecta un enfoque mixto claro con la información disponible.'],
    notes: ['Evitar sobrerregular sin evidencia suficiente.', 'Separar principios estables de prácticas que puedan aprenderse con el uso.'],
    minimalApproach: ['Mantener una redacción mínima y prudente hasta revisar más documentos.'],
    flexibleApproach: ['Dejar los detalles operativos para acuerdos revisables.'],
    pointsToDecideSoon: ['Qué decisión concreta necesita seguridad desde el inicio.'],
    pointsThatCanWait: ['Detalles procedimentales o formularios internos.']
  };
}

function addTopicSpecificInsights(topic: TaxonomyTopic, detected: DetectedConcept[], insights: TopicInsights): TopicInsights {
  const keys = new Set(detected.map((concept) => concept.key));

  if (topic.slug === 'baja_socio') {
    if (keys.has('baja') && keys.has('reembolso')) {
      insights.commonPatterns.push('La salida aparece conectada con el reembolso de aportaciones y con efectos económicos que conviene fijar con claridad.');
      insights.pointsToDecideSoon.push('Decidir cómo se devuelve dinero si no hay liquidez suficiente en el momento de la baja.');
    }
    if (keys.has('transmision')) {
      insights.commonPatterns.push('Algunos textos conectan la salida con la entrada de una nueva persona socia o con transmisión de derechos.');
      insights.pointsToDecideSoon.push('Decidir si la baja depende de encontrar sustituto o si la cooperativa gestiona la sustitución.');
    }
    insights.usuallyInStatutes = pick([
      'causas y clases de baja',
      'efectos económicos básicos',
      'derecho de reembolso',
      'criterios generales de deducción y plazos',
      ...insights.usuallyInStatutes
    ], 6);
    insights.usuallyInRRI = pick([
      'procedimiento interno de solicitud o comunicación de baja',
      'acompañamiento de la salida',
      'gestión de sustitución o lista de espera',
      'reglas prácticas de entrega de llaves y cierre de uso',
      ...insights.usuallyInRRI
    ], 6);
  }

  if (topic.slug === 'aportaciones_obligatorias') {
    insights.commonTradeoffs.push('igualdad cooperativa vs necesidades reales de financiación');
    insights.pointsToDecideSoon.push('Decidir si habrá aportaciones desiguales y cómo se evita que generen privilegios.');
    insights.usuallyInStatutes = pick(['importe o criterio de cálculo de la aportación obligatoria', 'naturaleza de la aportación y derechos que no puede alterar', 'criterios de devolución o actualización', ...insights.usuallyInStatutes], 6);
    insights.usuallyInRRI = pick(['calendario de pagos', 'gestión interna de retrasos o fraccionamientos', 'comunicación presupuestaria al grupo', ...insights.usuallyInRRI], 6);
  }

  if (topic.slug === 'uso_espacios_comunes') {
    insights.commonTradeoffs.push('uso flexible de espacios vs prevención de conflictos cotidianos');
    insights.pointsToDecideSoon.push('Decidir qué usos requieren reserva, aviso previo o prioridad comunitaria.');
  }

  if (topic.slug === 'toma_decisiones') {
    insights.commonTradeoffs.push('consenso vs bloqueo');
    insights.pointsToDecideSoon.push('Decidir qué materias requieren consenso, mayoría reforzada o mayoría ordinaria.');
  }

  if (topic.slug === 'estatutos_vs_rri') {
    insights.commonTradeoffs.push('Estatutos mínimos vs sobrerregulación');
    insights.pointsToDecideSoon.push('Separar qué debe quedar estable de qué puede aprenderse y actualizarse en RRI.');
  }

  return {
    ...insights,
    commonPatterns: pick(insights.commonPatterns, 6),
    commonTradeoffs: pick(insights.commonTradeoffs, 6),
    pointsToDecideSoon: pick(insights.pointsToDecideSoon, 6),
    usuallyInStatutes: pick(insights.usuallyInStatutes, 6),
    usuallyInRRI: pick(insights.usuallyInRRI, 6)
  };
}

function buildTopicSpecificInsights(topic: TaxonomyTopic, references: PackReference[]): TopicInsights {
  const detected = detectConcepts(references, conceptDictionaryForTopic(topic));
  if (detected.length === 0 || references.length < 2) {
    return buildFallbackInsights(topic);
  }

  const patterns = detected.map((concept) => concept.pattern).filter((value): value is string => Boolean(value));
  const differences = detected.map((concept) => concept.difference).filter((value): value is string => Boolean(value));
  const risks = detected.map((concept) => concept.risk).filter((value): value is string => Boolean(value));
  const tradeoffs = detected.map((concept) => concept.tradeoff).filter((value): value is string => Boolean(value));
  const statutes = detected.map((concept) => concept.statutes).filter((value): value is string => Boolean(value));
  const rri = detected.map((concept) => concept.rri).filter((value): value is string => Boolean(value));
  const decisions = detected.map((concept) => concept.decision).filter((value): value is string => Boolean(value));

  const insights: TopicInsights = {
    overview: summarizeDetectedConcepts(detected, topic),
    commonPatterns: pick(patterns, 5),
    majorDifferences: pick(differences.length > 0 ? differences : ['Las diferencias prácticas dependen de si el proyecto prioriza reglas estables, procedimientos internos o soluciones caso por caso.'], 4),
    commonRisks: pick(risks.length > 0 ? risks : ['El riesgo principal es trasladar una solución de otro proyecto sin revisar su encaje económico, jurídico y convivencial.'], 5),
    commonTradeoffs: pick(tradeoffs.length > 0 ? tradeoffs : ['flexibilidad vs seguridad jurídica'], 5),
    detectedTensions: pick(tradeoffs.length > 0 ? tradeoffs : ['flexibilidad vs seguridad jurídica'], 5),
    usuallyInStatutes: pick(statutes.length > 0 ? statutes : ['principios, derechos u obligaciones básicas que deban ser estables'], 5),
    usuallyInRRI: pick(rri.length > 0 ? rri : ['procedimientos internos y detalles operativos que puedan revisarse con la experiencia'], 5),
    mixedApproaches: ['Se observa como enfoque prudente fijar criterios estables y dejar procedimientos cotidianos a normas revisables.'],
    notes: ['No conviene llevar a Estatutos detalles que el grupo necesite aprender o ajustar con la práctica.', 'La revisión jurídica debe confirmar qué materias exigen rango estatutario.'],
    minimalApproach: pick(['Fijar solo principios y efectos básicos que necesiten estabilidad.', 'Evitar copiar detalles operativos de otros proyectos sin comprobar su encaje.', ...decisions.slice(0, 2)], 4),
    flexibleApproach: pick(['Remitir procedimientos, calendarios y pautas cotidianas al RRI.', 'Mantener espacio para revisar la práctica tras los primeros usos reales.', ...decisions.slice(0, 2)], 4),
    pointsToDecideSoon: pick(decisions.length > 0 ? decisions : ['Qué parte del tema afecta a derechos u obligaciones básicas.', 'Qué detalle puede esperar a una norma interna revisable.'], 5),
    pointsThatCanWait: ['formularios internos', 'calendarios operativos', 'protocolos menores que no afecten derechos básicos']
  };

  return addTopicSpecificInsights(topic, detected, insights);
}

function referenceLabel(reference: PackReference): string {
  return reference.articleOrSection
    ? `${reference.documentTitle} - ${reference.articleOrSection}`
    : reference.documentTitle;
}

function projectName(reference: PackReference): string {
  return reference.project || reference.documentTitle;
}

function notableProjects(references: PackReference[], detected: DetectedConcept[]): GeneratedTopicSynthesis['notableProjects'] {
  const grouped = new Map<string, PackReference[]>();

  for (const reference of references) {
    const key = projectName(reference);
    grouped.set(key, [...(grouped.get(key) ?? []), reference]);
  }

  return [...grouped.entries()]
    .toSorted((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es'))
    .slice(0, maxProjects)
    .map(([name, projectReferences]) => {
      const relatedConcepts = detected
        .filter((concept) => concept.references.some((reference) => projectReferences.includes(reference)))
        .slice(0, 3)
        .map((concept) => concept.label);

      return {
        projectName: name,
        notableBecause: relatedConcepts.length > 0
          ? `Aparece en relación con ${relatedConcepts.join(', ')}.`
          : 'Aporta extractos útiles para comparar cómo se aborda esta cuestión.',
        references: projectReferences.slice(0, 5).map(referenceLabel)
      };
    });
}

function synthesize(topic: TaxonomyTopic, packPath: string, pack: string, topicReferences: GeneratedTopicReference[]): GeneratedTopicSynthesis {
  const references = parseReferences(pack);
  const documents = unique(references.map((reference) => reference.documentSlug)).toSorted();
  const detected = detectConcepts(references, conceptDictionaryForTopic(topic));
  const insights = buildTopicSpecificInsights(topic, references);

  return {
    slug: topic.slug,
    generatedAt: new Date().toISOString(),
    generatedFrom: {
      researchPack: packPath.replace(`${root}/`, ''),
      referencesCount: topicReferences.length || references.length,
      documents
    },
    summary: {
      overview: insights.overview,
      commonPatterns: insights.commonPatterns,
      majorDifferences: insights.majorDifferences,
      commonRisks: insights.commonRisks,
      commonTradeoffs: insights.commonTradeoffs
    },
    governancePlacement: {
      usuallyInStatutes: insights.usuallyInStatutes,
      usuallyInRRI: insights.usuallyInRRI,
      mixedApproaches: insights.mixedApproaches,
      notes: insights.notes
    },
    recommendationsForBuenVivir: {
      minimalApproach: insights.minimalApproach,
      flexibleApproach: insights.flexibleApproach,
      pointsToDecideSoon: insights.pointsToDecideSoon,
      pointsThatCanWait: insights.pointsThatCanWait
    },
    detectedTensions: insights.detectedTensions,
    notableProjects: notableProjects(references, detected),
    legalWarnings: [
      'Síntesis orientativa basada en extractos documentales detectados.',
      'No sustituye asesoramiento jurídico profesional.',
      'Debe contrastarse con los documentos originales antes de usarla en acuerdos o cláusulas.'
    ],
    generatedDisclaimer: 'Síntesis basada en documentos analizados. Requiere contraste con las fuentes originales y revisión jurídica antes de su uso.',
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

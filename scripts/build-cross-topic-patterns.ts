import * as fs from 'fs';
import * as path from 'path';

interface TopicReference {
  topicSlug: string;
  projectName?: string;
  documentType: string;
  confidence: string;
}

interface Topic {
  slug: string;
  title: string;
  status: string;
  keywords?: string[];
  aliases?: string[];
}

interface Synthesis {
  commonPatterns: string[];
  commonRisks: string[];
  commonTradeoffs: string[];
  majorDifferences: string[];
  detectedTensions: string[];
  usuallyInStatutes: string[];
  usuallyInRRI: string[];
}

interface Pattern {
  name: string;
  description: string;
  topics: string[];
  evidence: string;
  frequency: number;
}

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'src/content');
const generatedDir = path.join(contentDir, 'generated');
const taxonomyDir = path.join(rootDir, 'taxonomy');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJson(filepath: string): unknown {
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function detectTensions(syntheses: Map<string, Synthesis>): string[] {
  const tensionKeywords = [
    'flexibilidad',
    'rigidez',
    'seguridad',
    'bloqueo',
    'consenso',
    'mayoría',
    'igualdad',
    'desigualdad',
    'límite',
    'excepción',
    'complejidad',
    'simplicidad',
    'formal',
    'informal',
    'detallado',
    'mínimo'
  ];

  const tensions: Map<string, number> = new Map();

  for (const [topicSlug, synthesis] of syntheses) {
    if (synthesis.detectedTensions) {
      for (const tension of synthesis.detectedTensions) {
        const lower = tension.toLowerCase();
        for (const keyword of tensionKeywords) {
          if (lower.includes(keyword)) {
            tensions.set(tension, (tensions.get(tension) || 0) + 1);
          }
        }
      }
    }
  }

  return Array.from(tensions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tension]) => tension);
}

function detectOpposingApproaches(syntheses: Map<string, Synthesis>): Pattern[] {
  const patterns: Pattern[] = [];

  for (const [topicSlug, synthesis] of syntheses) {
    if (synthesis.majorDifferences && synthesis.majorDifferences.length > 0) {
      for (const diff of synthesis.majorDifferences) {
        const lower = diff.toLowerCase();
        if (
          (lower.includes('mínimo') && lower.includes('extenso')) ||
          (lower.includes('rígido') && lower.includes('flexible')) ||
          (lower.includes('formal') && lower.includes('informal')) ||
          (lower.includes('detallado') && lower.includes('general'))
        ) {
          patterns.push({
            name: diff.slice(0, 60) + (diff.length > 60 ? '...' : ''),
            description: diff,
            topics: [topicSlug],
            evidence: `Detectado en ${topicSlug}`,
            frequency: 1
          });
        }
      }
    }
  }

  return patterns.slice(0, 8);
}

function detectRecurringConcepts(syntheses: Map<string, Synthesis>): Pattern[] {
  const conceptCounts: Map<string, { count: number; topics: string[] }> = new Map();

  const conceptKeywords = [
    'consenso',
    'mayoría',
    'unanimidad',
    'bloqueo',
    'asistencia',
    'quórum',
    'aportación',
    'reembolso',
    ' baja',
    'exclusión',
    'convivencia',
    'uso',
    'espacio',
    'invitado',
    'cuidado',
    'permanencia',
    'temporal',
    'defunción',
    'herencia',
    'suspensión',
    'expulsión'
  ];

  for (const [topicSlug, synthesis] of syntheses) {
    const allText = [
      ...(synthesis.commonPatterns || []),
      ...(synthesis.commonRisks || []),
      ...(synthesis.commonTradeoffs || []),
      ...(synthesis.usuallyInStatutes || []),
      ...(synthesis.usuallyInRRI || [])
    ].join(' ').toLowerCase();

    for (const concept of conceptKeywords) {
      if (allText.includes(concept)) {
        const existing = conceptCounts.get(concept) || { count: 0, topics: [] };
        existing.count++;
        if (!existing.topics.includes(topicSlug)) {
          existing.topics.push(topicSlug);
        }
        conceptCounts.set(concept, existing);
      }
    }
  }

  return Array.from(conceptCounts.entries())
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([concept, data]) => ({
      name: concept.charAt(0).toUpperCase() + concept.slice(1),
      description: `Concepto recurrente en ${data.count} temas`,
      topics: data.topics,
      evidence: `Aparece en: ${data.topics.join(', ')}`,
      frequency: data.count
    }));
}

function main() {
  console.log('🔍 Detectando patrones transversales...\n');

  ensureDir(generatedDir);

  const taxonomyPath = path.join(taxonomyDir, 'topics.json');
  const referencesPath = path.join(generatedDir, 'topic-references.json');
  const synthesesDir = path.join(generatedDir, 'syntheses');

  const taxonomy = loadJson(taxonomyPath) as { topics: Topic[] };
  const references = loadJson(referencesPath) as { references: TopicReference[] };

  if (!taxonomy || !references) {
    console.error('❌ Faltan datos necesarios: taxonomy o references');
    process.exit(1);
  }

  const syntheses: Map<string, Synthesis> = new Map();

  if (fs.existsSync(synthesesDir)) {
    const files = fs.readdirSync(synthesesDir).filter(f => f.endsWith('.generated.json'));
    for (const file of files) {
      const topicSlug = file.replace('.generated.json', '');
      const synthesis = loadJson(path.join(synthesesDir, file)) as Synthesis;
      if (synthesis) {
        syntheses.set(topicSlug, synthesis);
      }
    }
  }

  console.log(`📊 Analizando ${syntheses.size} síntesis y ${references.references.length} referencias...`);

  const recurringConcepts = detectRecurringConcepts(syntheses);
  const detectedTensions = detectTensions(syntheses);
  const opposingApproaches = detectOpposingApproaches(syntheses);

  const projectNames = new Set<string>();
  for (const ref of references.references) {
    if (ref.projectName) projectNames.add(ref.projectName);
  }

  const projectTopics: Map<string, Set<string>> = new Map();
  for (const ref of references.references) {
    if (ref.projectName) {
      if (!projectTopics.has(ref.projectName)) {
        projectTopics.set(ref.projectName, new Set());
      }
      projectTopics.get(ref.projectName)!.add(ref.topicSlug);
    }
  }

  const commonClausePatterns: string[] = [];

  for (const synthesis of syntheses.values()) {
    if (synthesis.commonPatterns) {
      for (const pattern of synthesis.commonPatterns) {
        const lower = pattern.toLowerCase();
        if (
          lower.includes('plazo') ||
          lower.includes('plazos') ||
          lower.includes('procedimiento') ||
          lower.includes('causar') ||
          lower.includes('causa')
        ) {
          if (!commonClausePatterns.includes(pattern.slice(0, 80))) {
            commonClausePatterns.push(pattern.slice(0, 80));
          }
        }
      }
    }
  }

  const crossTopicPatterns = {
    generatedAt: new Date().toISOString(),
    sources: {
      topicsCount: taxonomy.topics.length,
      referencesCount: references.references.length,
      synthesesCount: syntheses.size,
      projectsCount: projectNames.size
    },
    recurringConcepts,
    detectedTensions,
    opposingApproaches,
    commonClausePatterns: commonClausePatterns.slice(0, 10)
  };

  const outputPath = path.join(generatedDir, 'cross-topic-patterns.json');
  fs.writeFileSync(outputPath, JSON.stringify(crossTopicPatterns, null, 2));

  console.log('\n✅ Patrones transversales generados:');
  console.log(`  - Conceptos recurrentes: ${recurringConcepts.length}`);
  console.log(`  - Tensiones detectadas: ${detectedTensions.length}`);
  console.log(`  - Enfoques opuestos: ${opposingApproaches.length}`);
  console.log(`  - Patrones de cláusulas: ${commonClausePatterns.length}`);

  console.log(`\n📁 Guardado en: ${outputPath}`);
}

main();
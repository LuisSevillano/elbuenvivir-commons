import * as fs from 'fs';
import * as path from 'path';

interface TopicReference {
  topicSlug: string;
  projectName?: string;
  documentTitle: string;
  documentType: string;
  jurisdiction?: string;
  excerpt: string;
  confidence: string;
  score: number;
}

interface Document {
  slug: string;
  title: string;
  type: string;
  projectName?: string;
  jurisdiction?: string;
  year?: number;
}

interface ProjectProfile {
  projectName: string;
  topics: string[];
  topicCount: number;
  documentTypes: string[];
  jurisdictions: string[];
  regulatoryTone: string;
  characteristics: string[];
  notes: string;
}

interface Synthesis {
  usuallyInStatutes: string[];
  usuallyInRRI: string[];
  commonPatterns: string[];
}

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'src/content');
const generatedDir = path.join(contentDir, 'generated');
const documentsDir = path.join(contentDir, 'documents');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJson(filepath: string): unknown {
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function inferRegulatoryTone(statutesCount: number, rriCount: number, patterns: string[]): string {
  const total = statutesCount + rriCount;
  if (total === 0) return 'Sin datos suficientes';

  const statutesRatio = statutesCount / total;

  if (statutesRatio > 0.7) {
    return 'Preferencia por regular en Estatutos (más rigidez)';
  } else if (statutesRatio < 0.3) {
    return 'Preferencia por regular en RRI (más flexibilidad)';
  } else if (statutesRatio > 0.4 && statutesRatio < 0.6) {
    return 'Equilibrio entre Estatutos y RRI';
  }

  return 'Enfoque equilibrado';
}

function detectCharacteristics(patterns: string[], excerpts: string[]): string[] {
  const characteristics: string[] = [];
  const allText = [...patterns, ...excerpts].join(' ').toLowerCase();

  if (allText.includes('unanimidad') || allText.includes('consenso')) {
    characteristics.push('Requiere consenso o unanimidad');
  }
  if (allText.includes('mayoría') && allText.includes('mayoría absoluta')) {
    characteristics.push('Usa mayoría cualificada');
  }
  if (allText.includes('plazo') && allText.includes('días')) {
    characteristics.push('Plazos definidos');
  }
  if (allText.includes('comisión') || allText.includes('comité')) {
    characteristics.push('Delegación en órganos');
  }
  if (allText.includes('voto') && allText.includes(' ponderado')) {
    characteristics.push('Voto ponderado por aportaciones');
  }
  if (allText.includes('invitado') || allText.includes('visita')) {
    characteristics.push('Regula acceso de visitantes');
  }
  if (allText.includes('cuidado') || allText.includes('depend')) {
    characteristics.push('Incluye consideraciones de cuidado');
  }
  if (allText.includes('compartido') || allText.includes('espacio')) {
    characteristics.push('Regula uso compartido de espacios');
  }
  if (allText.includes('reembolso') && allText.includes('baja')) {
    characteristics.push('Regula reembolso de aportaciones');
  }
  if (allText.includes('expulsión') || allText.includes('sanción')) {
    characteristics.push('Contiene régimen disciplinario');
  }

  return characteristics.slice(0, 6);
}

function main() {
  console.log('🔍 Generando perfiles de proyectos...\n');

  ensureDir(generatedDir);

  const referencesPath = path.join(generatedDir, 'topic-references.json');
  const documentsPath = path.join(documentsDir, 'documents.json');
  const synthesesDir = path.join(generatedDir, 'syntheses');

  const references = loadJson(referencesPath) as { references: TopicReference[] };
  const documents = loadJson(documentsPath) as { documents: Document[] };

  if (!references || !documents) {
    console.error('❌ Faltan datos necesarios: references o documents');
    process.exit(1);
  }

  const documentsMap = new Map<string, Document>();
  for (const doc of documents.documents) {
    documentsMap.set(doc.slug, doc);
  }

  const projectData: Map<string, {
    topics: Set<string>;
    documentTypes: Set<string>;
    jurisdictions: Set<string>;
    statutesCount: number;
    rriCount: number;
    patterns: string[];
    excerpts: string[];
  }> = new Map();

  for (const ref of references.references) {
    if (!ref.projectName) continue;

    if (!projectData.has(ref.projectName)) {
      projectData.set(ref.projectName, {
        topics: new Set(),
        documentTypes: new Set(),
        jurisdictions: new Set(),
        statutesCount: 0,
        rriCount: 0,
        patterns: [],
        excerpts: []
      });
    }

    const data = projectData.get(ref.projectName)!;
    data.topics.add(ref.topicSlug);
    data.documentTypes.add(ref.documentType);
    if (ref.jurisdiction) data.jurisdictions.add(ref.jurisdiction);
    if (ref.documentType === 'estatutos') data.statutesCount++;
    if (ref.documentType === 'rri') data.rriCount++;

    if (ref.excerpt && ref.excerpt.length > 20) {
      data.excerpts.push(ref.excerpt);
    }
  }

  const syntheses: Map<string, Synthesis> = new Map();
  if (fs.existsSync(synthesesDir)) {
    const files = fs.readdirSync(synthesesDir).filter(f => f.endsWith('.generated.json'));
    for (const file of files) {
      const topicSlug = file.replace('.generated.json', '');
      const synthesis = loadJson(path.join(synthesesDir, file)) as Synthesis;
      if (synthesis) syntheses.set(topicSlug, synthesis);
    }
  }

  for (const [projectName, data] of projectData) {
    for (const topic of data.topics) {
      const synthesis = syntheses.get(topic);
      if (synthesis?.commonPatterns) {
        data.patterns.push(...synthesis.commonPatterns.slice(0, 3));
      }
    }
  }

  const profiles: ProjectProfile[] = [];

  for (const [projectName, data] of projectData) {
    if (data.topics.size < 1) continue;

    const regulatoryTone = inferRegulatoryTone(data.statutesCount, data.rriCount, data.patterns);
    const characteristics = detectCharacteristics(data.patterns, data.excerpts);

    const jurisdictions = Array.from(data.jurisdictions);
    const topicList = Array.from(data.topics);
    const docTypes = Array.from(data.documentTypes);

    let notes = `Aparece en ${topicList.length} tema${topicList.length !== 1 ? 's' : ''}. `;

    if (jurisdictions.length > 0) {
      notes += `Jurisdicción${jurisdictions.length > 1 ? 'es' : ''}: ${jurisdictions.join(', ')}. `;
    }

    if (data.statutesCount > data.rriCount * 2) {
      notes += 'Tiende a regular más en Estatutos. ';
    } else if (data.rriCount > data.statutesCount * 2) {
      notes += 'Tiende a regular más en RRI. ';
    }

    if (characteristics.length > 2) {
      notes += 'Enfoque detallado detectado.';
    } else {
      notes += 'Enfoque general detectado.';
    }

    profiles.push({
      projectName,
      topics: topicList,
      topicCount: topicList.length,
      documentTypes: docTypes,
      jurisdictions,
      regulatoryTone,
      characteristics,
      notes
    });
  }

  profiles.sort((a, b) => b.topicCount - a.topicCount);

  const projectProfiles = {
    generatedAt: new Date().toISOString(),
    sources: {
      referencesCount: references.references.length,
      documentsCount: documents.documents.length,
      projectsDetected: profiles.length
    },
    projects: profiles
  };

  const outputPath = path.join(generatedDir, 'project-profiles.json');
  fs.writeFileSync(outputPath, JSON.stringify(projectProfiles, null, 2));

  console.log('✅ Perfiles de proyectos generados:');
  console.log(`  - Proyectos detectados: ${profiles.length}`);
  console.log(`  - Total temas relacionados: ${profiles.reduce((sum, p) => sum + p.topicCount, 0)}`);

  const toneCounts = profiles.reduce((acc, p) => {
    const key = p.regulatoryTone.split(' (')[0];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📊 Distribución de tono regulatorio:');
  for (const [tone, count] of Object.entries(toneCounts)) {
    console.log(`  - ${tone}: ${count}`);
  }

  console.log(`\n📁 Guardado en: ${outputPath}`);
}

main();
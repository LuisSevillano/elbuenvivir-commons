import { loadDrafts } from './loadDrafts';
import { loadDecisionModels } from './loadDecisionModels';
import { loadGeneratedReferences, loadTaxonomy, loadTopic, loadTopics } from './loadTopics';
import { loadSynthesis, loadSyntheses } from './loadSyntheses';
import type {
  ConsultableTopic,
  GeneratedTopicReference,
  GeneratedTopicSynthesis,
  GovernanceTopic,
  TaxonomyTopic
} from './types';

const researchPackModules = import.meta.glob<string>('/src/content/research-packs/*.md', {
  eager: true,
  import: 'default',
  query: '?raw'
});

function slugFromPath(path: string, suffix: string): string {
  const fileName = path.split('/').pop() ?? '';
  return fileName.endsWith(suffix) ? fileName.slice(0, -suffix.length) : fileName;
}

function toTitleFromSlug(slug: string): string {
  return slug
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readableTopicName(title: string): string {
  return title.charAt(0).toLowerCase() + title.slice(1);
}

function choosePlacement(
  synthesis?: GeneratedTopicSynthesis
): GovernanceTopic['governancePlacement']['recommendedPrimaryLocation'] {
  const statutes = synthesis?.governancePlacement.usuallyInStatutes.length ?? 0;
  const rri = synthesis?.governancePlacement.usuallyInRRI.length ?? 0;

  if (statutes > 0 && rri > 0) return 'mixed';
  if (statutes > 0) return 'estatutos';
  if (rri > 0) return 'rri';
  return 'case_by_case';
}

function availabilityBadge(hasSynthesis: boolean, referenceCount: number): ConsultableTopic['availabilityBadge'] {
  if (hasSynthesis && referenceCount >= 12) return 'Análisis amplio';
  if (referenceCount > 0 && referenceCount <= 3) return 'Pocas referencias';
  if (hasSynthesis || referenceCount > 3) return 'Análisis disponible';
  return 'Información limitada';
}

function buildFallbackTopic(
  slug: string,
  taxonomyTopic: TaxonomyTopic | undefined,
  synthesis: GeneratedTopicSynthesis | undefined,
  references: GeneratedTopicReference[]
): GovernanceTopic {
  const title = taxonomyTopic?.title ?? toTitleFromSlug(slug);
  const topicName = readableTopicName(title);
  const overview = synthesis?.summary.overview ?? [];
  const pointsToDecideSoon = synthesis?.recommendationsForBuenVivir.pointsToDecideSoon ?? [];
  const minimalApproach = synthesis?.recommendationsForBuenVivir.minimalApproach ?? [];
  const commonRisks = synthesis?.summary.commonRisks ?? [];
  const detectedTensions = synthesis?.detectedTensions ?? [];
  const legalWarnings = synthesis?.legalWarnings ?? [];
  const shouldBeInStatutes = synthesis?.governancePlacement.usuallyInStatutes ?? [];
  const shouldBeInRRI = synthesis?.governancePlacement.usuallyInRRI ?? [];
  const placementNotes = synthesis?.governancePlacement.notes ?? [];
  const firstDocuments = references
    .slice(0, 3)
    .map((reference) => reference.documentTitle)
    .filter(Boolean);

  return {
    slug,
    title,
    shortDescription:
      taxonomyTopic?.description ??
      overview[0] ??
      (references.length > 0
        ? `Análisis comparado sobre ${topicName} a partir de documentos relacionados y patrones detectados.`
        : `Tema consultable sobre ${topicName}, pendiente de ampliar con más referencias documentales.`),
    category: taxonomyTopic?.category ?? 'otros',
    minimumContents:
      overview.length > 0
        ? overview.slice(0, 5)
        : [
            `Qué conviene definir sobre ${topicName}.`,
            'Qué parte debe quedar en Estatutos, RRI o acuerdos internos.',
            'Qué referencias documentales ayudan a orientar la decisión.'
          ],
    legalBasis: [],
    projectReferences: [],
    decisionsForBuenVivir:
      pointsToDecideSoon.length > 0 || minimalApproach.length > 0
        ? [...pointsToDecideSoon, ...minimalApproach].slice(0, 7)
        : [
            `Acordar el alcance mínimo de ${topicName}.`,
            'Distinguir principios estables de procedimientos revisables.',
            'Contrastar las referencias antes de convertirlas en acuerdos.'
          ],
    risks:
      commonRisks.length > 0 || detectedTensions.length > 0 || legalWarnings.length > 0
        ? [...commonRisks, ...detectedTensions, ...legalWarnings].slice(0, 7)
        : ['Conviene revisar el encaje jurídico antes de aprobar una regla definitiva.'],
    governancePlacement: {
      recommendedPrimaryLocation: choosePlacement(synthesis),
      rationale:
        placementNotes.length > 0
          ? placementNotes
          : ['La ubicación depende de si la regla afecta a derechos básicos o a procedimientos cotidianos.'],
      shouldBeInStatutes:
        shouldBeInStatutes.length > 0
          ? shouldBeInStatutes
          : ['Principios, derechos y límites que necesiten estabilidad.'],
      shouldBeInRRI:
        shouldBeInRRI.length > 0
          ? shouldBeInRRI
          : ['Procedimientos prácticos y pautas revisables por la comunidad.'],
      canBeDeferredInitially:
        firstDocuments.length > 0
          ? [`Revisar con calma las referencias de ${firstDocuments.join(', ')}.`]
          : ['Detalles operativos que puedan aprenderse con la práctica.']
    },
    status: 'needs_legal_review'
  };
}

function mergeConsultableTopic(slug: string): ConsultableTopic {
  const curatedTopic = loadTopic(slug);
  const synthesis = loadSynthesis(slug);
  const references = loadGeneratedReferences(slug);
  const taxonomyTopic = loadTaxonomy().find((topic) => topic.slug === slug);
  const researchPackSlugs = new Set(
    Object.keys(researchPackModules).map((path) => slugFromPath(path, '.md'))
  );
  const draft = loadDrafts().find((item) => item.slug === slug);
  const baseTopic = curatedTopic ?? buildFallbackTopic(slug, taxonomyTopic, synthesis, references);
  const curatedReferenceCount = baseTopic.legalBasis.length + baseTopic.projectReferences.length;
  const documentSlugs = new Set(references.map((reference) => reference.documentSlug));
  const projectNames = new Set(references.map((reference) => reference.projectName).filter(Boolean));

  return {
    ...baseTopic,
    title: curatedTopic?.title ?? taxonomyTopic?.title ?? baseTopic.title,
    category: curatedTopic?.category ?? taxonomyTopic?.category ?? baseTopic.category,
    aliases: taxonomyTopic?.aliases ?? [],
    availability: {
      hasCuratedTopic: Boolean(curatedTopic),
      hasSynthesis: Boolean(synthesis),
      hasReferences: references.length > 0,
      hasResearchPack: researchPackSlugs.has(slug),
      hasDraft: Boolean(draft)
    },
    availabilityBadge: availabilityBadge(Boolean(synthesis), curatedReferenceCount + references.length),
    referenceCount: curatedReferenceCount + references.length,
    documentCount: documentSlugs.size,
    projectCount: projectNames.size
  };
}

export function loadConsultableTopics(): ConsultableTopic[] {
  const slugs = new Set<string>();

  for (const topic of loadTopics()) slugs.add(topic.slug);
  for (const synthesis of loadSyntheses()) slugs.add(synthesis.slug);
  for (const reference of loadGeneratedReferences()) slugs.add(reference.topicSlug);
  for (const model of loadDecisionModels()) slugs.add(model.topicSlug);
  for (const path of Object.keys(researchPackModules)) slugs.add(slugFromPath(path, '.md'));
  for (const draft of loadDrafts()) slugs.add(draft.slug);

  return Array.from(slugs)
    .filter((slug) => loadTaxonomy().find((topic) => topic.slug === slug)?.status !== 'merged')
    .map((slug) => mergeConsultableTopic(slug))
    .toSorted((a, b) => a.title.localeCompare(b.title, 'es'));
}

export function loadConsultableTopic(slug: string): ConsultableTopic | undefined {
  return loadConsultableTopics().find((topic) => topic.slug === slug);
}

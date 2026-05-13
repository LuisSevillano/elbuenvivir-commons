import type { DocumentType, TopicCategory, TopicStatus } from './types';

export const legalDisclaimer =
  'Esta herramienta es un apoyo documental y comparativo para la reflexión colectiva. No sustituye el asesoramiento jurídico profesional. Los textos sugeridos son borradores de trabajo y deben ser revisados por una persona experta antes de su aprobación.';

export const categoryLabels: Record<TopicCategory, string> = {
  identidad_juridica: 'Identidad jurídica',
  socios: 'Personas socias',
  economico: 'Economía y aportaciones',
  gobernanza: 'Gobernanza',
  convivencia: 'Convivencia',
  uso_espacios: 'Uso de espacios',
  disciplina: 'Disciplina',
  cuidados: 'Cuidados',
  ciclo_vida: 'Ciclo de vida',
  legal: 'Marco legal',
  otros: 'Otros'
};

export const documentTypeLabels: Record<DocumentType, string> = {
  ley: 'Ley',
  estatutos: 'Estatutos',
  rri: 'RRI',
  guia: 'Guía',
  modelo: 'Modelo',
  otro: 'Otro'
};

export const topicStatusLabels: Record<TopicStatus, string> = {
  draft: 'En revisión',
  reviewed: 'Revisado',
  needs_legal_review: 'Revisión jurídica recomendada'
};

export function placementLabel(value: string): string {
  const labels: Record<string, string> = {
    estatutos: 'Estatutos',
    rri: 'RRI',
    mixed: 'Mixto',
    case_by_case: 'Caso por caso'
  };

  return labels[value] ?? value;
}

export function relationshipLabel(value: string): string {
  const labels: Record<string, string> = {
    develops: 'Desarrolla',
    depends_on: 'Depende de',
    complements: 'Complementa',
    limits: 'Limita',
    operationalizes: 'Hace operativo',
    generates_tension_with: 'Genera tensión con'
  };

  return labels[value] ?? value;
}

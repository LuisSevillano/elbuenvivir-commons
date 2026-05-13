export interface ProjectProfile {
  projectName: string;
  topics: string[];
  topicCount: number;
  documentTypes: string[];
  jurisdictions: string[];
  regulatoryTone: string;
  characteristics: string[];
  notes: string;
}

export interface ProjectProfiles {
  generatedAt: string;
  sources: {
    referencesCount: number;
    documentsCount: number;
    projectsDetected: number;
  };
  projects: ProjectProfile[];
}

const profileModule = import.meta.glob<ProjectProfiles>('/src/content/generated/project-profiles.json', {
  eager: true,
  import: 'default'
});

export function loadProjectProfiles(): ProjectProfiles | null {
  const paths = Object.keys(profileModule);
  if (paths.length === 0) return null;
  return profileModule[paths[0]] ?? null;
}
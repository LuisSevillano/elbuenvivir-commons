import { error } from '@sveltejs/kit';
import { loadCrossTopicPatterns } from '$lib/content/loadPatterns';
import { loadProjectProfiles } from '$lib/content/loadProjectProfiles';

export function load() {
  let patterns = null;
  let profiles = null;

  try {
    patterns = loadCrossTopicPatterns();
  } catch (e) {
    console.warn('No se pudieron cargar los patrones transversales');
  }

  try {
    profiles = loadProjectProfiles();
  } catch (e) {
    console.warn('No se pudieron cargar los perfiles de proyectos');
  }

  if (!patterns && !profiles) {
    error(404, 'No hay datos de patrones disponibles. Ejecuta build:patterns y build:project-profiles.');
  }

  return {
    patterns,
    profiles
  };
}
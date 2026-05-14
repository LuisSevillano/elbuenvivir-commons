import { error } from '@sveltejs/kit';
import { loadCrossTopicPatterns } from '$lib/content/loadPatterns';
import { loadProjectProfiles } from '$lib/content/loadProjectProfiles';
import { buildSeo, withBrand } from '$lib/seo';

export const prerender = false;

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
    seo: buildSeo({
      title: withBrand('Patrones de gobernanza cooperativa'),
      description:
        'Cartografía de patrones, tensiones y enfoques comparados detectados en documentos de proyectos cooperativos.',
      path: '/patrones'
    }),
    patterns,
    profiles
  };
}

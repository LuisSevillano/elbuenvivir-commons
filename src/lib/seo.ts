import { getDocumentDisplayTitle, getDocumentSummary } from '$lib/content/documentDisplay';
import type { ConsultableTopic, SourceDocument } from '$lib/content/types';

export const siteUrl = 'https://elbuenvivir-commons.netlify.app';
export const siteName = 'El Buen Vivir Commons';
export const defaultSocialImage = '/thumbnail-og.jpg';
export const defaultSocialImageAlt = 'Casa rural entre vegetacion, con camino de tierra y montanas al fondo.';

export interface SeoMetadata {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
}

export const defaultSeo: SeoMetadata = {
  title: `${siteName} | Nuestras reglas, nuestro Buen Vivir`,
  description:
    'La mesa de trabajo de la cooperativa El Buen Vivir: tema a tema, qué exige la ley, cómo lo resolvieron otras cooperativas y una propuesta redactada para nosotras, con las fuentes siempre a la vista.',
  path: '/',
  image: defaultSocialImage,
  imageAlt: defaultSocialImageAlt,
  type: 'website'
};

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return new URL(path, siteUrl).toString();
}

export function withBrand(title: string): string {
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}

// La marca ya viaja en og:site_name; en las páginas de detalle el título
// gana más contexto indicando la sección ("Derechos y obligaciones | Temas").
export function withSection(title: string, section: string): string {
  return `${title} | ${section}`;
}

export function compactDescription(value: string, fallback = defaultSeo.description): string {
  const normalized = value.replace(/\s+/g, ' ').trim() || fallback;

  if (normalized.length <= 158) {
    return normalized;
  }

  return `${normalized.slice(0, 155).trim().replace(/[,.]$/, '')}...`;
}

export function buildSeo(metadata: SeoMetadata): SeoMetadata {
  return {
    ...defaultSeo,
    ...metadata,
    title: metadata.title,
    description: compactDescription(metadata.description)
  };
}

export function topicSeo(topic: ConsultableTopic): SeoMetadata {
  return buildSeo({
    title: withSection(topic.title, 'Temas'),
    description: compactDescription(
      `${topic.shortDescription} Qué dice la ley, cómo lo resolvieron otras cooperativas y nuestra propuesta.`
    ),
    path: `/temas/${topic.slug}`,
    type: 'article'
  });
}

export function documentSeo(document: SourceDocument): SeoMetadata {
  const title = getDocumentDisplayTitle(document);
  const summary = document.notes ?? getDocumentSummary(document);

  return buildSeo({
    title: withSection(title, 'Documentos'),
    description: compactDescription(`${summary} Documento de referencia para fundamentar los Estatutos y el RRI de El Buen Vivir.`),
    path: `/documentos/${document.slug}`,
    type: 'article'
  });
}

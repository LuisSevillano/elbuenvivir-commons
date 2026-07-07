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
  title: `${siteName} | Atlas de gobernanza cooperativa`,
  description:
    'Atlas comparado para diseñar estatutos, RRI y acuerdos de convivencia en cooperativas de vivienda: temas, patrones y documentos de referencia.',
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
    title: withBrand(topic.title),
    description: compactDescription(
      `${topic.shortDescription} Compara decisiones, modelos de solución y ubicación entre Estatutos y RRI.`
    ),
    path: `/temas/${topic.slug}`,
    type: 'article'
  });
}

export function documentSeo(document: SourceDocument): SeoMetadata {
  const title = getDocumentDisplayTitle(document);
  const summary = document.notes ?? getDocumentSummary(document);

  return buildSeo({
    title: withBrand(title),
    description: compactDescription(`${summary} Documento fuente del atlas comparado de gobernanza cooperativa.`),
    path: `/documentos/${document.slug}`,
    type: 'article'
  });
}

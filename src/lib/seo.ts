import { getDocumentDisplayTitle, getDocumentSummary } from '$lib/content/documentDisplay';
import type { ConsultableTopic, SourceDocument } from '$lib/content/types';
import ogManifest from './og/manifest.json';

// Solo apuntamos a la imagen por-página si realmente se ha generado (está en el
// manifiesto). Si no, se cae a la imagen por defecto en vez de a un 404.
// El manifiesto lo reescribe `pnpm og:gen`.
type OgKind = 'temas' | 'documentos' | 'paginas';

function hasOgImage(kind: OgKind, slug: string): boolean {
  return (ogManifest[kind] as string[]).includes(slug);
}

// Imagen para páginas sueltas (índices, borrador). Devuelve {} si aún no se ha
// generado, de modo que se cae a la imagen por defecto.
export function pageOgImage(
  name: string,
  alt: string
): Pick<SeoMetadata, 'image' | 'imageAlt'> | Record<string, never> {
  return hasOgImage('paginas', name)
    ? { image: `/og/paginas/${name}.jpg`, imageAlt: alt }
    : {};
}

export const siteUrl = 'https://elbuenvivir-commons.netlify.app';
export const siteName = 'La Wiki de El Buen Vivir';
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
    ...(hasOgImage('temas', topic.slug)
      ? {
          image: `/og/temas/${topic.slug}.jpg`,
          imageAlt: `Tarjeta del tema «${topic.title}» de El Buen Vivir.`
        }
      : {}),
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
    ...(hasOgImage('documentos', document.slug)
      ? {
          image: `/og/documentos/${document.slug}.jpg`,
          imageAlt: `Tarjeta del documento «${title}» de El Buen Vivir.`
        }
      : {}),
    type: 'article'
  });
}

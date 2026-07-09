// Datos compartidos para las tarjetas OG: el código de color por sección y las
// tarjetas de las páginas que no son detalle (índices, borrador). Se usa desde
// /og-preview (render) y desde /og-preview/data.json (lista a generar).

// Mismos valores que --accent-temas / --accent-docs en src/styles.css.
export const OG_ACCENTS = {
  temas: '#b8763b',
  documentos: '#6f7a4f'
} as const;

export interface OgCardData {
  eyebrow: string;
  title: string;
  supporting: string;
  footer: string;
  chip: string;
  accent: string;
}

const SITE = 'elbuenvivir-commons.netlify.app';

// Páginas sueltas (no detalle) que también tienen su propia imagen al compartir.
export const OG_PAGES: Record<string, OgCardData> = {
  temas: {
    eyebrow: 'EL BUEN VIVIR',
    title: 'Todos los temas',
    supporting: 'Qué exige la ley, cómo lo hacen otras cooperativas y una propuesta para cada tema.',
    footer: SITE,
    chip: 'Temas',
    accent: OG_ACCENTS.temas
  },
  borrador: {
    eyebrow: 'EL BUEN VIVIR',
    title: 'Borrador de Estatutos y RRI',
    supporting: 'El articulado completo, reunido y listo para llevar a Google Docs.',
    footer: SITE,
    chip: 'Borrador',
    accent: OG_ACCENTS.temas
  }
};

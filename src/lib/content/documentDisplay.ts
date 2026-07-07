import type { SourceDocument } from './types';

const PROJECT_NAME_OVERRIDES: Record<string, string> = {
  elciempies: 'El Ciempiés',
  laseronda: 'La Seronda',
  losnidales: 'Los Nidales',
  pequenopueblo: 'Pequeño Pueblo',
  tarocohousing: 'Taro Cohousing',
  tejiendovida: 'Tejiendo Vida',
  vallecas2homes: 'Vallecas 2 Homes'
};

const DOCUMENT_TITLE_OVERRIDES: Record<string, string> = {
  'docs-guias-guia-introduccion-al-cohousing-senior-2019-4': 'Guía de introducción al cohousing senior',
  'docs-guias-guia-redaccion-estatutos-de-cooperativas-de-cohousing-senior-2024':
    'Guía para redactar estatutos de cooperativas de cohousing senior',
  'docs-guias-las-gui-as-de-sostre-ci-vic': 'Guías de Sostre Cívic',
  'docs-leyes-normativa-autonomica': 'Normativa autonómica',
  'docs-leyes-normativa-estatal': 'Normativa estatal',
  'docs-otros-articulo-el-reglamento-de-regimen-interno-de-la-cooperativa':
    'Artículo sobre el Reglamento de Régimen Interno de la cooperativa',
  'docs-otros-mod-estatutos-coop-viviendas': 'Modelo de estatutos para cooperativas de viviendas',
  'docs-otros-modelo-estatutos-viviendas': 'Modelo de estatutos de viviendas',
  'docs-rri-ejemplo-de-reglamento-de-regimen-interno-para-viviendas-cooperativas-en-cesion-de-uso':
    'RRI para viviendas cooperativas en cesión de uso',
  'docs-rri-informe-cooperativas-cesion-de-uso': 'Informe sobre cooperativas en cesión de uso',
  'docs-leyes-otras-leyes-decretos-modificaciones-bocyl-d-05012005-1-decreto-125-2004':
    'Decreto 125/2004 (BOCYL)',
  'docs-leyes-otras-leyes-decretos-modificaciones-bocyl-d-10022005-1-resolucion-31-enero-2005':
    'Resolución de 31 de enero de 2005 (BOCYL)',
  'docs-leyes-otras-leyes-decretos-modificaciones-bocyl-d-10102022-1-decreto-41-2022':
    'Decreto 41/2022 (BOCYL)',
  'docs-leyes-otras-leyes-decretos-modificaciones-boe-a-1990-30735-ley-20-1990':
    'Ley 20/1990, de régimen fiscal de cooperativas (BOE)',
  'docs-leyes-otras-leyes-decretos-modificaciones-boe-a-2004-3634-rd-296-2004':
    'Real Decreto 296/2004 (BOE)',
  'docs-leyes-otras-leyes-decretos-modificaciones-boe-a-2007-19884-consolidado-rd-1514-2007':
    'Real Decreto 1514/2007, Plan General de Contabilidad (BOE)',
  'docs-leyes-otras-leyes-decretos-modificaciones-boe-a-2010-20034-orden-eha-3360-2010':
    'Orden EHA/3360/2010, sobre contabilidad de cooperativas (BOE)',
  'docs-leyes-otras-leyes-decretos-modificaciones-boe-a-2011-18204-ley-6-2011': 'Ley 6/2011 (BOE)',
  'docs-leyes-otras-leyes-decretos-modificaciones-boe-a-2013-8555-ley-13-2013': 'Ley 13/2013 (BOE)',
  'docs-leyes-otras-leyes-decretos-modificaciones-boe-a-2014-9959-ley-5-2014': 'Ley 5/2014 (BOE)'
};

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase('es');
      return `${lower.charAt(0).toLocaleUpperCase('es')}${lower.slice(1)}`;
    })
    .join(' ');
}

function cleanProjectName(value: string): string {
  const key = value.toLocaleLowerCase('es').replace(/[^a-z0-9]/g, '');
  return PROJECT_NAME_OVERRIDES[key] ?? titleCase(value.replace(/[._-]+/g, ' '));
}

export function getDocumentProjectName(document: SourceDocument): string | undefined {
  if (document.projectName && !document.projectName.toLocaleLowerCase('es').includes('otras leyes')) {
    return document.projectName;
  }

  const fileStem = document.fileName.replace(/\.pdf$/i, '');
  const projectName = fileStem
    .replace(/^(estatutos|rri)[_ -]+/i, '')
    .replace(/[_-]asociacion$/i, '')
    .replace(/^senior[_ -]+cohousing[_ -]+/i, 'Senior Cohousing ')
    .trim();

  if (!projectName || projectName === fileStem) return undefined;
  return cleanProjectName(projectName);
}

export function getDocumentDisplayTitle(document: SourceDocument): string {
  if (DOCUMENT_TITLE_OVERRIDES[document.slug]) return DOCUMENT_TITLE_OVERRIDES[document.slug];

  const projectName = getDocumentProjectName(document);
  if (document.type === 'rri' && projectName) return `RRI ${projectName}`;
  if (document.type === 'estatutos' && projectName) return `Estatutos ${projectName}`;

  return document.title
    .replace(/\+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\bRri\b/g, 'RRI')
    .trim();
}

export function getDocumentSummary(document: SourceDocument): string {
  const projectName = getDocumentProjectName(document);

  if (document.type === 'rri' && projectName) {
    return `Reglamento de Régimen Interno de ${projectName}.`;
  }

  if (document.type === 'estatutos' && projectName) {
    return `Estatutos sociales de ${projectName}.`;
  }

  if (document.type === 'guia') {
    return 'Guía de apoyo para cooperativas, cohousing y procesos de organización interna.';
  }

  if (document.type === 'ley') {
    return 'Marco normativo usado como referencia para contrastar límites y obligaciones legales.';
  }

  if (document.tags.includes('estatutos')) {
    return 'Modelo o material de apoyo para preparar estatutos de cooperativas de vivienda.';
  }

  if (document.tags.includes('rri')) {
    return 'Material de referencia sobre reglamentos internos y organización cooperativa.';
  }

  return 'Documento de apoyo para la comparación de soluciones de gobernanza cooperativa.';
}

import documents from '$content/documents/documents.json';
import { getDocumentDisplayTitle } from './documentDisplay';
import type { SourceDocument } from './types';

export function loadDocuments(): SourceDocument[] {
  return (documents as SourceDocument[]).toSorted((a, b) =>
    getDocumentDisplayTitle(a).localeCompare(getDocumentDisplayTitle(b), 'es')
  );
}

export function loadDocument(slug: string): SourceDocument | undefined {
  return loadDocuments().find((document) => document.slug === slug);
}

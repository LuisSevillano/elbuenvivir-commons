import documents from '$content/documents/documents.json';
import type { SourceDocument } from './types';

export function loadDocuments(): SourceDocument[] {
  return (documents as SourceDocument[]).toSorted((a, b) => a.title.localeCompare(b.title, 'es'));
}

export function loadDocument(slug: string): SourceDocument | undefined {
  return loadDocuments().find((document) => document.slug === slug);
}

import documents from '$content/documents/documents.json';
import driveLinks from '$content/document-links/google-drive-links.json';
import { getDocumentDisplayTitle } from './documentDisplay';
import type { SourceDocument } from './types';

type DriveLinksMap = Record<string, { fileId: string }>;

function enrichDocument(doc: SourceDocument): SourceDocument {
  const links = driveLinks as DriveLinksMap;
  const entry = links[doc.slug];

  if (entry?.fileId) {
    return {
      ...doc,
      googleDriveFileId: entry.fileId,
      googleDriveUrl: `https://drive.google.com/file/d/${entry.fileId}/view`,
      previewUrl: `https://drive.google.com/file/d/${entry.fileId}/preview`
    };
  }

  return doc;
}

export function loadDocuments(): SourceDocument[] {
  return (documents as SourceDocument[]).map(enrichDocument).toSorted((a, b) =>
    getDocumentDisplayTitle(a).localeCompare(getDocumentDisplayTitle(b), 'es')
  );
}

export function loadDocument(slug: string): SourceDocument | undefined {
  return loadDocuments().find((document) => document.slug === slug);
}

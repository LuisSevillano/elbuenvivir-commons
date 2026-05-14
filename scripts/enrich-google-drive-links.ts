import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const documentsPath = resolve(root, 'src/content/documents/documents.json');
const driveLinksPath = resolve(root, 'src/content/document-links/google-drive-links.json');

interface DriveLinkEntry {
  fileId: string;
}

interface DriveLinksMap {
  [slug: string]: DriveLinkEntry;
}

interface SourceDocument {
  slug: string;
  title: string;
  fileName: string;
  sourcePath: string;
  type: string;
  [key: string]: unknown;
}

function main() {
  const documents: SourceDocument[] = JSON.parse(readFileSync(documentsPath, 'utf-8'));
  const driveLinks: DriveLinksMap = JSON.parse(readFileSync(driveLinksPath, 'utf-8'));

  const linkedSlugs = Object.keys(driveLinks).filter((slug) => driveLinks[slug].fileId.length > 0);
  const documentSlugs = new Set(documents.map((doc) => doc.slug));

  let linked = 0;
  let skipped = 0;
  const orphaned: string[] = [];

  for (const slug of linkedSlugs) {
    if (!documentSlugs.has(slug)) {
      orphaned.push(slug);
    }
  }

  const enriched = documents.map((doc) => {
    const entry = driveLinks[doc.slug];
    if (entry && entry.fileId.length > 0) {
      linked++;
      return {
        ...doc,
        googleDriveFileId: entry.fileId,
        googleDriveUrl: `https://drive.google.com/file/d/${entry.fileId}/view`,
        previewUrl: `https://drive.google.com/file/d/${entry.fileId}/preview`
      };
    }
    skipped++;
    return doc;
  });

  writeFileSync(documentsPath, JSON.stringify(enriched, null, 2) + '\n');

  console.log('\n=== Enrich Google Drive Links ===');
  console.log(`Documentos totales: ${documents.length}`);
  console.log(`Documentos enlazados: ${linked}`);
  console.log(`Documentos sin enlace: ${skipped}`);
  if (orphaned.length > 0) {
    console.log(`Mappings huérfanos: ${orphaned.length}`);
    for (const slug of orphaned) {
      console.log(`  - ${slug}`);
    }
  } else {
    console.log('Mappings huérfanos: 0');
  }
  console.log('================================\n');
}

main();

import { loadDocuments } from '$lib/content/loadDocuments';

export function load() {
  return {
    documents: loadDocuments()
  };
}

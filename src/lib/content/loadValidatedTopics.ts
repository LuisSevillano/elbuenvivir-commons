import type { EditorialReview, ValidatedTopic } from './types';

type RawValidatedTopic = Omit<ValidatedTopic, 'slug'> & { slug?: string };

const validatedTopicModules = import.meta.glob<RawValidatedTopic>('/src/content/validated-topics/*.json', {
  eager: true,
  import: 'default'
});

const editorialReviewModules = import.meta.glob<string>('/src/content/editorial-reviews/*.md', {
  eager: true,
  import: 'default',
  query: '?raw'
});

function slugFromPath(path: string, suffix: string): string {
  const fileName = path.split('/').pop() ?? '';
  return fileName.endsWith(suffix) ? fileName.slice(0, -suffix.length) : fileName;
}

function normalizeValidatedTopic(path: string, topic: RawValidatedTopic): ValidatedTopic {
  return {
    ...topic,
    slug: topic.slug ?? slugFromPath(path, '.json')
  };
}

export function loadValidatedTopics(): ValidatedTopic[] {
  return Object.entries(validatedTopicModules)
    .map(([path, topic]) => normalizeValidatedTopic(path, topic))
    .toSorted((a, b) => a.slug.localeCompare(b.slug, 'es'));
}

export function loadValidatedTopic(slug: string): ValidatedTopic | undefined {
  return loadValidatedTopics().find((topic) => topic.slug === slug);
}

export function loadEditorialReviews(): EditorialReview[] {
  return Object.entries(editorialReviewModules)
    .map(([path, content]) => ({
      slug: slugFromPath(path, '.md'),
      content
    }))
    .toSorted((a, b) => a.slug.localeCompare(b.slug, 'es'));
}

export function loadEditorialReview(slug: string): EditorialReview | undefined {
  return loadEditorialReviews().find((review) => review.slug === slug);
}

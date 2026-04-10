import type { NewsItem } from '../store';

export type EntryKind = 'news' | 'pleinair';

interface SerializedEntryContent {
  body?: string;
  kind?: EntryKind;
  gallery?: string[];
}

const isEntryKind = (value: unknown): value is EntryKind => value === 'news' || value === 'pleinair';

export const parseEntryContent = (content: string): SerializedEntryContent => {
  const trimmed = content.trim();
  if (!trimmed) {
    return { body: '', kind: 'news', gallery: [] };
  }

  if (!trimmed.startsWith('{')) {
    return { body: content, kind: 'news', gallery: [] };
  }

  try {
    const parsed = JSON.parse(trimmed) as SerializedEntryContent;
    return {
      body: typeof parsed.body === 'string' ? parsed.body : '',
      kind: isEntryKind(parsed.kind) ? parsed.kind : 'news',
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [],
    };
  } catch {
    return { body: content, kind: 'news', gallery: [] };
  }
};

export const serializeEntryContent = ({
  body,
  kind,
  gallery,
}: {
  body: string;
  kind: EntryKind;
  gallery: string[];
}) =>
  JSON.stringify({
    body: body.trim(),
    kind,
    gallery: gallery.filter(Boolean),
  });

export const getEntryKind = (item: NewsItem): EntryKind => parseEntryContent(item.content).kind ?? 'news';

export const getEntryBody = (item: NewsItem) => parseEntryContent(item.content).body ?? '';

export const getEntryGallery = (item: NewsItem) => {
  const { gallery } = parseEntryContent(item.content);
  const images = [item.image, ...(gallery ?? [])].filter((image): image is string => Boolean(image?.trim()));
  return [...new Set(images)];
};

export const getEntryPreviewImage = (item: NewsItem) => getEntryGallery(item)[0] ?? '';

export const getEntryTitle = (item: NewsItem) => {
  const title = item.title.trim();
  if (title) {
    return title;
  }

  return getEntryKind(item) === 'pleinair' ? 'Пленер сообщества' : 'Новость сообщества';
};

export const getEntrySummary = (item: NewsItem) => {
  const body = getEntryBody(item).trim();
  if (body) {
    return body;
  }

  const imageCount = getEntryGallery(item).length;
  if (imageCount > 1) {
    return `Внутри ${imageCount} фотографий с события.`;
  }

  if (imageCount === 1) {
    return 'Открыть новость и посмотреть изображение.';
  }

  return 'Открыть подробности.';
};

export const getEntryImageCount = (item: NewsItem) => getEntryGallery(item).length;

export const formatEntryDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const sortEntriesByDate = <T extends { date: string }>(items: T[]) =>
  [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

export const toDateTimeInputValue = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const timezoneOffset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const fromDateTimeInputValue = (value: string) => {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
};

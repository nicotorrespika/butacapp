import type { SearchFilter, SearchResponse, SearchResult } from './media';
import { normalizeTaste, workTags } from './tastes';

/** Search is a weak interest, never a rating, favorite or consumed state. */
export function searchTaste(query: string, filter: SearchFilter, response?: SearchResponse) {
  const title = query.trim().replace(/\s+/g, ' ').slice(0, 120);
  if (title.length < 2) return null;
  const normalized = normalizeTaste(title);
  const matches = response ? [...response.movie, ...response.music, ...response.book]
    .filter(r => normalizeTaste(r.title) === normalized || r.creator?.split(' · ').some(c => normalizeTaste(c) === normalized)).slice(0, 1) : [];
  const people = response?.people.filter(p => normalizeTaste(p.name) === normalized) ?? [];
  return {
    k: `search:${filter}:${normalized}`,
    cat: filter === 'art' ? 'event' : filter,
    src: 'search', eid: '', work_title: title,
    work_tags: [...new Set([title, ...matches.flatMap(r => workTags(r)), ...people.map(p => p.name)])].slice(0, 30),
    points: 0.5, is_excluded: false,
  };
}

export function searchOpenTaste(result: SearchResult) {
  return {
    k: `search-open:${result.source}:${result.externalId}`,
    cat: result.mediaType === 'art' ? 'event' : result.mediaType,
    src: result.source, eid: result.externalId, work_title: result.title,
    work_tags: [result.title, ...workTags(result)].slice(0, 30),
    points: 2, is_excluded: false,
  };
}
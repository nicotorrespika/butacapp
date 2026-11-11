import type { SearchResult } from './media';
import { tasteKey } from './tastes';

export type ShelfCategory = 'movie' | 'music' | 'book';
export type ShelfAnchor = { source: string; externalId: string; title: string; creator: string | null; favorite: boolean; consumed: boolean };
export function chooseShelfAnchor(rows: ShelfAnchor[]) {
  return rows.find(r => r.favorite) ?? rows.find(r => r.consumed) ?? null;
}
export function shelfTitle(category: ShelfCategory, anchor: ShelfAnchor) {
  if (anchor.favorite) return `Porque te gusta ${anchor.title}`;
  return `Porque ${category === 'movie' ? 'viste' : category === 'book' ? 'leíste' : 'escuchaste'} ${anchor.title}`;
}
export function uniqueShelfItems(items: SearchResult[], category: ShelfCategory, excluded: Set<string>) {
  const seen = new Set<string>();
  return items.filter(r => {
    const key = tasteKey(r.source, r.externalId);
    if (r.mediaType !== category || excluded.has(key) || seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 10);
}
export function consumedFriendActivity(row: { category: string | null; kind: string }, category: ShelfCategory) {
  return row.category === category && row.kind === 'watched';
}
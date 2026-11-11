import type { SearchResult } from './media';
export const EXPLORATION_SHARE = 0.2;
export const DAILY_CONNECTION_LIMIT = 2;
export type Taste = { label: string; weight: number; suppressed: boolean };
export const tasteKey = (source: string, id: string) => `${source}:${id.replace(/^(movie|tv)-/, '$1:')}`;
export const normalizeTaste = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function decayedWeight(weight: number, days: number) { return weight * Math.pow(0.5, Math.max(0, days) / 90); }
export function activityWeight(s: { favorite?: boolean; score?: number | null; consumed?: boolean; queued?: boolean; dismissed?: boolean }) {
  if (s.dismissed) return -6;
  return (s.favorite ? 8 : 0) + ((s.score ?? 0) >= 8 ? 6 : (s.score ?? 5) <= 3 ? -4 : 0) + (s.consumed ? 1 : 0) + (s.queued ? 3 : 0);
}
export function tasteScore(tags: string[], tastes: Taste[], paused = false) {
  if (paused) return 0;
  return tastes.reduce((sum, t) => sum + (t.suppressed ? 0 : tags.some(tag => normalizeTaste(tag).includes(normalizeTaste(t.label))) ? Number(t.weight) : 0), 0);
}
export function diverseOrder<T extends { score: number; id: string }>(rows: T[], count = 10): T[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const explorationCount = Math.floor(Math.min(count, sorted.length) * EXPLORATION_SHARE);
  const familiar = sorted.slice(0, Math.min(count, sorted.length) - explorationCount);
  const ids = new Set(familiar.map(r => r.id));
  const exploration = sorted.filter(r => !ids.has(r.id)).reverse().slice(0, explorationCount);
  return [...familiar, ...exploration];
}
export function workTags(result: SearchResult, genres: string[] = [], extra: string[] = []) {
  return [...new Set([...genres, ...extra, result.title, result.creator, result.year ? `${Math.floor(result.year / 10) * 10}s` : null].filter((v): v is string => !!v).map(s => s.trim()).filter(Boolean))].slice(0, 30);
}
export const initialTastes = ['Jazz', 'Rock argentino', 'Cine argentino', 'Terror', 'Drama', 'Cine de los 70', 'Literatura latinoamericana', 'Poesía', 'Ciencia ficción', 'Música en vivo', 'Teatro', 'Festivales'];
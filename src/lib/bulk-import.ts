import type { SearchResult } from "@/lib/media";

export type BulkMode = "director" | "actor" | "title" | "collection" | "author" | "artist";
export const BULK_LIMIT = 100;

export interface BulkCandidate extends SearchResult {
  /** Why it is hidden by default (short, making of, documentary, unreleased…); null = shown. */
  hiddenReason: string | null;
  genreIds?: number[];
}

export interface RawTmdbMovie {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  video?: boolean;
  popularity?: number;
}

const DOC = 99;
const EXTRA = /making of|detr[aá]s de (escena|c[aá]maras)|behind the scenes|featurette|the making|documental sobre/i;

/** Classify TMDB credits so the preview hides what usually doesn't belong. */
export function hiddenReason(m: RawTmdbMovie, today = new Date().toISOString().slice(0, 10)): string | null {
  if (!m.release_date || m.release_date > today) return "Sin estrenar";
  if (m.video || EXTRA.test(m.title ?? "")) return "Extra / making of";
  if (m.genre_ids?.includes(DOC)) return "Documental";
  return null;
}

export interface BulkFilter { genre?: number | undefined; fromYear?: number | undefined; toYear?: number | undefined }

/** Apply genre / year filters, drop duplicates, cap the import. */
export function prepareCandidates<T extends BulkCandidate>(items: T[], f: BulkFilter = {}): T[] {
  const seen = new Set<string>();
  return items
    .filter((i) => (f.genre ? i.genreIds?.includes(f.genre) : true))
    .filter((i) => (f.fromYear ? (i.year ?? 0) >= f.fromYear : true))
    .filter((i) => (f.toYear ? (i.year ?? 9999) <= f.toYear : true))
    .filter((i) => { const k = `${i.source}:${i.externalId}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, BULK_LIMIT);
}

/** Split selected picks into new ones and those already in the list. */
export function splitExisting<T extends { source: string; externalId: string }>(picks: T[], existing: { source: string; external_id: string }[]) {
  const have = new Set(existing.map((e) => `${e.source}:${e.external_id}`));
  const fresh = picks.filter((p) => !have.has(`${p.source}:${p.externalId}`));
  return { fresh, duplicates: picks.length - fresh.length };
}

export type ListSort = "custom" | "year" | "title" | "rating" | "added" | "runtime";

/** Sort list rows; "custom" uses the stored position. */
export function sortItems<T extends { title: string; year: number | null; created_at: string; position: number | null; id: string }>(
  rows: T[], sort: ListSort, avg: (id: string) => number | null = () => null,
): T[] {
  const list = [...rows];
  if (sort === "custom") list.sort((a, b) => (a.position ?? 1e9) - (b.position ?? 1e9) || a.created_at.localeCompare(b.created_at));
  if (sort === "year") list.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title, "es"));
  if (sort === "rating") list.sort((a, b) => (avg(b.id) ?? -1) - (avg(a.id) ?? -1));
  if (sort === "added") list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return list;
}

/** First pending item in the current order gets the "Siguiente" tag. */
export function nextPendingId<T extends { id: string; done: boolean }>(rows: T[]): string | null {
  return rows.find((r) => !r.done)?.id ?? null;
}

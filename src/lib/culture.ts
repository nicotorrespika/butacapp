import { z } from "zod";
import { listAccepts, type MediaType, type SearchResult } from "./media";
export const homeCategories = ["all", "movie", "music", "book", "event"] as const;
export type HomeCategory = typeof homeCategories[number];
export type CultureType = "music" | "book";
export const categoryLabels = { all: "Todo", movie: "Cine", music: "Música", book: "Libros", event: "Eventos" };
export const interests = { music: "Música", movie: "Cine", art: "Arte", theater: "Teatro", book: "Libros", festival: "Ferias y festivales" };
export const cultureVerbs = { music: { consumed: "La escuché", queued: "Quiero escucharlo" }, book: { consumed: "Lo leí", queued: "Quiero leerlo" } };
export function cultureRouteId(source: string, externalId: string) { return `${source}~${encodeURIComponent(externalId)}`; }
export function parseCultureId(id: string) { const [source, ...rest] = id.split("~"); return { source: source ?? "", externalId: decodeURIComponent(rest.join("~")) }; }
export function normalizeTitle(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
export function verifyCultureResult(result: SearchResult, title: string, creator: string, year: number | null) {
  return normalizeTitle(result.title) === normalizeTitle(title) && !!result.creator && normalizeTitle(result.creator).includes(normalizeTitle(creator)) && (!year || result.year === year);
}
export function availableCulture(results: SearchResult[], entries: { source: string; external_id: string; consumed: boolean; queued: boolean; dismissed: boolean }[], items: { source: string; external_id: string }[]) {
  const excluded = new Set([...entries.filter(e => e.consumed || e.queued || e.dismissed), ...items].map(e => `${e.source}:${e.external_id}`));
  return results.filter(r => !excluded.has(`${r.source}:${r.externalId}`));
}
export interface CultureDetail { result: SearchResult; description: string | null; genres: string[]; pages: number | null; publisher: string | null; tracks: { title: string; duration: number | null; preview: string | null }[]; links: { label: string; url: string }[]; preview?: { label: string; url: string } | null; ratings?: { source: string; value: number; count: number }[]; }
export function isCulture(media: MediaType): media is CultureType { return media === "book" || media === "music"; }
export const cultureCompatible = (kind: Parameters<typeof listAccepts>[0], type: CultureType) => listAccepts(kind, type);
export const eventSchema = z.object({ title: z.string().min(1).max(200), description: z.string().max(3000), starts_at: z.string().datetime({ offset: true }), ends_at: z.string().datetime({ offset: true }).nullable(), venue: z.string().min(1), address: z.string().nullable(), neighborhood: z.string().nullable(), interest: z.enum(["music", "movie", "art", "theater", "book", "festival"]), price: z.number().min(0).nullable(), source_name: z.string(), source_url: z.string().url(), image_url: z.string().url().nullable() });
export function dateRange(mode: string, chosen: string, now = new Date()) {
  const date = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const day = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  const start = new Date(`${mode === "date" && chosen ? chosen : day}T00:00:00-03:00`);
  if (mode === "weekend") { const weekday = date.getDay(); start.setUTCDate(start.getUTCDate() + ((6-weekday+7)%7)); }
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + (mode === "week" ? 7 : mode === "weekend" ? 2 : 1));
  return { start: start.toISOString(), end: end.toISOString() };
}
export function eventPriceMatches(price: number | null, mode: string) { return mode === "all" || (mode === "free" ? price === 0 : price !== null && price > 0); }
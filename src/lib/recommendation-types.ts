import { z } from "zod";
import type { SearchResult } from "./media";

export const recommendationSchema = z.object({ movies: z.array(z.object({ title: z.string(), year: z.number().nullable(), reason: z.string() })) });
export type RecommendedMovie = { title: string; year: number | null; reason: string; result: SearchResult | null };
export type RecommendationResponse = { ok: true; movies: RecommendedMovie[] } | { ok: false; message: string };

export function excludeExisting<T extends { title: string; year: number | null }>(movies: T[], existing: { title: string; year: number | null }[]): T[] {
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return movies.filter((m) => !existing.some((e) => normalize(e.title) === normalize(m.title) && (!e.year || !m.year || e.year === m.year)));
}
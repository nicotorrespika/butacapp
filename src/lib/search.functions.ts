/**
 * Unified search server function.
 * Requires a signed-in user so the external API quota (and TMDB key) can't be abused.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PersonResult, SearchResponse, SearchResult } from "@/lib/media";
import { parseQuery } from "@/lib/search-query";
import { searchArt, searchImdbFallback, searchMusic, searchTmdb } from "@/server/search-providers";
import { searchBooks } from "@/server/culture-providers";

const inputSchema = z.object({
  q: z.string().trim().min(1).max(120),
  filter: z.enum(["all", "movie", "music", "book", "art"]),
});

export const searchMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data,context }): Promise<SearchResponse> => {
    await context.supabase.rpc('record_taste_signal',{k:`search:${data.filter}:${data.q.toLowerCase()}`,cat:data.filter==='art'?'event':data.filter,src:'search',eid:'',work_title:data.q,work_tags:[data.q],points:0.5});
    const parsed = parseQuery(data.q);
    const want = (t: "movie" | "music" | "book" | "art") => data.filter === "all" || data.filter === t;
    const tmdbKey = process.env["TMDB_API_KEY"];
    const warnings: string[] = [];

    // Run each provider independently: one failing never breaks the others.
    const run = async (label: string, fn: () => Promise<SearchResult[]>) => {
      try {
        return await fn();
      } catch (e) {
        console.error(`[search] ${label} failed`, e);
        warnings.push(`${label} no respondió. Probá de nuevo en un momento.`);
        return [];
      }
    };

    // Movies: TMDB (full catalogue + people). If the key is missing or TMDB fails,
    // fall back to the basic IMDb feed so search keeps working.
    let people: PersonResult[] = [];
    let movieProvider: "tmdb" | "basic" = "basic";
    const movies = async (): Promise<SearchResult[]> => {
      if (tmdbKey) {
        try {
          const r = await searchTmdb(parsed, tmdbKey);
          people = r.people;
          movieProvider = "tmdb";
          return r.results;
        } catch (e) {
          console.error("[search] TMDB failed, using basic movie search", e);
        }
      }
      return searchImdbFallback(parsed);
    };

    const [movie, music, book, art] = await Promise.all([
      want("movie") ? run("Películas", movies) : Promise.resolve([]),
      want("music") ? run("Música", () => searchMusic(parsed)) : Promise.resolve([]),
      want("book") ? run("Libros", () => searchBooks(data.q)) : Promise.resolve([]),
      data.filter === "art" ? run("Arte", () => searchArt(parsed)) : Promise.resolve([]),
    ]);

    return { people, movie, music, book, art, movieProvider, warnings };
  });

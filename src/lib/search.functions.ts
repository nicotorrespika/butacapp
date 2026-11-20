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
import { cachedCatalog } from "@/server/catalog-cache";
import { guestSearchSchema } from './guest-catalog';

/** Guest catalog search: no database, user context, AI calls or private records. */
export const searchGuestCatalog = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => guestSearchSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResponse> => {
    const parsed = parseQuery(data.q);
    const key = process.env['TMDB_API_KEY'];
    const warnings: string[] = [];
    const want = (category: string) => data.filter === 'all' || data.filter === category;
    let people: PersonResult[] = [];
    const run = async (label: string, fn: () => Promise<SearchResult[]>) => {
      try { return (await fn()).slice(0, 24); }
      catch { warnings.push(`${label} no respondió. Probá de nuevo.`); return []; }
    };
    const [movie, music, book] = await Promise.all([
      want('movie') ? run('Cine', async () => {
        if (!key) return searchImdbFallback(parsed);
        try { const r = await searchTmdb(parsed, key); people = r.people; return r.results; }
        catch { return searchImdbFallback(parsed); }
      }) : Promise.resolve([]),
      want('music') ? run('Música', () => searchMusic(parsed)) : Promise.resolve([]),
      want('book') ? run('Libros', () => searchBooks(data.q)) : Promise.resolve([]),
    ]);
    return { movie, music, book, people, art: [], movieProvider: key ? 'tmdb' : 'basic', warnings };
  });

const inputSchema = z.object({
  q: z.string().trim().min(1).max(120),
  filter: z.enum(["all", "movie", "music", "book", "art"]),
});

export const searchMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data,context }): Promise<SearchResponse> => {
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
      want("music") ? run("Música", () => cachedCatalog(context.supabase,`music-search:v3:${data.q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}`,async()=>{const items=await searchMusic(parsed);if(!items.length)throw new Error("Music providers unavailable");return items;},3)) : Promise.resolve([]),
      want("book") ? run("Libros", () => searchBooks(data.q)) : Promise.resolve([]),
      data.filter === "art" ? run("Arte", () => searchArt(parsed)) : Promise.resolve([]),
    ]);

    return { people, movie, music, book, art, movieProvider, warnings };
  });

/**
 * Movie + person detail server functions (signed-in users only, keys stay server-side).
 * Return a typed `Fetched` result instead of throwing so the UI can explain
 * "missing key" vs "not found" vs "provider down".
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Fetched, MovieDetail, PersonDetail } from "@/lib/movie-types";
import { fetchMovieDetail, fetchPersonDetail, NotFoundError } from "@/server/tmdb-details";
import { cachedCatalog } from "@/server/catalog-cache";

function failure(e: unknown, label: string): Fetched<never> {
  if (e instanceof NotFoundError) return { ok: false, reason: "not_found" };
  console.error(`[${label}] failed`, e);
  return { ok: false, reason: "provider" };
}

export const getMovie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().regex(/^((movie|tv)-\d+|tt\d{5,10})$/) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<Fetched<MovieDetail>> => {
    const key = process.env["TMDB_API_KEY"];
    if (!key) return { ok: false, reason: "no_key" };
    try {
      const omdbKey = process.env["OMDB_API_KEY"];
      return { ok: true, data: await cachedCatalog(context.supabase,`detail:movie:v2:${data.id}`,()=>fetchMovieDetail(data.id, key, omdbKey)) };
    } catch (e) {
      return failure(e, "movie");
    }
  });

export const getPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data }): Promise<Fetched<PersonDetail>> => {
    const key = process.env["TMDB_API_KEY"];
    if (!key) return { ok: false, reason: "no_key" };
    try {
      return { ok: true, data: await fetchPersonDetail(data.id, key) };
    } catch (e) {
      return failure(e, "person");
    }
  });

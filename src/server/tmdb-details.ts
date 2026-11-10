/**
 * Movie / series / person details for the movie and person pages.
 * Server-only: uses TMDB_API_KEY and OMDB_API_KEY passed in by the server functions.
 *
 *  - TMDB: full catalogue (it mirrors IMDb ids), credits, recommendations,
 *    keywords/genres for "similar" suggestions and complete filmographies.
 *  - OMDb (optional): IMDb, Rotten Tomatoes and Metacritic scores.
 *  - Letterboxd has no public API → we link to the film page (letterboxd.com/tmdb/{id}).
 */
import type { SearchResult } from "@/lib/media";
import type { CreditPerson, CriticScore, MovieDetail, PersonDetail, SuggestionSection } from "@/lib/movie-types";
import { extractYear } from "@/lib/search-query";
import {
  getJson,
  mapTmdb,
  TMDB_PROFILE,
  tmdbFetcher,
  type TmdbFetch,
  type TmdbItem,
} from "@/server/search-providers";

export class NotFoundError extends Error {}

const BACKDROP = "https://image.tmdb.org/t/p/w1280";
const POSTER = "https://image.tmdb.org/t/p/w500";

/** Parses "movie-123", "tv-123" or an IMDb id "tt0079944". */
function parseRouteId(routeId: string): { type: "movie" | "tv"; id: number } | { imdb: string } | null {
  const m = /^(movie|tv)-(\d+)$/.exec(routeId);
  if (m) return { type: m[1] as "movie" | "tv", id: Number(m[2]) };
  if (/^tt\d{5,10}$/.test(routeId)) return { imdb: routeId };
  return null;
}

interface TmdbDetail {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  genres?: { id: number; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  tagline?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  created_by?: { id: number; name: string; profile_path?: string | null }[];
  external_ids?: { imdb_id?: string | null };
  imdb_id?: string | null;
  credits?: {
    cast: { id: number; name: string; character?: string; profile_path?: string | null }[];
    crew: { id: number; name: string; job: string; profile_path?: string | null }[];
  };
  recommendations?: { results: TmdbItem[] };
  similar?: { results: TmdbItem[] };
  keywords?: { keywords?: { id: number }[]; results?: { id: number }[] };
}

interface OmdbResponse {
  Response: "True" | "False";
  imdbRating?: string;
  imdbVotes?: string;
  Ratings?: { Source: string; Value: string }[];
}

/** IMDb / Rotten Tomatoes / Metacritic from OMDb. Never throws (scores are a bonus). */
async function omdbScores(imdbId: string | null, title: string, key: string | undefined): Promise<CriticScore[]> {
  if (!imdbId || !key) return [];
  try {
    const d = await getJson<OmdbResponse>(
      `https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(imdbId)}`,
    );
    if (d.Response !== "True") return [];
    const out: CriticScore[] = [];
    const imdb = Number(d.imdbRating);
    if (Number.isFinite(imdb) && imdb > 0) {
      out.push({
        source: "imdb",
        label: "IMDb",
        value: imdb.toFixed(1),
        percent: imdb * 10,
        url: `https://www.imdb.com/title/${imdbId}/`,
        votes: Number((d.imdbVotes ?? "").replace(/,/g, "")) || undefined,
      });
    }
    const rt = d.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value;
    if (rt) {
      out.push({
        source: "rt",
        label: "Rotten Tomatoes",
        value: rt,
        percent: parseInt(rt, 10) || 0,
        url: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(title)}`,
      });
    }
    const mc = d.Ratings?.find((r) => r.Source === "Metacritic")?.Value;
    if (mc) {
      const n = parseInt(mc, 10) || 0;
      out.push({
        source: "metacritic",
        label: "Metacritic",
        value: String(n),
        percent: n,
        url: `https://www.metacritic.com/search/${encodeURIComponent(title)}/`,
      });
    }
    return out;
  } catch (e) {
    console.error("[omdb] failed", e);
    return [];
  }
}

const usable = (i: TmdbItem) => !!i.poster_path && (i.title ?? i.name);

/** Removes the current title and anything already shown in an earlier section. */
function uniqueAcross(sections: SuggestionSection[], selfKey: string): SuggestionSection[] {
  const seen = new Set<string>([selfKey]);
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => {
        if (seen.has(i.externalId)) return false;
        seen.add(i.externalId);
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);
}

/** Directed (or created) works by a person, most popular first. */
async function worksBy(tmdb: TmdbFetch, personId: number, name: string): Promise<SearchResult[]> {
  const c = await tmdb<{ crew: TmdbItem[] }>(`/person/${personId}/combined_credits`);
  const seen = new Set<number>();
  return c.crew
    .filter((w) => (w.job === "Director" || w.job === "Creator") && usable(w))
    .filter((w) => w.media_type === "movie" || w.media_type === "tv")
    .filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)))
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 20)
    .map((w) => mapTmdb(w, w.media_type as "movie" | "tv", name));
}

export async function fetchMovieDetail(
  routeId: string,
  tmdbKey: string,
  omdbKey: string | undefined,
): Promise<MovieDetail> {
  const tmdb = tmdbFetcher(tmdbKey);
  const parsed = parseRouteId(routeId);
  if (!parsed) throw new NotFoundError();

  // IMDb id → resolve to TMDB first.
  let ref: { type: "movie" | "tv"; id: number };
  if ("imdb" in parsed) {
    const f = await tmdb<{ movie_results: TmdbItem[]; tv_results: TmdbItem[] }>(`/find/${parsed.imdb}`, {
      external_source: "imdb_id",
    });
    const hit = f.movie_results[0] ?? f.tv_results[0];
    if (!hit) throw new NotFoundError();
    ref = { type: f.movie_results[0] ? "movie" : "tv", id: hit.id };
  } else ref = parsed;

  const d = await tmdb<TmdbDetail>(`/${ref.type}/${ref.id}`, {
    append_to_response: "credits,recommendations,similar,keywords,external_ids",
  }).catch((e: unknown) => {
    if (e instanceof Error && e.message.includes("404")) throw new NotFoundError();
    throw e;
  });

  const title = d.title ?? d.name ?? "Sin título";
  const year = extractYear(d.release_date ?? d.first_air_date);
  const imdbId = d.imdb_id ?? d.external_ids?.imdb_id ?? null;

  // Spanish overview is sometimes missing → fall back to English.
  let overview = d.overview?.trim() || null;
  if (!overview) {
    try {
      const en = await tmdb<{ overview?: string }>(`/${ref.type}/${ref.id}`, { language: "en-US" });
      overview = en.overview?.trim() || null;
    } catch {
      /* optional */
    }
  }

  const crew = d.credits?.crew ?? [];
  const directors: CreditPerson[] =
    ref.type === "movie"
      ? crew
          .filter((c) => c.job === "Director")
          .map((c) => ({ id: c.id, name: c.name, role: "Dirección", photoUrl: c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : null }))
      : (d.created_by ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          role: "Creación",
          photoUrl: c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : null,
        }));
  const cast: CreditPerson[] = (d.credits?.cast ?? []).slice(0, 12).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.character || null,
    photoUrl: c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : null,
  }));

  const genreIds = (d.genres ?? []).map((g) => g.id);
  const keywordIds = (d.keywords?.keywords ?? d.keywords?.results ?? []).map((k) => k.id).slice(0, 5);
  const firstDirector = directors[0];
  const dateKey = ref.type === "movie" ? "primary_release_date" : "first_air_date";

  // Suggestions, fetched in parallel; each one is optional.
  const [byDirector, byTheme, byGenre, scores] = await Promise.all([
    firstDirector ? worksBy(tmdb, firstDirector.id, firstDirector.name).catch(() => []) : Promise.resolve([]),
    keywordIds.length
      ? tmdb<{ results: TmdbItem[] }>(`/discover/${ref.type}`, {
          with_keywords: keywordIds.join("|"),
          sort_by: "popularity.desc",
          "vote_count.gte": 50,
        })
          .then((r) => r.results.filter(usable).map((i) => mapTmdb(i, ref.type)))
          .catch(() => [])
      : Promise.resolve([]),
    genreIds.length
      ? tmdb<{ results: TmdbItem[] }>(`/discover/${ref.type}`, {
          with_genres: genreIds.slice(0, 2).join(","),
          sort_by: "vote_average.desc",
          "vote_count.gte": 400,
          [`${dateKey}.gte`]: year ? `${year - 15}-01-01` : undefined,
          [`${dateKey}.lte`]: year ? `${year + 15}-12-31` : undefined,
        })
          .then((r) => r.results.filter(usable).map((i) => mapTmdb(i, ref.type)))
          .catch(() => [])
      : Promise.resolve([]),
    omdbScores(imdbId, title, omdbKey),
  ]);

  const recommended = [...(d.recommendations?.results ?? []), ...(d.similar?.results ?? [])]
    .filter(usable)
    .filter((i) => !i.media_type || i.media_type === "movie" || i.media_type === "tv")
    .map((i) => mapTmdb(i, (i.media_type as "movie" | "tv" | undefined) ?? ref.type));

  const genreNames = (d.genres ?? []).slice(0, 2).map((g) => g.name.toLowerCase());
  const selfKey = `${ref.type}:${ref.id}`;
  const sections = uniqueAcross(
    [
      {
        id: "director",
        title: firstDirector ? `Más de ${firstDirector.name}` : "Más del director",
        personId: firstDirector?.id,
        items: byDirector,
      },
      { id: "recommended", title: "Te puede gustar", items: recommended.slice(0, 20) },
      { id: "theme", title: "Misma temática", items: byTheme.slice(0, 20) },
      {
        id: "genre",
        title: genreNames.length ? `Más ${genreNames.join(" y ")} de su época` : "Del mismo género",
        items: byGenre.slice(0, 20),
      },
    ],
    selfKey,
  );

  if (d.vote_count && d.vote_average) {
    scores.unshift({
      source: "tmdb",
      label: "TMDB",
      value: d.vote_average.toFixed(1),
      percent: d.vote_average * 10,
      url: `https://www.themoviedb.org/${ref.type}/${ref.id}`,
      votes: d.vote_count,
    });
  }

  const result = mapTmdb(
    { id: d.id, title, release_date: d.release_date, first_air_date: d.first_air_date, poster_path: d.poster_path },
    ref.type,
    directors.map((x) => x.name).join(", ") || null,
  );

  return {
    routeId: `${ref.type}-${ref.id}`,
    type: ref.type,
    title,
    originalTitle: (d.original_title ?? d.original_name) !== title ? (d.original_title ?? d.original_name ?? null) : null,
    year,
    runtime: d.runtime ?? d.episode_run_time?.[0] ?? null,
    seasons: d.number_of_seasons ?? null,
    genres: (d.genres ?? []).map((g) => g.name),
    countries: (d.production_countries ?? []).map((c) => c.name).slice(0, 3),
    tagline: d.tagline?.trim() || null,
    overview,
    posterUrl: d.poster_path ? `${POSTER}${d.poster_path}` : null,
    backdropUrl: d.backdrop_path ? `${BACKDROP}${d.backdrop_path}` : null,
    directors,
    cast,
    scores,
    links: {
      tmdb: `https://www.themoviedb.org/${ref.type}/${ref.id}`,
      imdb: imdbId ? `https://www.imdb.com/title/${imdbId}/` : null,
      letterboxd: ref.type === "movie" ? `https://letterboxd.com/tmdb/${ref.id}/` : null,
    },
    result,
    sections,
  };
}

interface TmdbPerson {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  combined_credits?: { cast: TmdbItem[]; crew: TmdbItem[] };
}

const SELF_ROLE = /^(self|himself|herself|themselves|narrator)\b|\(voice\)|\(uncredited\)|^$/i;

const byDateDesc = (a: SearchResult, b: SearchResult) => (b.year ?? 9999) - (a.year ?? 9999);

export async function fetchPersonDetail(personId: number, tmdbKey: string): Promise<PersonDetail> {
  const tmdb = tmdbFetcher(tmdbKey);
  const p = await tmdb<TmdbPerson>(`/person/${personId}`, { append_to_response: "combined_credits" }).catch(
    (e: unknown) => {
      if (e instanceof Error && e.message.includes("404")) throw new NotFoundError();
      throw e;
    },
  );

  let biography = p.biography?.trim() || null;
  if (!biography) {
    try {
      const en = await tmdb<{ biography?: string }>(`/person/${personId}`, { language: "en-US" });
      biography = en.biography?.trim() || null;
    } catch {
      /* optional */
    }
  }

  const credits = p.combined_credits ?? { cast: [], crew: [] };
  const isWork = (w: TmdbItem) => (w.media_type === "movie" || w.media_type === "tv") && !!(w.title ?? w.name);
  // Each category dedupes on its own (someone can direct and act in the same film).
  const onceIn = (seen: Set<string>) => (w: TmdbItem) => {
    const k = `${w.media_type}:${w.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  };
  const directedSeen = new Set<string>();
  const map = (w: TmdbItem, creator: string | null) => mapTmdb(w, w.media_type as "movie" | "tv", creator);

  const directed = credits.crew
    .filter((w) => isWork(w) && (w.job === "Director" || w.job === "Creator"))
    .filter(onceIn(directedSeen))
    .map((w) => map(w, p.name))
    .sort(byDateDesc);

  // Skip talk-show appearances ("Self") and series with no real role.
  const acted = credits.cast
    .filter((w) => isWork(w) && !SELF_ROLE.test(w.character ?? "") && (w.media_type === "movie" || (w.vote_count ?? 0) > 20))
    .filter(onceIn(new Set()))
    .map((w) => map(w, null))
    .sort(byDateDesc);

  const other = credits.crew
    .filter((w) => isWork(w) && ["Screenplay", "Writer", "Producer", "Original Music Composer", "Director of Photography", "Editor"].includes(w.job ?? ""))
    .filter(onceIn(new Set(directedSeen)))
    .map((w) => map(w, null))
    .sort(byDateDesc);

  return {
    id: p.id,
    name: p.name,
    photoUrl: p.profile_path ? `https://image.tmdb.org/t/p/w342${p.profile_path}` : null,
    department: p.known_for_department ?? null,
    biography,
    birthday: p.birthday ?? null,
    deathday: p.deathday ?? null,
    placeOfBirth: p.place_of_birth ?? null,
    directed,
    acted,
    other,
  };
}

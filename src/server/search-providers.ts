/**
 * External media providers used by the unified search.
 * Runs only on the server (inside the search server function), so the
 * TMDB key never reaches the browser. All providers use plain fetch.
 *
 *  - Movies/series: TMDB (needs TMDB_API_KEY) → fallback IMDb autocomplete (no key)
 *  - Music: iTunes Search API (albums + songs, no key)
 *  - Art: Art Institute of Chicago + The Met Museum (no key)
 */
import type { PersonResult, SearchResult } from "@/lib/media";
import { boostYear, extractYear, type ParsedQuery } from "@/lib/search-query";
import { searchDeezer, searchMusicBrainz } from "./music-providers";

const TIMEOUT_MS = 7000;

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${new URL(url).host} respondió ${res.status}`);
  return (await res.json()) as T;
}

function dedupe(items: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.source}:${i.externalId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* TMDB                                                                 */
/* ------------------------------------------------------------------ */

export interface TmdbItem {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  popularity?: number;
  job?: string;
  known_for_department?: string;
  profile_path?: string | null;
  known_for?: TmdbItem[];
  character?: string;
  vote_count?: number;
}

export const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
export const TMDB_PROFILE = "https://image.tmdb.org/t/p/w185";

export type TmdbFetch = <T>(path: string, params?: Record<string, string | number | undefined>) => Promise<T>;

export function tmdbFetcher(key: string): TmdbFetch {
  // Supports both a v3 API key and a v4 "Read Access Token" (JWT).
  const isBearer = key.startsWith("eyJ");
  return <T>(path: string, params: Record<string, string | number | undefined> = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set("language", "es-AR");
    url.searchParams.set("region", "AR");
    url.searchParams.set("include_adult", "false");
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
    if (!isBearer) url.searchParams.set("api_key", key);
    return getJson<T>(
      url.toString(),
      isBearer ? { headers: { Authorization: `Bearer ${key}`, accept: "application/json" } } : {},
    );
  };
}

export function mapTmdb(i: TmdbItem, type: "movie" | "tv", creator: string | null = null): SearchResult {
  return {
    source: "tmdb",
    externalId: `${type}:${i.id}`,
    mediaType: "movie",
    title: i.title ?? i.name ?? "Sin título",
    creator,
    year: extractYear(i.release_date ?? i.first_air_date),
    imageUrl: i.poster_path ? `${TMDB_IMG}${i.poster_path}` : null,
    kindLabel: type === "tv" ? "Serie" : "Película",
    externalUrl: `https://www.themoviedb.org/${type}/${i.id}`,
  };
}

export async function searchTmdb(
  q: ParsedQuery,
  key: string,
): Promise<{ results: SearchResult[]; people: PersonResult[] }> {
  const tmdb = tmdbFetcher(key);

  // Year only → most popular movies of that year.
  if (!q.text && q.year) {
    const d = await tmdb<{ results: TmdbItem[] }>("/discover/movie", {
      primary_release_year: q.year,
      sort_by: "popularity.desc",
    });
    return { results: d.results.slice(0, 20).map((i) => mapTmdb(i, "movie")), people: [] };
  }

  const multi = await tmdb<{ results: TmdbItem[] }>("/search/multi", { query: q.text });
  const works = multi.results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
  const person = multi.results.find((r) => r.media_type === "person");

  // People matches (directors, actors…) → shown as a row that opens their full filmography.
  const people: PersonResult[] = multi.results
    .filter((r) => r.media_type === "person" && (r.known_for?.length || r.profile_path))
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      name: p.name ?? "Sin nombre",
      photoUrl: p.profile_path ? `${TMDB_PROFILE}${p.profile_path}` : null,
      department: p.known_for_department ?? null,
      knownFor: (p.known_for ?? []).map((k) => k.title ?? k.name ?? "").filter(Boolean).slice(0, 3),
    }));

  let results: SearchResult[] = [];

  // Person match (director, actor…) → their filmography, directed works first.
  const personFirst = person && multi.results.indexOf(person) <= 2;
  if (person && personFirst) {
    const credits = await tmdb<{ cast: TmdbItem[]; crew: TmdbItem[] }>(
      `/person/${person.id}/combined_credits`,
    );
    const directed = credits.crew.filter((c) => c.job === "Director");
    const pool =
      person.known_for_department === "Directing" ? [...directed, ...credits.cast] : [...credits.cast, ...directed];
    const filtered = pool
      .filter((c) => c.media_type === "movie" || c.media_type === "tv")
      .filter((c) => !q.year || extractYear(c.release_date ?? c.first_air_date) === q.year)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    results.push(...filtered.map((c) => mapTmdb(c, c.media_type as "movie" | "tv", person.name ?? null)));
  }

  // Title match, optionally constrained by year.
  if (q.year) {
    const [m, t] = await Promise.all([
      tmdb<{ results: TmdbItem[] }>("/search/movie", { query: q.text, primary_release_year: q.year }),
      tmdb<{ results: TmdbItem[] }>("/search/tv", { query: q.text, first_air_date_year: q.year }),
    ]);
    results.push(...m.results.map((i) => mapTmdb(i, "movie")), ...t.results.map((i) => mapTmdb(i, "tv")));
  }
  results.push(...works.map((i) => mapTmdb(i, i.media_type as "movie" | "tv")));

  results = boostYear(dedupe(results), q.year).slice(0, 24);

  // Fill in directors for the top movies that don't have a creator yet.
  await Promise.all(
    results.slice(0, 8).map(async (r) => {
      if (r.creator || !r.externalId.startsWith("movie:")) return;
      try {
        const c = await tmdb<{ production_countries:{iso_3166_1:string}[];credits:{crew: { job: string; name: string }[]} }>(
          `/movie/${r.externalId.split(":")[1]}`,{append_to_response:"credits"},
        );
        r.creator = c.credits.crew.find((p) => p.job === "Director")?.name ?? null;
        if(c.production_countries.some(p=>p.iso_3166_1==="AR"))r.kindLabel="Cine argentino";
      } catch {
        /* non-critical */
      }
    }),
  );
  results.sort((a,b)=>Number(b.kindLabel==="Cine argentino")-Number(a.kindLabel==="Cine argentino"));
  return { results, people };
}

/* ------------------------------------------------------------------ */
/* iTunes Search (music)                                               */
/* ------------------------------------------------------------------ */

interface ItunesItem {
  wrapperType?: string;
  kind?: string;
  collectionId?: number;
  trackId?: number;
  collectionName?: string;
  trackName?: string;
  artistName?: string;
  releaseDate?: string;
  artworkUrl100?: string;
  collectionViewUrl?: string;
  trackViewUrl?: string;
}

const bigArtwork = (u?: string) => (u ? u.replace(/\/\d+x\d+bb\./, "/600x600bb.") : null);

function itunes(params: Record<string, string | number>) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("country", "US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return getJson<{ results: ItunesItem[] }>(url.toString());
}

export async function searchMusic(q: ParsedQuery): Promise<SearchResult[]> {
  const term = q.text || String(q.year ?? "");
  if (!term) return [];
  const primary = await searchDeezer(term);
  if (primary.length) return primary;
  try { const backup = await searchMusicBrainz(term); if (backup.length) return backup; } catch { /* iTunes remains a final fallback. */ }
  // When a year is given, fetch more albums so filtering by year still leaves results.
  const [albums, songs] = await Promise.all([
    itunes({ term, media: "music", entity: "album", limit: q.year ? 60 : 18 }).catch(() => ({ results: [] })),
    itunes({ term, media: "music", entity: "song", limit: q.year ? 40 : 12 }).catch(() => ({ results: [] })),
  ]);
  const mapped: SearchResult[] = [
    ...albums.results.map((a) => ({
      source: "itunes",
      externalId: `album:${a.collectionId}`,
      mediaType: "music" as const,
      title: a.collectionName ?? "Sin título",
      creator: a.artistName ?? null,
      year: extractYear(a.releaseDate),
      imageUrl: bigArtwork(a.artworkUrl100),
      kindLabel: "Álbum",
      externalUrl: a.collectionViewUrl ?? null,
    })),
    ...songs.results.map((s) => ({
      source: "itunes",
      externalId: `song:${s.trackId}`,
      mediaType: "music" as const,
      title: s.trackName ?? "Sin título",
      creator: s.artistName ?? null,
      year: extractYear(s.releaseDate),
      imageUrl: bigArtwork(s.artworkUrl100),
      kindLabel: "Canción",
      externalUrl: s.trackViewUrl ?? null,
    })),
  ];
  const byYear = q.year && q.text ? mapped.filter((m) => m.year === q.year) : mapped;
  return dedupe(byYear.length ? byYear : mapped).slice(0, 24);
}

/**
 * Movie fallback when no TMDB key is configured: IMDb's public autocomplete
 * feed (no key, but limited to ~8 results and no director info).
 * Configure TMDB_API_KEY for full results.
 */
interface ImdbSuggest {
  id: string;
  l?: string;
  qid?: string;
  s?: string;
  y?: number;
  i?: { imageUrl?: string };
}
const IMDB_KINDS: Record<string, string> = {
  movie: "Película",
  tvSeries: "Serie",
  tvMiniSeries: "Miniserie",
  tvMovie: "Película",
};

export async function searchImdbFallback(q: ParsedQuery): Promise<SearchResult[]> {
  const term = (q.year && q.text ? `${q.text} ${q.year}` : q.text || String(q.year ?? "")).toLowerCase();
  if (!term) return [];
  const fetchTerm = (t: string) =>
    getJson<{ d?: ImdbSuggest[] }>(`https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(t)}.json`);
  let d = await fetchTerm(term);
  // "Tarkovsky 1979" may yield nothing as a phrase → retry with the text only.
  if (!d.d?.some((x) => x.qid && IMDB_KINDS[x.qid]) && q.text && q.year) d = await fetchTerm(q.text.toLowerCase());
  const mapped: SearchResult[] = (d.d ?? [])
    .filter((x) => x.id.startsWith("tt") && x.qid && IMDB_KINDS[x.qid])
    .map((x) => ({
      source: "imdb",
      externalId: x.id,
      mediaType: "movie" as const,
      title: x.l ?? "Sin título",
      creator: x.s || null, // main cast
      year: x.y ?? null,
      imageUrl: x.i?.imageUrl ? x.i.imageUrl.replace(/\._V1_.*\.jpg$/, "._V1_UX342_.jpg") : null,
      kindLabel: IMDB_KINDS[x.qid ?? ""] ?? "Película",
      externalUrl: `https://www.imdb.com/title/${x.id}/`,
    }));
  return boostYear(mapped, q.year);
}

/* ------------------------------------------------------------------ */
/* Art: Art Institute of Chicago + The Met                              */
/* ------------------------------------------------------------------ */

interface AicItem {
  id: number;
  title: string;
  artist_title?: string | null;
  date_display?: string | null;
  date_start?: number | null;
  date_end?: number | null;
  image_id?: string | null;
}

async function searchAic(q: ParsedQuery): Promise<SearchResult[]> {
  const term = q.text || String(q.year ?? "");
  const url = new URL("https://api.artic.edu/api/v1/artworks/search");
  url.searchParams.set("q", term);
  url.searchParams.set("limit", q.year ? "60" : "24");
  url.searchParams.set("fields", "id,title,artist_title,date_display,date_start,date_end,image_id");
  const d = await getJson<{ data: AicItem[] }>(url.toString(), {
    headers: { "AIC-User-Agent": "Watchlists (contacto@watchlists.app)" },
  });
  let items = d.data.filter((a) => a.image_id);
  if (q.year && q.text) {
    const y = q.year;
    const matching = items.filter((a) => (a.date_start ?? 0) <= y && y <= (a.date_end ?? a.date_start ?? 0));
    if (matching.length) items = matching;
  }
  return items.map((a) => ({
    source: "aic",
    externalId: String(a.id),
    mediaType: "art",
    title: a.title,
    creator: a.artist_title ?? null,
    year: a.date_start ?? extractYear(a.date_display),
    imageUrl: `https://www.artic.edu/iiif/2/${a.image_id}/full/400,/0/default.jpg`,
    kindLabel: "Obra",
    externalUrl: `https://www.artic.edu/artworks/${a.id}`,
  }));
}

interface MetObject {
  objectID: number;
  title: string;
  artistDisplayName?: string;
  objectDate?: string;
  objectBeginDate?: number;
  primaryImageSmall?: string;
  objectURL?: string;
}

async function searchMet(q: ParsedQuery): Promise<SearchResult[]> {
  const term = q.text || String(q.year ?? "");
  const url = new URL("https://collectionapi.metmuseum.org/public/collection/v1/search");
  url.searchParams.set("q", term);
  url.searchParams.set("hasImages", "true");
  if (q.year) {
    url.searchParams.set("dateBegin", String(q.year - 1));
    url.searchParams.set("dateEnd", String(q.year + 1));
  }
  const s = await getJson<{ objectIDs: number[] | null }>(url.toString());
  const ids = (s.objectIDs ?? []).slice(0, 8);
  const objects = await Promise.all(
    ids.map((id) =>
      getJson<MetObject>(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`).catch(
        () => null,
      ),
    ),
  );
  return objects
    .filter((o): o is MetObject => !!o && !!o.primaryImageSmall)
    .map((o) => ({
      source: "met",
      externalId: String(o.objectID),
      mediaType: "art",
      title: o.title || "Sin título",
      creator: o.artistDisplayName || null,
      year: o.objectBeginDate ?? extractYear(o.objectDate),
      imageUrl: o.primaryImageSmall ?? null,
      kindLabel: "Obra",
      externalUrl: o.objectURL ?? null,
    }));
}

export async function searchArt(q: ParsedQuery): Promise<SearchResult[]> {
  if (!q.text && !q.year) return [];
  const [aic, met] = await Promise.allSettled([searchAic(q), searchMet(q)]);
  const a = aic.status === "fulfilled" ? aic.value : [];
  const m = met.status === "fulfilled" ? met.value : [];
  if (aic.status === "rejected" && met.status === "rejected") throw aic.reason;
  // Interleave both museums so neither dominates.
  const out: SearchResult[] = [];
  for (let i = 0; i < Math.max(a.length, m.length); i++) {
    const fromAic = a[i];
    const fromMet = m[i];
    if (fromAic) out.push(fromAic);
    if (fromMet) out.push(fromMet);
  }
  return boostYear(dedupe(out), q.year).slice(0, 24);
}

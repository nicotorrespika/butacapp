import type { SearchResult } from "@/lib/media";
import type { TopKind } from "@/lib/copy";
import { getJson, searchMusic, tmdbFetcher, mapTmdb, type TmdbItem } from "./search-providers";
import { parseQuery } from "@/lib/search-query";
import { searchBooks } from "./culture-providers";
import { musicBrainz } from "./music-providers";
import { searchDeezer } from './music-providers';

/** Artistas verificados en MusicBrainz. */
async function searchArtists(query: string): Promise<SearchResult[]> {
  const data = await musicBrainz<{ artists: { id: string; name: string; disambiguation?: string; country?: string }[] }>(`artist?query=${encodeURIComponent(query)}&fmt=json&limit=12`);
  return (data.artists ?? []).map((a) => ({
    source: "musicbrainz",
    externalId: `artist:${a.id}`,
    mediaType: "music",
    title: a.name,
    creator: [a.disambiguation, a.country].filter(Boolean).join(" · ") || null,
    year: null,
    imageUrl: `https://covers.openlibrary.org/a/olid/${a.key}-M.jpg?default=false`,
    kindLabel: "Artista",
    externalUrl: `https://musicbrainz.org/artist/${a.id}`,
  }));
}

/** Autores verificados en Open Library. */
async function searchAuthors(query: string): Promise<SearchResult[]> {
  const data = await getJson<{ docs: { key: string; name: string; birth_date?: string; top_work?: string }[] }>(
    `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(query)}&limit=12`,
  );
  return (data.docs ?? []).map((a) => ({
    source: "openlibrary",
    externalId: `author:${a.key}`,
    mediaType: "book",
    title: a.name,
    creator: a.top_work ?? null,
    year: null,
    imageUrl: null,
    kindLabel: "Autor",
    externalUrl: `https://openlibrary.org/authors/${a.key}`,
  }));
}

/** Búsqueda acotada al tipo exacto del Top 5 que se está armando. */
export async function searchTopKind(kind: TopKind, query: string, tmdbKey: string | undefined): Promise<SearchResult[]> {
  if (kind === "movie") {
    if (!tmdbKey) return [];
    const r = await tmdbFetcher(tmdbKey)<{ results: TmdbItem[] }>("/search/movie", { query });
    return r.results.map((m) => mapTmdb(m, "movie"));
  }
  if (kind === "artist") {
    const music = await searchDeezer(query);
    const artists = music.filter(m => m.externalId.startsWith("artist:"));
    return artists.length ? artists : searchArtists(query);
  }
  if (kind === "author") return searchAuthors(query);
  if (kind === "book") return searchBooks(query);
  const music = await searchMusic(parseQuery(query));
  return music.filter((m) => (kind === "album" ? m.externalId.startsWith("album:") : m.externalId.startsWith("song:")));
}

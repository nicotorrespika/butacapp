/**
 * Shared media types and labels used by search, lists and items.
 * Browser-safe (no server imports).
 */

export type MediaType = "movie" | "music" | "art";
export type ListKind = "movies" | "music" | "art" | "mixed";
export type SearchFilter = "all" | MediaType;

/** A normalized search result coming from any external provider. */
export interface SearchResult {
  /** Provider name, e.g. "tmdb", "itunes", "aic", "met". */
  source: string;
  /** Provider-specific id, unique within the source. */
  externalId: string;
  mediaType: MediaType;
  title: string;
  creator: string | null;
  year: number | null;
  imageUrl: string | null;
  /** Human label for the sub-kind: "Película", "Serie", "Álbum", "Canción", "Obra". */
  kindLabel: string;
  externalUrl: string | null;
}

export interface SearchResponse {
  movie: SearchResult[];
  music: SearchResult[];
  art: SearchResult[];
  /** Which provider served movies (tmdb when the key is configured). */
  movieProvider: "tmdb" | "basic";
  warnings: string[];
}

export const LIST_KIND_LABEL: Record<ListKind, string> = {
  movies: "Películas",
  music: "Música",
  art: "Arte",
  mixed: "Mixta",
};

export const MEDIA_LABEL: Record<MediaType, string> = {
  movie: "Películas",
  music: "Música",
  art: "Arte",
};

/** Verb used for the "done" toggle depending on media type. */
export const DONE_LABEL: Record<MediaType, { done: string; todo: string }> = {
  movie: { done: "Visto", todo: "Marcar visto" },
  music: { done: "Escuchado", todo: "Marcar escuchado" },
  art: { done: "Visitado", todo: "Marcar visitado" },
};

/** Which media types a list of a given kind accepts. */
export function listAccepts(kind: ListKind, media: MediaType): boolean {
  if (kind === "mixed") return true;
  return (
    (kind === "movies" && media === "movie") ||
    (kind === "music" && media === "music") ||
    (kind === "art" && media === "art")
  );
}

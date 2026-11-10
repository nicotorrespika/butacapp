/**
 * Shared media types and labels used by search, lists and items.
 * Browser-safe (no server imports).
 */

export type MediaType = "movie" | "music" | "book" | "art";
export type ListKind = "movies" | "music" | "books" | "art" | "mixed";
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

/** A person (director, actor…) matched by the movie search. */
export interface PersonResult {
  id: number;
  name: string;
  photoUrl: string | null;
  /** TMDB department, e.g. "Directing", "Acting". */
  department: string | null;
  knownFor: string[];
}

const DEPARTMENT_LABEL: Record<string, string> = {
  Directing: "Dirección",
  Acting: "Actuación",
  Writing: "Guion",
  Production: "Producción",
  Sound: "Música",
  Camera: "Fotografía",
  Editing: "Montaje",
  Art: "Arte",
  "Costume & Make-Up": "Vestuario",
  "Visual Effects": "Efectos visuales",
  Crew: "Equipo",
};
export const departmentLabel = (d: string | null | undefined) => (d ? (DEPARTMENT_LABEL[d] ?? d) : "Cine");

/** Route param for a movie page: "movie:123" → "movie-123"; IMDb ids ("tt…") stay as-is. */
export const movieRouteId = (externalId: string) => externalId.replace(":", "-");

/** Whether a stored/search item can open a movie page (TMDB or IMDb ids). */
export const hasMoviePage = (source: string, mediaType: string) =>
  mediaType === "movie" && (source === "tmdb" || source === "imdb");

export interface SearchResponse {
  /** People (directors, actors) matching the query; only with TMDB. */
  people: PersonResult[];
  movie: SearchResult[];
  music: SearchResult[];
  book: SearchResult[];
  art: SearchResult[];
  /** Which provider served movies (tmdb when the key is configured). */
  movieProvider: "tmdb" | "basic";
  warnings: string[];
}

export const LIST_KIND_LABEL: Record<ListKind, string> = {
  movies: "Películas",
  music: "Música",
  books: "Libros",
  art: "Arte",
  mixed: "Mixta",
};

export const MEDIA_LABEL: Record<MediaType, string> = {
  movie: "Cine",
  music: "Música",
  book: "Libros",
  art: "Arte",
};

/** Verb used for the "done" toggle depending on media type. */
export const DONE_LABEL: Record<MediaType, { done: string; todo: string }> = {
  movie: { done: "Visto", todo: "Marcar visto" },
  music: { done: "Escuchado", todo: "Marcar escuchado" },
  book: { done: "Leído", todo: "Lo leí" },
  art: { done: "Visitado", todo: "Marcar visitado" },
};

/** Which media types a list of a given kind accepts. */
export function listAccepts(kind: ListKind, media: MediaType): boolean {
  if (kind === "mixed") return true;
  return (
    (kind === "movies" && media === "movie") ||
    (kind === "music" && media === "music") ||
    (kind === "books" && media === "book") ||
    (kind === "art" && media === "art")
  );
}

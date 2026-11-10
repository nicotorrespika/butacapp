/**
 * Data shapes for the movie and person pages (browser-safe, no server imports).
 * Filled on the server from TMDB (catalogue, credits, suggestions) and OMDb
 * (IMDb / Rotten Tomatoes / Metacritic scores).
 */
import type { SearchResult } from "@/lib/media";

export interface CreditPerson {
  id: number;
  name: string;
  role: string | null;
  photoUrl: string | null;
}

export interface CriticScore {
  source: "tmdb" | "imdb" | "rt" | "metacritic";
  label: string;
  /** Display value, e.g. "8.1", "94%", "81". */
  value: string;
  /** Normalized 0–100 so the UI can color it consistently. */
  percent: number;
  url: string | null;
  votes?: number | undefined;
}

export interface SuggestionSection {
  id: "director" | "recommended" | "theme" | "genre";
  title: string;
  /** Present for "Más de {director}" → links to the full filmography. */
  personId?: number | undefined;
  items: SearchResult[];
}

export interface MovieDetail {
  routeId: string;
  type: "movie" | "tv";
  title: string;
  originalTitle: string | null;
  year: number | null;
  runtime: number | null;
  seasons: number | null;
  genres: string[];
  countries: string[];
  tagline: string | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerKey: string | null;
  directors: CreditPerson[];
  cast: CreditPerson[];
  scores: CriticScore[];
  links: { tmdb: string; imdb: string | null; letterboxd: string | null };
  /** Ready to add to a list. */
  result: SearchResult;
  sections: SuggestionSection[];
}

export interface PersonDetail {
  id: number;
  name: string;
  photoUrl: string | null;
  department: string | null;
  biography: string | null;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  /** Works directed (or created, for series), newest first. */
  directed: SearchResult[];
  /** Acting roles, newest first. */
  acted: SearchResult[];
  /** Writing / producing credits not already listed, newest first. */
  other: SearchResult[];
}

export type Fetched<T> = { ok: true; data: T } | { ok: false; reason: "no_key" | "not_found" | "provider" };

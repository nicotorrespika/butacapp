import { describe, expect, it } from "vitest";
import { selectTrailer } from "./movie-videos";
import { fetchMovieDetail } from "../server/tmdb-details";
import { vi, afterEach } from "vitest";

afterEach(() => vi.unstubAllGlobals());

describe("movie details", () => {
  it("selects only official Trailer videos hosted on YouTube", () => {
    expect(selectTrailer([
      { key: "aaaaaaaaaaa", site: "YouTube", type: "Trailer", official: false },
      { key: "bbbbbbbbbbb", site: "Vimeo", type: "Trailer", official: true },
      { key: "ccccccccccc", site: "YouTube", type: "Teaser", official: true },
      { key: "ddddddddddd", site: "YouTube", type: "Trailer", official: true },
    ])).toBe("ddddddddddd");
  });
  it("returns no trailer when none meets those requirements", () => {
    expect(selectTrailer([{ key: "aaaaaaaaaaa", site: "YouTube", type: "Trailer", official: false }])).toBeNull();
  });
  it("prefers a Spanish official trailer", () => {
    expect(selectTrailer([
      { key: "aaaaaaaaaaa", site: "YouTube", type: "Trailer", official: true, iso_639_1: "en" },
      { key: "bbbbbbbbbbb", site: "YouTube", type: "Trailer", official: true, iso_639_1: "es" },
    ])).toBe("bbbbbbbbbbb");
  });
  it("requests credits and videos together in Spanish, falls back to English synopsis and caps cast at 8", async () => {
    const urls: URL[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const url = new URL(input); urls.push(url);
      if (url.searchParams.get("language") === "en-US") return Response.json({ overview: "English synopsis" });
      return Response.json({ id: 42, title: "Película", overview: "", credits: { crew: [], cast: Array.from({ length: 12 }, (_, id) => ({ id, name: `Actor ${id}` })) }, videos: { results: [] } });
    }));
    const movie = await fetchMovieDetail("movie-42", "test-key", undefined);
    expect(urls[0]?.searchParams.get("language")).toBe("es-AR");
    expect(urls[0]?.searchParams.get("append_to_response")?.split(",")).toEqual(expect.arrayContaining(["credits", "videos"]));
    expect(movie.overview).toBe("English synopsis");
    expect(movie.cast).toHaveLength(8);
    expect(movie.trailerKey).toBeNull();
  });
});
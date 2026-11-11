import { describe, expect, it } from "vitest";
import { CATEGORY_COPY, TOP_KINDS_BY_CATEGORY, TOP_KIND_COPY } from "./copy";

describe("textos por categoría", () => {
  it("cada tipo de Top 5 habla de su propio elemento", () => {
    expect(TOP_KIND_COPY.artist.title).toBe("TOP 5 ARTISTAS");
    expect(TOP_KIND_COPY.artist.full).toContain("artistas");
    expect(TOP_KIND_COPY.artist.full).not.toContain("película");
    expect(TOP_KIND_COPY.author.title).toBe("TOP 5 AUTORES");
    expect(TOP_KIND_COPY.author.full).toContain("autores");
    expect(TOP_KIND_COPY.movie.title).toBe("TOP 5 PELÍCULAS");
    expect(TOP_KIND_COPY.album.plural).toBe("discos");
    expect(TOP_KIND_COPY.song.single).toBe("canción");
  });
  it("música y libros tienen selector de sub-tipos; eventos no tiene Top 5", () => {
    expect(TOP_KINDS_BY_CATEGORY.music.map((t) => t.kind)).toEqual(["artist", "album", "song"]);
    expect(TOP_KINDS_BY_CATEGORY.book.map((t) => t.kind)).toEqual(["author", "book"]);
    expect(TOP_KINDS_BY_CATEGORY.movie.map((t) => t.kind)).toEqual(["movie"]);
  });
  it("los verbos y estados cambian por categoría", () => {
    expect(CATEGORY_COPY.movie.done).toBe("La vi");
    expect(CATEGORY_COPY.music.done).toBe("Lo escuché");
    expect(CATEGORY_COPY.book.done).toBe("Lo leí");
    expect(CATEGORY_COPY.music.doneTab).toBe("Escuchados");
    expect(CATEGORY_COPY.book.doneTab).toBe("Leídos");
  });
});

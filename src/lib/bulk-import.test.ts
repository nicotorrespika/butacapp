import { describe, expect, it } from "vitest";
import { BULK_LIMIT, hiddenReason, nextPendingId, prepareCandidates, sortItems, splitExisting, type BulkCandidate } from "./bulk-import";

const c = (id: number, year: number | null = 2000): BulkCandidate => ({ source: "tmdb", externalId: `movie:${id}`, mediaType: "movie", title: `T${id}`, creator: null, year, imageUrl: null, kindLabel: "Película", externalUrl: null, hiddenReason: null });

describe("bulk import", () => {
  it("hides unreleased, making-of and documentaries", () => {
    expect(hiddenReason({ id: 1, release_date: "2999-01-01" }, "2026-01-01")).toBe("Sin estrenar");
    expect(hiddenReason({ id: 1, release_date: "1980-01-01", title: "The Making of The Shining" }, "2026-01-01")).toBe("Extra / making of");
    expect(hiddenReason({ id: 1, release_date: "1980-01-01", genre_ids: [99] }, "2026-01-01")).toBe("Documental");
    expect(hiddenReason({ id: 1, release_date: "1980-01-01", genre_ids: [18] }, "2026-01-01")).toBeNull();
  });
  it("caps imports at 100 works", () => {
    expect(prepareCandidates(Array.from({ length: 150 }, (_, i) => c(i)))).toHaveLength(BULK_LIMIT);
    expect(BULK_LIMIT).toBe(100);
  });
  it("filters by year range", () => {
    expect(prepareCandidates([c(1, 1960), c(2, 1990)], { fromYear: 1980 }).map((x) => x.externalId)).toEqual(["movie:2"]);
  });
  it("reports works already in the list", () => {
    const r = splitExisting([c(1), c(2), c(3)], [{ source: "tmdb", external_id: "movie:2" }]);
    expect(r.fresh).toHaveLength(2);
    expect(r.duplicates).toBe(1);
  });
  it("custom order follows saved position and marks the first pending as next", () => {
    const rows = [
      { id: "a", title: "A", year: 2001, created_at: "1", position: 2, done: false },
      { id: "b", title: "B", year: 1999, created_at: "2", position: 1, done: true },
    ];
    const sorted = sortItems(rows, "custom");
    expect(sorted.map((r) => r.id)).toEqual(["b", "a"]);
    expect(nextPendingId(sorted)).toBe("a");
  });
});

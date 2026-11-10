import { describe, expect, it } from "vitest";
import { filterForListKind } from "./add-item";

describe("filterForListKind", () => {
  it("opens search on the chip matching the list type", () => {
    expect(filterForListKind("movies")).toBe("movie");
    expect(filterForListKind("music")).toBe("music");
    expect(filterForListKind("art")).toBe("art");
  });
  it("searches everything for mixed lists", () => {
    expect(filterForListKind("mixed")).toBe("all");
  });
});

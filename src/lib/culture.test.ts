import { describe, expect, it } from "vitest";
import { listAccepts } from "./media";
import { availableCulture, dateRange, eventPriceMatches, verifyCultureResult } from "./culture";
const book = { source: "openlibrary", externalId: "/works/OL1W", mediaType: "book" as const, title: "Rayuela", creator: "Julio Cortázar", year: 1963, imageUrl: null, kindLabel: "Libro", externalUrl: null };
describe("culture rules", () => {
  it("accepts books in book and mixed lists, never movie lists", () => { expect(listAccepts("books", "book")).toBe(true); expect(listAccepts("mixed", "book")).toBe(true); expect(listAccepts("movies", "book")).toBe(false); });
  it("only confirms exact titles, authors and known years", () => { expect(verifyCultureResult(book, "Rayuela", "Julio Cortazar", 1963)).toBe(true); expect(verifyCultureResult(book, "Rayuela", "Borges", 1963)).toBe(false); expect(verifyCultureResult(book, "Rayuela", "Julio Cortazar", 1964)).toBe(false); });
  it("excludes consumed, queued and dismissed works", () => { for (const flag of ["consumed", "queued", "dismissed"]) expect(availableCulture([book], [{source:book.source,external_id:book.externalId,consumed:false,queued:false,dismissed:false,[flag]:true}], [])).toEqual([]); });
  it("unknown prices are never advertised as free or paid", () => { expect(eventPriceMatches(null, "free")).toBe(false); expect(eventPriceMatches(null, "paid")).toBe(false); expect(eventPriceMatches(0, "free")).toBe(true); expect(eventPriceMatches(500, "paid")).toBe(true); });
  it("agenda includes paid, free and unknown prices together", () => { expect([0,500,null].filter(price=>eventPriceMatches(price,"all"))).toEqual([0,500,null]); });
  it("today uses Buenos Aires midnight", () => { expect(dateRange("today", "", new Date("2026-11-10T16:00:00Z"))).toEqual({start:"2026-11-10T03:00:00.000Z",end:"2026-11-11T03:00:00.000Z"}); });
  it("this weekend covers Saturday and Sunday", () => { expect(dateRange("weekend", "", new Date("2026-11-10T16:00:00Z"))).toEqual({start:"2026-11-14T03:00:00.000Z",end:"2026-11-16T03:00:00.000Z"}); });
});
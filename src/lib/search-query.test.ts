import { describe, expect, it } from "vitest";
import { parseQuery } from "./search-query";
import { averageScore } from "./ratings";

describe("parseQuery", () => {
  it("splits author + year", () => {
    expect(parseQuery("Tarkovsky 1979")).toEqual({ text: "Tarkovsky", year: 1979 });
  });
  it("treats a bare year as a year-only search", () => {
    expect(parseQuery("1994")).toEqual({ text: "", year: 1994 });
  });
  it("keeps band + album as plain text", () => {
    expect(parseQuery("Radiohead OK Computer")).toEqual({ text: "Radiohead OK Computer", year: null });
  });
  it("does not treat non-year numbers as years", () => {
    // 2049 is in the future → part of the title, not a year filter.
    expect(parseQuery("Blade Runner 2049")).toEqual({ text: "Blade Runner 2049", year: null });
    expect(parseQuery("Ocean's 11").year).toBeNull();
  });
});

describe("averageScore", () => {
  it("averages 1–10 scores to one decimal", () => {
    expect(averageScore([10, 8, 8])).toBe(8.7);
  });
  it("is null when nobody rated", () => {
    expect(averageScore([])).toBeNull();
  });
});

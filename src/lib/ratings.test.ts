import { describe, expect, it } from "vitest";
import { averageScore, MAX_SCORE, ratingScore, starFill } from "./ratings";

describe("ten-point ratings", () => {
  it("shows 7 as three full stars and one half star",()=>{expect([1,2,3,4,5].map(s=>starFill(7,s))).toEqual([1,1,1,0.5,0]);});
  it("accepts the requested endpoints 1 and 10", () => {
    expect(MAX_SCORE).toBe(10);
    expect(averageScore([1, 10])).toBe(5.5);
    expect(averageScore([0, 11])).toBeNull();
  });
  it("preserves legacy ratings on the new scale", () => {
    expect(ratingScore({ score: 4, score_10: null })).toBe(8);
    expect(ratingScore({ score: 5, score_10: 9 })).toBe(9);
  });
});
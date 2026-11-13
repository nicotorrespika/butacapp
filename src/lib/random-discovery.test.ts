import { expect, it } from "vitest";
import { randomMix, randomPersonalShare } from "./random-discovery";
const history = (n: number) => Array.from({ length: n }, (_, i) => ({ signal_key: `search:${i}` }));
const items = (prefix: string, n = 40) => Array.from({ length: n }, (_, i) => ({ source: "catalog", externalId: `${prefix}${i}` }));
it("keeps Random mostly generic with little history but retains taste connections", () => {
  const picks = randomMix(items("general"), items("taste"), [], () => 0.5);
  expect(picks.filter(p => p.externalId.startsWith("general"))).toHaveLength(30);
  expect(picks.filter(p => p.externalId.startsWith("taste"))).toHaveLength(10);
});
it("progressively personalizes only with a broad history and retains exploration", () => {
  expect(randomPersonalShare(history(50))).toBeCloseTo(0.525);
  const picks = randomMix(items("general"), items("taste"), history(100), () => 0.5);
  expect(picks.filter(p => p.externalId.startsWith("taste"))).toHaveLength(32);
  expect(picks.filter(p => p.externalId.startsWith("general"))).toHaveLength(8);
});
it("repeated searches cannot create a false broad history", () => {
  expect(randomPersonalShare(Array(100).fill({ signal_key: "search:Paul Auster" }))).toBeCloseTo(0.2555);
});
it("still offers generic results with no taste matches and never duplicates works", () => {
  const generic = items("general", 20);
  expect(randomMix(generic, [], [], () => 0.5)).toHaveLength(20);
  const picks = randomMix(generic, generic, history(100), () => 0.5);
  expect(new Set(picks.map(p => p.externalId)).size).toBe(picks.length);
});
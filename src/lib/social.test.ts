import { expect, it } from "vitest";
import { topFive, viewingStats } from "./social";
it("limits the personal top to five films", () => {
  expect(topFive(Array.from({length:7},(_,i)=>({title:`Film ${i}`,externalId:`movie:${i}`})))).toHaveLength(5);
});
it("counts only personal viewing records and computes their ten-point average", () => {
  expect(viewingStats([{score_10:8,genres:["Drama"]},{score_10:10,genres:["Drama","Misterio"]}])).toEqual({watched:2,average:9,genres:["Drama","Misterio"]});
});
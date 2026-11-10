import { expect, it } from "vitest";
import { excludeExisting } from "./recommendation-types";

it("does not recommend movies already in the list", () => {
  expect(excludeExisting([{ title: "Amelie", year: 2001 }, { title: "Stalker", year: 1979 }], [{ title: "Amélie", year: 2001 }])).toEqual([{ title: "Stalker", year: 1979 }]);
});
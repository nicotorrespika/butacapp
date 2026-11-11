import { describe, expect, it } from "vitest";
import { cityVariants, normalizeCity } from "./cities";

describe("normalizeCity", () => {
  it("unifica tildes y mayúsculas", () => {
    expect(normalizeCity("Cordoba")).toBe("Córdoba");
    expect(normalizeCity("CORDOBA")).toBe("Córdoba");
    expect(normalizeCity("córdoba")).toBe("Córdoba");
  });
  it("mapea alias de Buenos Aires", () => {
    expect(normalizeCity("CABA")).toBe("Ciudad de Buenos Aires");
    expect(normalizeCity("Buenos Aires")).toBe("Ciudad de Buenos Aires");
  });
  it("conserva ciudades desconocidas con formato prolijo", () => {
    expect(normalizeCity("  villa   maría ")).toBe("Villa María");
  });
  it("cityVariants incluye la forma cruda y la normalizada", () => {
    expect(cityVariants("Cordoba")).toEqual(["Cordoba", "Córdoba"]);
    expect(cityVariants("Córdoba")).toEqual(["Córdoba"]);
  });
});

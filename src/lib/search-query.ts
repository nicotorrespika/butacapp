/**
 * Query understanding for the unified search bar.
 * Splits a free-text query into the "text" part and an optional year,
 * so "Tarkovsky 1979" becomes { text: "Tarkovsky", year: 1979 }
 * and "1994" becomes { text: "", year: 1994 }.
 */

export interface ParsedQuery {
  text: string;
  year: number | null;
}

const YEAR_RE = /^(1[5-9]\d{2}|20\d{2})$/;

export function parseQuery(raw: string): ParsedQuery {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  let year: number | null = null;
  const rest: string[] = [];
  for (const t of tokens) {
    const clean = t.replace(/[(),.]/g, "");
    // Only the first year-looking token is treated as a year filter.
    if (year === null && YEAR_RE.test(clean)) {
      const n = Number(clean);
      if (n <= new Date().getFullYear() + 2) {
        year = n;
        continue;
      }
    }
    rest.push(t);
  }
  return { text: rest.join(" "), year };
}

/** Extracts a 4-digit year from strings like "1979-05-25" or "c. 1889". */
export function extractYear(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value || null;
  if (typeof value !== "string") return null;
  const m = value.match(/(1[0-9]\d{2}|20\d{2})/);
  return m ? Number(m[1]) : null;
}

/** Sorts results so those matching the requested year come first (stable). */
export function boostYear<T extends { year: number | null }>(items: T[], year: number | null): T[] {
  if (!year) return items;
  return [...items].sort((a, b) => Number(b.year === year) - Number(a.year === year));
}

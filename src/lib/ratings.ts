/** Rating helpers. Scores are 1–5 stars, one per user per item. */

export const MIN_SCORE = 1;
export const MAX_SCORE = 5;

/** Group average rounded to one decimal, or null when nobody rated yet. */
export function averageScore(scores: number[]): number | null {
  const valid = scores.filter((s) => s >= MIN_SCORE && s <= MAX_SCORE);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(avg * 10) / 10;
}

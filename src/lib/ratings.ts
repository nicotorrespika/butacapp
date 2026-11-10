/** Rating helpers. Scores are 1–10, one per user per item. */

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;

export const ratingScore = (r: { score_10: number | null; score: number }) => r.score_10 ?? r.score * 2;

/** Group average rounded to one decimal, or null when nobody rated yet. */
export function averageScore(scores: number[]): number | null {
  const valid = scores.filter((s) => s >= MIN_SCORE && s <= MAX_SCORE);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(avg * 10) / 10;
}

/** Five visual stars, with each half worth one point. */
export const starFill = (score: number | null, star: number) => Math.max(0, Math.min(1, (score ?? 0) / 2 - (star - 1)));

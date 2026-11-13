/** Distinct category-specific searches/actions, not repeated clicks, build confidence. */
export function randomPersonalShare(history: { signal_key: string }[]): number {
  const count = new Set(history.map(s => s.signal_key)).size;
  return 0.25 + 0.55 * Math.min(count / 100, 1);
}

export function randomMix<T extends { source: string; externalId: string }>(
  general: T[], personal: T[], history: { signal_key: string }[], rng = Math.random,
): T[] {
  const unique = (items: T[]) => [...new Map(items.map(i => [`${i.source}:${i.externalId}`, i])).values()];
  const shuffle = (items: T[]) => {
    const result = unique(items);
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const broad = shuffle(general);
  const related = shuffle(personal);
  const target = Math.min(40, unique([...broad, ...related]).length);
  const relatedCount = Math.min(related.length, Math.floor(target * randomPersonalShare(history)));
  const chosen = related.slice(0, relatedCount);
  const ids = new Set(chosen.map(i => `${i.source}:${i.externalId}`));
  const exploration = broad.filter(i => !ids.has(`${i.source}:${i.externalId}`));
  return shuffle(unique([...chosen, ...exploration]).slice(0, target));
}
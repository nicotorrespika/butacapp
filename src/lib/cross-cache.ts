/** Catalog, list and shared-link IDs must all address the same movie cache. */
export async function crossMovieId(id: string, findImdb: (id: string) => Promise<{ movie_results: { id: number }[]; tv_results: { id: number }[] }>): Promise<string | null> {
  const normalized = id.replace(/^(movie|tv):/, '$1-');
  if (/^(movie|tv)-\d+$/.test(normalized)) return normalized;
  if (/^\d+$/.test(normalized)) return `movie-${normalized}`;
  if (!/^tt\d+$/.test(normalized)) return null;
  const found = await findImdb(normalized);
  const movie = found.movie_results[0];
  if (movie) return `movie-${movie.id}`;
  const tv = found.tv_results[0];
  return tv ? `tv-${tv.id}` : null;
}

export function hasCrossConnections(data: { movie?: unknown[]; music?: unknown[]; book?: unknown[] } | null | undefined, kind: 'movie' | 'culture') {
  if (!data) return false;
  return kind === 'movie' ? !!data.music?.length && !!data.book?.length : !!data.movie?.length || !!data.music?.length || !!data.book?.length;
}
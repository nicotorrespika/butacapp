export function hasCrossConnections(data: { movie?: unknown[]; music?: unknown[]; book?: unknown[] } | null | undefined, kind: 'movie' | 'culture') {
  if (!data) return false;
  return kind === 'movie' ? !!data.music?.length && !!data.book?.length : !!data.movie?.length || !!data.music?.length || !!data.book?.length;
}
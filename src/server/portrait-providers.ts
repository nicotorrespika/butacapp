import { getJson, tmdbFetcher } from './search-providers';
import { normalizeTaste } from '@/lib/tastes';

export async function resolvePortrait(kind: string, name: string, source: string, externalId: string, tmdbKey?: string) {
  if (kind === 'artist') {
    try {
      const r = await getJson<{ data: { name: string; picture_medium?: string }[] }>(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=5`);
      const exact = r.data.find(a => normalizeTaste(a.name) === normalizeTaste(name));
      if (exact?.picture_medium) return exact.picture_medium;
    } catch { /* Other providers remain available. */ }
  }
  if (kind === 'author' && source === 'openlibrary') {
    const id = externalId.replace(/^author:/, '').replace('/authors/', '');
    const url = `https://covers.openlibrary.org/a/olid/${encodeURIComponent(id)}-M.jpg?default=false`;
    try { const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) }); if (r.ok && r.headers.get('content-type')?.startsWith('image/')) return url; } catch { /* Try a verified encyclopedia portrait. */ }
  }
  if (kind === 'director' && tmdbKey) {
    try {
      const r = await tmdbFetcher(tmdbKey)<{ results: { name: string; profile_path: string | null }[] }>('/search/person', { query: name });
      const exact = r.results.find(p => normalizeTaste(p.name) === normalizeTaste(name));
      if (exact?.profile_path) return `https://image.tmdb.org/t/p/w185${exact.profile_path}`;
    } catch { /* Try another source. */ }
  }
  for (const lang of ['es', 'en']) {
    try {
      const r = await getJson<{ title: string; type?: string; thumbnail?: { source: string } }>(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
      if (r.type !== 'disambiguation' && normalizeTaste(r.title) === normalizeTaste(name) && r.thumbnail?.source) return r.thumbnail.source;
    } catch { /* No invented portraits. */ }
  }
  return null;
}
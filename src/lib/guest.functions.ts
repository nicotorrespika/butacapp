import { createServerFn } from '@tanstack/react-start';
import { guestDetailSchema } from './guest-catalog';
import { cultureDetail } from '@/server/culture-providers';
import { tmdbFetcher } from '@/server/search-providers';

export const getGuestDetail = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => guestDetailSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      if (data.source !== 'tmdb') {
        const detail = await cultureDetail(data.source, data.id);
        // Avoid exposing English book copy as if it were localized, and never run AI for guests.
        return { ok: true as const, description: data.source === 'openlibrary' ? null : detail.description, genres: detail.genres, creator: detail.result.creator, duration: null, pages: detail.pages, links: detail.links };
      }
      const key = process.env['TMDB_API_KEY'];
      if (!key) throw new Error('Unavailable');
      const [type, id] = data.id.split(':');
      const d = await tmdbFetcher(key)<{ overview?: string; runtime?: number; genres?: { name: string }[]; credits?: { crew?: { job: string; name: string }[] } }>(`/${type}/${id}`, { append_to_response: 'credits' });
      return { ok: true as const, description: d.overview ?? null, genres: (d.genres ?? []).map(g => g.name), creator: d.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(' · ') || null, duration: d.runtime ?? null, pages: null, links: [{ label: 'Ficha en TMDB', url: `https://www.themoviedb.org/${type}/${id}` }] };
    } catch { return { ok: false as const }; }
  });
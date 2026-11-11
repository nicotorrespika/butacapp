import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getTopPortraits = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid(), kind: z.enum(['artist', 'author', 'director']) }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.supabase.from('top_five_entries').select('id,title,source,external_id').eq('user_id', data.userId).eq('kind', data.kind).order('position').limit(5);
    if (rows.error) throw rows.error;
    const { cachedCatalog } = await import('@/server/catalog-cache');
    const { resolvePortrait } = await import('@/server/portrait-providers');
    return Promise.all(rows.data.map(async r => ({ id: r.id, url: await cachedCatalog(context.supabase, `portrait:v1:${data.kind}:${r.source}:${r.external_id}`, () => resolvePortrait(data.kind, r.title, r.source, r.external_id, process.env['TMDB_API_KEY']), 30).catch(() => null) })));
  });
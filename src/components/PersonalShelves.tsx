import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { getSimilar } from '@/lib/similar.functions';
import { searchMedia } from '@/lib/search.functions';
import { cultureRouteId } from '@/lib/culture';
import { movieRouteId, type SearchResult } from '@/lib/media';
import { chooseShelfAnchor, shelfTitle, uniqueShelfItems, type ShelfCategory, type ShelfAnchor } from '@/lib/home-shelves';
import { tasteKey } from '@/lib/tastes';
import { RecommendationShelf } from './RecommendationShelf';

export function PersonalShelves({ category }: { category: ShelfCategory }) {
  const { user } = useAuth(); const similar = useServerFn(getSimilar); const search = useServerFn(searchMedia);
  const anchors = useQuery({ queryKey: ['tastes', 'home-anchors', user?.id, category], enabled: !!user, queryFn: async () => {
    const uid = user?.id ?? '';
    const [entries, top, signals, recommendations] = await Promise.all([
      category === 'movie' ? supabase.from('movie_entries').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(100) : supabase.from('cultural_entries').select('*').eq('user_id', uid).eq('media_type', category).order('updated_at', { ascending: false }).limit(100),
      supabase.from('top_five_entries').select('*').eq('user_id', uid).in('kind', category === 'movie' ? ['movie'] : category === 'book' ? ['author', 'book'] : ['artist', 'album', 'song']).order('position'),
      supabase.from('taste_signals').select('source,external_id,excluded').eq('user_id', uid).eq('category', category),
      supabase.from('taste_recommendations').select('*').eq('user_id', uid).eq('category', category).order('score', { ascending: false }).limit(100),
    ]);
    if (entries.error || top.error || signals.error || recommendations.error) throw entries.error ?? top.error ?? signals.error ?? recommendations.error;
    const excluded = new Set((signals.data ?? []).filter(s => s.excluded).map(s => tasteKey(s.source, s.external_id)));
    const personal: ShelfAnchor[] = (entries.data ?? []).map(e => {
      const consumed = 'watched' in e ? e.watched : e.consumed;
      if (consumed || e.dismissed) excluded.add(tasteKey(e.source, e.external_id));
      return { source: e.source, externalId: e.external_id, title: e.title, creator: 'creator' in e ? e.creator : null, favorite: e.favorite, consumed };
    });
    const topAnchors = (top.data ?? []).map(e => ({ source: e.source, externalId: e.external_id, title: e.title, creator: e.creator, favorite: true, consumed: false }));
    return { anchor: chooseShelfAnchor([...topAnchors, ...personal]), excluded, recommendations: recommendations.data ?? [] };
  } });
  const anchor = anchors.data?.anchor;
  const picks = useQuery({ queryKey: ['tastes', 'home-shelves', user?.id, category, anchor?.source, anchor?.externalId, anchors.data?.recommendations.map(r => r.id)], enabled: !!anchor, staleTime: 5 * 60_000, queryFn: async () => {
    if (!anchor || !anchors.data) return { similar: [], latin: [] };
    const id = category === 'movie' ? movieRouteId(anchor.externalId) : cultureRouteId(anchor.source, anchor.externalId);
    const response = await similar({ data: { kind: category === 'movie' ? 'movie' : 'culture', id, generate: false, page: 1 } });
    const cached = anchors.data.recommendations.filter(r => tasteKey(r.anchor_source, r.anchor_id) === tasteKey(anchor.source, anchor.externalId)).map(r => ({ source: r.source, externalId: r.external_id, mediaType: category, title: r.title, creator: r.creator, year: r.year, imageUrl: r.image_url, kindLabel: category === 'book' ? 'Libro' : category === 'music' ? 'Disco' : 'Película', externalUrl: r.external_url } as SearchResult));
    let regular = response.ok ? response.data.similar.map(i => i.result) : cached;
    if (!regular.length && category !== 'movie') {
      const found = await search({ data: { q: anchor.creator ?? anchor.title, filter: category } }); regular = found[category];
    }
    const excluded = new Set(anchors.data.excluded); excluded.add(tasteKey(anchor.source, anchor.externalId));
    return { similar: uniqueShelfItems(regular, category, excluded), latin: uniqueShelfItems(response.ok ? response.data.latin.map(i => i.result) : [], category, excluded) };
  } });
  if (!user || !anchor) return null;
  return <>
    {(picks.isLoading || !!picks.data?.similar.length) && <RecommendationShelf title={shelfTitle(category, anchor)} subtitle={category !== 'movie' && !picks.data?.latin.length ? 'Más para explorar desde tus favoritos.' : undefined} items={picks.data?.similar ?? []} loading={picks.isLoading} />}
    {!!picks.data?.latin.length && <RecommendationShelf title={`¿Y si ${category === 'movie' ? 'vemos' : category === 'book' ? 'leemos' : 'escuchamos'} algo latino?`} subtitle={`En la misma onda que ${anchor.title}`} items={picks.data.latin} />}
  </>;
}
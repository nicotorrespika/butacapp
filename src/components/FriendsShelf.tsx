import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { friendsQuery } from '@/lib/social';
import { consumedFriendActivity, type ShelfCategory } from '@/lib/home-shelves';
import { cultureRouteId } from '@/lib/culture';
import { movieRouteId } from '@/lib/media';
import { Poster } from './Poster';
import { UserAvatar } from './UserAvatar';
import { Button } from './ui/button';

export function FriendsShelf({ category }: { category: ShelfCategory }) {
  const { user } = useAuth(); const uid = user?.id ?? '';
  const friends = useQuery({ ...friendsQuery(uid), enabled: !!uid });
  const accepted = friends.data?.filter(f => f.status === 'accepted') ?? [];
  const ids = accepted.map(f => f.sender_id === uid ? f.receiver_id : f.sender_id);
  const feed = useQuery({ queryKey: ['social', 'friends-shelf', uid, category, ids], enabled: !!ids.length, queryFn: async () => {
    const r = await supabase.from('activity').select('*').in('user_id', ids).eq('category', category).eq('kind', 'watched').order('created_at', { ascending: false }).limit(40);
    if (r.error) throw r.error;
    const seen = new Set<string>();
    return (r.data ?? []).filter(a => { const key = `${a.user_id}:${a.source}:${a.external_id}`; if (!consumedFriendActivity(a, category) || !a.external_id || !a.source || seen.has(key)) return false; seen.add(key); return true; }).slice(0, 12);
  } });
  if (!user) return null;
  return <section className="px-4 py-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h2 className="cinema-heading min-w-0 text-xl">Tus amigos {category === 'movie' ? 'vieron' : category === 'music' ? 'escucharon' : 'leyeron'}…</h2><Button asChild variant="ghost"><Link to="/friends">Ver amigos</Link></Button></div>
    {feed.isError ? <p className="py-3 text-xs text-muted-foreground">No pudimos cargar lo de tu gente.</p> : !feed.data?.length ? <p className="py-3 text-xs text-muted-foreground">{ids.length ? 'Todavía no hay novedades por acá.' : 'Sumá amigos para ver sus últimas elecciones.'}</p> : <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-none" role="region" aria-label="Últimas elecciones de amigos" tabIndex={0}>{feed.data.map(a => {
      const profile = accepted.find(f => f.profile?.id === a.user_id)?.profile;
      const cover = <><Poster src={a.image_url} alt={a.title} media={category} aspect="aspect-square" /><h3 className="mt-2 line-clamp-2 font-display text-base text-primary">{a.title}</h3></>;
      return <article key={a.id} className="w-28 shrink-0 snap-start">{category === 'movie' ? <Link to="/movie/$movieId" params={{ movieId: movieRouteId(a.external_id ?? '') }}>{cover}</Link> : <Link to="/culture/$cultureId" params={{ cultureId: cultureRouteId(a.source ?? '', a.external_id ?? '') }}>{cover}</Link>}<Link to="/people/$userId" params={{ userId: a.user_id }} className="mt-1 flex min-h-11 items-center gap-1.5"><UserAvatar name={profile?.display_name} url={profile?.avatar_url} className="size-5 shrink-0" /><span className="truncate text-xs text-muted-foreground">{profile?.username ?? profile?.display_name ?? 'Tu amigo'}</span></Link></article>;
    })}</div>}
  </section>;
}
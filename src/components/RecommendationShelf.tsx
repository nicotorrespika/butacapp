import { useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { ResultCard } from './ResultCard';
import { useAddToList } from '@/hooks/use-add-to-list';
import { movieRouteId, type SearchResult } from '@/lib/media';
import { cultureRouteId } from '@/lib/culture';
import { tasteKey } from '@/lib/tastes';

export function RecommendationShelf({ title, subtitle, items, loading = false, listId }: { title: string; subtitle?: string | undefined; items: SearchResult[]; loading?: boolean; listId?:string }) {
  const row = useRef<HTMLDivElement>(null); const navigate = useNavigate(); const add = useAddToList(listId);
  return <section className="min-w-0 px-4 py-5">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div className="min-w-0"><h2 className="cinema-heading break-words text-2xl sm:text-3xl">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>
      {!!items.length && <div className="hidden shrink-0 sm:flex"><Button variant="ghost" size="icon" aria-label={`Anterior: ${title}`} onClick={() => row.current?.scrollBy({ left: -360, behavior: 'smooth' })}><ChevronLeft /></Button><Button variant="ghost" size="icon" aria-label={`Siguiente: ${title}`} onClick={() => row.current?.scrollBy({ left: 360, behavior: 'smooth' })}><ChevronRight /></Button></div>}
    </div>
    <div ref={row} className="mt-4 flex snap-x snap-proximity gap-4 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none" role="region" aria-label={title} tabIndex={0}>
      {loading ? [0, 1, 2, 3].map(i => <div key={i} className="w-36 shrink-0 animate-pulse motion-reduce:animate-none sm:w-44"><div className="aspect-[4/5] bg-muted" /><div className="mt-3 h-4 w-3/4 bg-muted" /></div>) : items.map(r => <ResultCard key={tasteKey(r.source, r.externalId)} className="w-36 shrink-0 snap-start sm:w-44" result={r} targetName={add.targetList?.name} onAdd={add.add} busy={add.isBusy(r)} added={add.isAdded(r)} onOpen={r => r.mediaType === 'movie' ? navigate({ to: '/movie/$movieId', params: { movieId: movieRouteId(r.externalId) } }) : navigate({ to: '/culture/$cultureId', params: { cultureId: cultureRouteId(r.source, r.externalId) } })} />)}
    </div>
    {add.sheet}
  </section>;
}
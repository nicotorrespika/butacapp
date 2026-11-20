import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowUpRight, Loader2, Search } from 'lucide-react';
import { searchGuestCatalog } from '@/lib/search.functions';
import { getGuestDetail } from '@/lib/guest.functions';
import { guestDetailSchema } from '@/lib/guest-catalog';
import { type SearchResult } from '@/lib/media';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Poster } from './Poster';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

type Category = 'all' | 'movie' | 'music' | 'book';
export function GuestCatalog({ initialQuery = '', initialFilter = 'all', home = false }: { initialQuery?: string; initialFilter?: Category; home?: boolean }) {
  const [text, setText] = useState(initialQuery);
  const [filter, setFilter] = useState<Category>(initialFilter);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const q = useDebouncedValue(text.trim(), 450);
  const search = useServerFn(searchGuestCatalog);
  const navigate = useNavigate();
  const results = useQuery({ queryKey: ['guest-catalog', q, filter], enabled: q.length >= 2, staleTime: 300_000, retry: 1, queryFn: () => search({ data: { q, filter } }) });
  const categories = filter === 'all' ? ['movie', 'music', 'book'] as const : [filter];
  const labels = { all: 'Todo', movie: 'Cine', music: 'Música', book: 'Libros' };
  return <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6">
    <header className="flex items-center justify-between gap-3"><Link to="/" className="cinema-heading text-xl text-primary">MOMENTO BUTACA</Link><Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button></header>
    {!home && <Button asChild variant="ghost" className="mt-3"><Link to="/"><ArrowLeft/>Volver</Link></Button>}
    <h1 className="mt-8 font-heading text-4xl font-semibold uppercase sm:text-5xl">{home ? '¿Qué vamos a descubrir hoy?' : 'Buscá tu próxima obsesión'}</h1>
    <form className="mt-6 flex gap-2" onSubmit={e => { e.preventDefault(); if (text.trim().length >= 2) void navigate({ to: '/buscar', search: { q: text.trim(), f: filter } }); }}><Input type="search" aria-label="Buscar películas, música y libros" placeholder="Película, artista, disco, escritor…" className="h-11 min-w-0 text-base" value={text} maxLength={120} onChange={e => setText(e.target.value)}/><Button type="submit" className="h-11 px-3"><Search className="size-4"/>Buscar</Button></form>
    <div role="tablist" aria-label="Categorías" className="mt-4 flex gap-1 overflow-x-auto">{(['all', 'movie', 'music', 'book'] as const).map(c => <Button key={c} role="tab" aria-selected={filter === c} variant="ghost" className={filter === c ? 'border-b border-primary rounded-none text-primary' : 'text-muted-foreground'} onClick={() => setFilter(c)}>{labels[c]}</Button>)}</div>
    {q.length < 2 && <section className="mt-8 border-t border-border pt-5"><div className="flex flex-wrap gap-2">{['Coraline', 'Charly García', 'Paul Auster', 'Medianoche en París'].map(t => <Button key={t} variant="outline" onClick={() => setText(t)}>{t}<ArrowUpRight className="size-3"/></Button>)}</div></section>}
    {results.isFetching && q.length >= 2 && <p role="status" className="mt-7 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Buscando…</p>}
    {results.isError && <div className="mt-6"><p>No pudimos buscar. Probá de nuevo.</p><Button variant="ghost" onClick={() => void results.refetch()}>Reintentar</Button></div>}
    {results.data?.warnings.map(w => <p key={w} className="mt-3 text-sm text-muted-foreground">{w}</p>)}
    {results.data && categories.map(c => results.data[c].length > 0 && <section key={c} className="mt-8"><h2 className="cinema-heading text-2xl">{labels[c]}</h2><div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6">{results.data[c].map(r => <div key={`${r.source}:${r.externalId}`} className="min-w-0"><Button variant="ghost" className="block h-auto w-full p-0" aria-label={`Ver ${r.title}`} onClick={() => setSelected(r)}><Poster src={r.imageUrl} alt={r.title} media={r.mediaType}/></Button><Button variant="ghost" className="mt-2 h-auto min-h-11 w-full justify-start px-0 py-1 text-left whitespace-normal" onClick={() => setSelected(r)}><span className="line-clamp-2 font-display text-lg italic leading-tight text-primary">{r.title}</span></Button><p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{r.creator ?? r.year ?? r.kindLabel}</p></div>)}</div></section>)}
    {results.data && !results.isFetching && !categories.some(c => results.data[c].length) && <p className="mt-8 text-sm text-muted-foreground">No encontramos coincidencias. Probá con otro título o nombre.</p>}
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-5"><p className="flex-1 text-sm text-muted-foreground">Tus listas y tu gente, en una cuenta gratis.</p><Button asChild variant="outline"><Link to="/auth" search={{ mode: 'signup' }}>Crear cuenta</Link></Button></div>
    <p className="mt-5 text-xs text-muted-foreground">Catálogo: TMDB, Open Library y proveedores musicales.</p>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto pr-10">{selected && <GuestWork result={selected}/>}</DialogContent></Dialog>
  </div>;
}

function GuestWork({ result }: { result: SearchResult }) {
  const call = useServerFn(getGuestDetail);
  const valid = guestDetailSchema.safeParse({ source: result.source, id: result.externalId });
  const details = useQuery({ queryKey: ['guest-detail', result.source, result.externalId], enabled: valid.success, staleTime: 600_000, retry: false, queryFn: async () => { if (!valid.success) throw new Error('Unsupported catalog'); return await call({ data: valid.data }); } });
  const d = details.data?.ok ? details.data : null;
  return <><div className="flex items-start gap-4"><div className="w-24 shrink-0"><Poster src={result.imageUrl} alt={result.title} media={result.mediaType}/></div><div className="min-w-0"><DialogTitle className="font-display text-3xl italic leading-tight text-primary">{result.title}</DialogTitle><DialogDescription className="mt-3 text-xs leading-5">{d?.creator ?? result.creator}{result.year ? ` · ${result.year}` : ''}{d?.duration ? ` · ${d.duration} min` : ''}{d?.pages ? ` · ${d.pages} páginas` : ''}</DialogDescription></div></div>
    {details.isFetching && <p role="status" className="text-sm text-muted-foreground">Cargando ficha…</p>}
    {!!d?.genres.length && <p className="text-xs text-muted-foreground">{d.genres.slice(0, 5).join(' · ')}</p>}
    {d?.description && <p className="text-sm leading-6">{d.description}</p>}
    {(d?.links ?? (result.externalUrl ? [{ label: 'Ver en el catálogo', url: result.externalUrl }] : [])).map(l => <Button key={l.url} asChild variant="ghost" className="justify-start whitespace-normal"><a href={l.url} target="_blank" rel="noreferrer">{l.label}<ArrowUpRight/></a></Button>)}
    <Button asChild variant="outline"><Link to="/auth" search={{ mode: 'signup' }}>Crear cuenta para guardar</Link></Button>
  </>;
}
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, BookOpen, Check, Disc3, Film, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { searchTopEntries } from '@/lib/top-five.functions';
import { type SearchResult } from '@/lib/media';
import { workTags } from '@/lib/tastes';
import { choiceKey, emptyChoices, initialTopKind, onboardingComplete, readOnboardingDraft, stepComplete, toggleChoice, type OnboardingCategory } from '@/lib/onboarding';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Poster } from './Poster';
import welcomeImage from '@/assets/theater-curtain.jpg.asset.json';

const steps = [
  { category: 'movie', icon: Film, label: 'Cine', title: '¿Qué películas te gustan?', subtitle: 'Elegí tres que volverías a ver. Sin dar explicaciones.', placeholder: 'Buscá una película…', suggestions: ['Nueve reinas', 'Medianoche en París', 'El padrino', 'Coraline'] },
  { category: 'music', icon: Disc3, label: 'Música', title: '¿Qué música escuchás?', subtitle: 'Tres artistas o discos que no faltan en tus auriculares.', placeholder: 'Buscá un artista o un disco…', suggestions: ['Charly García', 'Radiohead', 'Bocanada', 'Miles Davis'] },
  { category: 'book', icon: BookOpen, label: 'Libros', title: '¿Qué te gusta leer?', subtitle: 'Elegí tres escritores que te acompañen.', placeholder: 'Buscá un escritor…', suggestions: ['Jorge Luis Borges', 'Julio Cortázar', 'Paul Auster', 'Mariana Enríquez'] },
] satisfies { category: OnboardingCategory; icon: typeof Film; label: string; title: string; subtitle: string; placeholder: string; suggestions: string[] }[];

export function FirstSteps() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const search = useServerFn(searchTopEntries);
  const [stage, setStage] = useState(-1);
  const [choices, setChoices] = useState(emptyChoices);
  const [text, setText] = useState('');
  const [term, setTerm] = useState('');
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const draftKey = `butaca:first-steps:${user?.id}`;
  useEffect(() => {
    if (!user) return;
    try { setChoices(readOnboardingDraft(localStorage.getItem(draftKey))); } catch { /* Storage can be unavailable. */ }
    setRestored(true);
  }, [user?.id, draftKey]);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(draftKey, JSON.stringify(choices)); } catch { /* The wizard still works in memory. */ }
  }, [choices, restored, draftKey]);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);
  const step = steps[stage];
  const results = useQuery({
    queryKey: ['onboarding-search', step?.category, term], enabled: !!step && term.length >= 2,
    staleTime: 300_000, retry: 1,
    queryFn: async () => {
      if (!step) return [];
      if (step.category === 'music') {
        const found = await Promise.allSettled(['artist', 'album'].map(kind => search({ data: { kind: kind === 'artist' ? 'artist' : 'album', q: term } })));
        if (found.every(r => r.status === 'rejected')) throw new Error('Search unavailable');
        return found.flatMap(r => r.status === 'fulfilled' ? r.value.slice(0, 6) : []);
      }
      return search({ data: { kind: step.category === 'book' ? 'author' : 'movie', q: term } });
    },
  });
  function changeStage(next: number) { setStage(next); setText(''); setTerm(''); }
  function select(r: SearchResult) {
    if (!step) return;
    setChoices(old => ({ ...old, [step.category]: toggleChoice(old[step.category], r) }));
  }
  async function finish(skip = false) {
    if (!user || busy || (!skip && !onboardingComplete(choices))) return;
    setBusy(true);
    try {
      if (!skip) {
        const all = [...choices.movie, ...choices.music, ...choices.book];
        const existing = await supabase.from('top_five_entries').select('kind,position,source,external_id').eq('user_id', user.id);
        if (existing.error) throw existing.error;
        const occupied = [...existing.data];
        const rows = all.flatMap(r => {
          const kind = initialTopKind(r);
          if (occupied.some(e => e.kind === kind && e.source === r.source && e.external_id === r.externalId)) return [];
          const position = [1, 2, 3, 4, 5].find(p => !occupied.some(e => e.kind === kind && e.position === p));
          if (!position) return [];
          occupied.push({ kind, position, source: r.source, external_id: r.externalId });
          return [{ user_id: user.id, kind, position, source: r.source, external_id: r.externalId, title: r.title, creator: r.creator, year: r.year, image_url: r.imageUrl, external_url: r.externalUrl }];
        });
        if (rows.length) {
          const saved = await supabase.from('top_five_entries').upsert(rows, { onConflict: 'user_id,kind,source,external_id', ignoreDuplicates: true });
          if (saved.error) throw saved.error;
        }
        const tags = [...new Set(all.flatMap(r => workTags(r)).map(t => t.toLowerCase().slice(0, 80)))];
        const chips = await supabase.from('taste_chips').upsert(tags.map(label => ({ user_id: user.id, label, weight: 8, manual: true, suppressed: false })));
        if (chips.error) throw chips.error;
        const signals = await Promise.all(all.map(r => supabase.rpc('record_taste_signal', { k: `onboarding:${choiceKey(r)}`, cat: r.mediaType, src: r.source, eid: r.externalId, work_title: r.title, work_tags: workTags(r), points: 10, is_excluded: false })));
        const failed = signals.find(r => r.error);
        if (failed?.error) throw failed.error;
      }
      const saved = await supabase.from('taste_settings').upsert({ user_id: user.id, onboarding_done: true });
      if (saved.error) throw saved.error;
      try { localStorage.removeItem(draftKey); localStorage.setItem('butacapp-home-category', 'movie'); sessionStorage.removeItem('wl:redirect'); } catch { /* Saved completion doesn't depend on local storage. */ }
      await Promise.all([qc.invalidateQueries({ queryKey: ['tastes'] }), qc.invalidateQueries({ queryKey: ['top-five'] })]);
      toast.success(skip ? 'Joya, podés sumar tus gustos más adelante.' : 'Listo el pollo. Ya tenemos por dónde arrancar.');
      await navigate({ to: '/', replace: true });
    } catch {
      toast.error('No pudimos guardar tus primeros pasos. Tus elecciones siguen acá; probá de nuevo.');
    } finally { setBusy(false); }
  }

  if (stage === -1) return <div className="first-welcome relative isolate overflow-hidden">
    <div className="first-welcome-image absolute inset-x-0 top-0 -z-20" aria-hidden="true"><img src={welcomeImage.url} alt="" fetchPriority="high" className="h-full w-full object-cover object-top"/></div>
    <div className="first-welcome-fade absolute inset-0 -z-10" aria-hidden="true"/>
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-5 sm:px-10"><span className="cinema-meta text-foreground/80">Función de bienvenida</span><Button variant="ghost" disabled={busy} onClick={() => void finish(true)} className="text-xs text-foreground/80">Saltar por ahora<ArrowRight className="size-3"/></Button></div>
    <section className="first-welcome-content mx-auto w-full max-w-5xl px-6 sm:px-10">
      <p className="cinema-meta mb-4 text-foreground/80">Apagá un rato el mundo.</p>
      <p className="mb-3 font-display text-2xl italic text-foreground">Bienvenido a…</p>
      <h1 className="welcome-wordmark text-foreground"><span className="block">momento</span><span className="block text-primary">BUTACA</span></h1>
      <p className="mt-5 max-w-sm text-base leading-6 text-foreground/90">Películas, música, libros.<br/>Tus gustos tienen más en común de lo que pensás.</p>
      <Button size="lg" className="mt-6 h-12 min-w-44" onClick={() => changeStage(0)}>Empezar<ArrowRight/></Button>
      <p className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase text-muted-foreground"><Film className="size-3"/>Cine<span className="text-primary">/</span><Disc3 className="size-3"/>Música<span className="text-primary">/</span><BookOpen className="size-3"/>Libros</p>
    </section>
    <section className="mx-auto mt-9 w-full max-w-5xl border-t border-border px-6 pb-10 pt-5 sm:px-10"><div className="flex items-start gap-4"><span className="font-heading text-4xl text-primary">01</span><div><h2 className="font-heading text-2xl uppercase text-foreground">Primero, tus imprescindibles.</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Tres películas, tres artistas o discos y tres escritores. Después, Betty se encarga de cruzar los caminos.</p><p className="mt-3 text-xs text-muted-foreground">Tus gustos son privados. Los podés cambiar después.</p></div></div><p className="mt-6 text-[10px] text-muted-foreground">Foto: <a href="https://unsplash.com/photos/red-theater-curtain-WW1jsInXgwM" target="_blank" rel="noreferrer" className="underline underline-offset-2">Rob Laughter / Unsplash</a></p></section>
  </div>;

  return <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8">
    <div className="mb-7 flex items-center justify-between border-b border-border pb-4">
      <span className="font-mono text-xs uppercase text-muted-foreground">Tu primera fila</span>
      <Button variant="ghost" disabled={busy} onClick={() => void finish(true)} className="text-xs text-muted-foreground">Saltar por ahora</Button>
    </div>
    {stage === 3 ? <section className="space-y-6 py-3">
      <Check className="size-9 text-primary"/>
      <h1 className="font-heading text-4xl uppercase">Ya tenemos por dónde arrancar</h1>
      <p className="text-sm leading-6 text-muted-foreground">Tus elecciones quedan en tu Top inicial y ayudan a afinar las recomendaciones. Después, cada búsqueda suma.</p>
      {steps.map(s => <div key={s.category}><h2 className="mb-3 font-heading text-xl uppercase text-primary">{s.label}</h2><div className="grid grid-cols-3 gap-4">{choices[s.category].map(r => <div key={choiceKey(r)}><Poster src={r.imageUrl} alt={r.title} media={r.mediaType} aspect="aspect-square"/><p className="mt-2 line-clamp-2 text-xs">{r.title}</p></div>)}</div></div>)}
      <div className="flex flex-wrap gap-2"><Button variant="ghost" disabled={busy} onClick={() => changeStage(2)}><ArrowLeft/>Revisar</Button><Button disabled={busy || !onboardingComplete(choices)} onClick={() => void finish()}>{busy ? <Loader2 className="animate-spin"/> : <ArrowRight/>}{busy ? 'Guardando…' : 'Entrar a MOMENTO BUTACA'}</Button></div>
    </section> : step ? <section>
      <ol className="mb-7 grid grid-cols-3 gap-3" aria-label="Progreso de primeros pasos">{steps.map((s, i) => <li key={s.category} aria-current={i === stage ? 'step' : undefined} className={`border-t-2 pt-2 ${i <= stage ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}><span className="font-mono text-xs">0{i + 1}</span><span className="ml-2 text-sm">{s.label}</span></li>)}</ol>
      <h1 className="font-heading text-3xl uppercase sm:text-4xl">{step.title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.subtitle}</p>
      <div className="mt-6 flex items-center justify-between"><h2 className="font-mono text-xs uppercase">Tus elegidos</h2><span role="status" className="font-mono text-sm text-primary">{choices[step.category].length}/3</span></div>
      <div className="mt-3 grid grid-cols-3 gap-3">{[0, 1, 2].map(i => {
        const r = choices[step.category][i];
        return <div key={i} className="min-w-0">{r ? <div className="relative"><Poster src={r.imageUrl} alt={r.title} media={r.mediaType} aspect="aspect-square"/><Button variant="secondary" size="icon" className="absolute right-1 top-1 size-11" aria-label={`Quitar ${r.title}`} onClick={() => select(r)}><X/></Button></div> : <div className="flex aspect-square items-center justify-center rounded-sm border border-dashed border-border bg-card/40 text-muted-foreground"><step.icon className="size-7 opacity-40"/></div>}<p className="mt-2 min-h-8 line-clamp-2 text-xs leading-4">{r?.title ?? `Tu elección ${i + 1}`}</p></div>;
      })}</div>
      <form className="mt-6 flex gap-2" onSubmit={e => { e.preventDefault(); setTerm(text.trim()); }}><Input aria-label={step.placeholder} placeholder={step.placeholder} value={text} maxLength={120} onChange={e => setText(e.target.value)} className="h-11 min-w-0 text-base"/><Button type="submit" size="icon" aria-label="Buscar" className="size-11 shrink-0"><Search/></Button></form>
      <div className="mt-3 flex flex-wrap gap-1">{step.suggestions.map(s => <Button key={s} variant="ghost" className="min-h-11 text-xs text-muted-foreground" onClick={() => { setText(s); setTerm(s); }}>{s}</Button>)}</div>
      <div className="mt-4" aria-live="polite">
        {term.length >= 2 && results.isFetching && <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Buscando…</p>}
        {results.isError && <div className="py-3"><p className="text-sm text-muted-foreground">La búsqueda no respondió. Probá de nuevo.</p><Button variant="ghost" onClick={() => void results.refetch()}>Reintentar</Button></div>}
        {term.length >= 2 && !results.isFetching && !results.isError && results.data?.length === 0 && <p className="py-3 text-sm text-muted-foreground">No encontramos coincidencias. Probá con otro nombre.</p>}
        {term.length >= 2 && results.data?.map(r => {
          const selected = choices[step.category].some(c => choiceKey(c) === choiceKey(r));
          return <Button key={choiceKey(r)} variant="ghost" aria-pressed={selected} aria-label={`${selected ? 'Quitar' : 'Elegir'} ${r.title}`} disabled={!selected && choices[step.category].length === 3} onClick={() => select(r)} className="mb-1 h-auto min-h-16 w-full justify-start gap-3 rounded-sm border border-border px-2 py-2 text-left whitespace-normal"><div className="w-11 shrink-0"><Poster src={r.imageUrl} alt="" media={r.mediaType} aspect="aspect-square"/></div><span className="min-w-0 flex-1"><span className="block text-sm">{r.title}</span><span className="mt-1 block text-xs text-muted-foreground">{r.kindLabel}{r.year ? ` · ${r.year}` : ''}{r.creator ? ` · ${r.creator}` : ''}</span></span>{selected && <Check className="shrink-0 text-primary"/>}</Button>;
        })}
      </div>
      <div className="sticky bottom-0 mt-6 flex justify-between gap-3 border-t border-border bg-background py-4"><Button variant="ghost" onClick={() => changeStage(stage - 1)}><ArrowLeft/>Volver</Button><Button disabled={!stepComplete(choices, step.category)} onClick={() => changeStage(stage + 1)}>Continuar<ArrowRight/></Button></div>
    </section> : null}
  </div>;
}
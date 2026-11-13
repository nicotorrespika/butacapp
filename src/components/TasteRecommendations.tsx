import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Heart,MoreHorizontal,RefreshCw,X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTastes } from '@/hooks/use-tastes';
import { tasteKey,tasteScore,diverseOrder } from '@/lib/tastes';
import { cultureRouteId,type HomeCategory } from '@/lib/culture';
import { refreshPersonalization } from '@/lib/personalization.functions';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from './ui/button';
import { Poster } from './Poster';
import { EventImage } from './EventImage';
import { EventSchedule } from './EventSchedule';
export function TasteRecommendations({category='all',anchor,horizontal=false}:{category?:HomeCategory;horizontal?:boolean;anchor?:{source:string;id:string;title:string;verb:string}}) {
  const {user}=useAuth();const {settings,chips,paused}=useTastes();const call=useServerFn(refreshPersonalization);const qc=useQueryClient();const [busy,setBusy]=useState(false);
  const q=useQuery({queryKey:['tastes','recommendations',user?.id,category,anchor?.id],enabled:!!user,queryFn:async()=>{let query=supabase.from('taste_recommendations').select('*').eq('user_id',user?.id ?? '').order('score',{ascending:false}).limit(100);if(category!=='all')query=query.eq('category',category);if(anchor)query=query.eq('anchor_source',anchor.source).eq('anchor_id',anchor.id);const r=await query;if(r.error)throw r.error;return r.data;}});
  const signals=useQuery({queryKey:['tastes','signals',user?.id],enabled:!!user,queryFn:async()=>{const r=await supabase.from('taste_signals').select('source,external_id,excluded,weight,tags').eq('user_id',user?.id ?? '');if(r.error)throw r.error;return r.data;}});
  const excluded=new Set(signals.data?.filter(s=>s.excluded).map(s=>tasteKey(s.source,s.external_id)));
  const enabledAnchor=!anchor||signals.data?.some(s=>tasteKey(s.source,s.external_id)===tasteKey(anchor.source,anchor.id)&&(s.excluded||s.weight>=6));
  const eligible=(q.data ?? []).filter(r=>!excluded.has(tasteKey(r.source,r.external_id))&&tasteScore(r.tags,chips.data ?? [],paused)>=0);
  const rows=paused?eligible:diverseOrder(eligible.map(r=>({...r,score:Number(r.score)+tasteScore(r.tags,chips.data ?? [])})),10);
  if(!user||!enabledAnchor)return null;
  return <section className="px-4 py-7"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="cinema-heading max-w-full break-words text-3xl">{anchor?`Porque ${anchor.verb} ${anchor.title}…`:category==='all'?'Cositas que te pueden gustar 👀':'Para vos'}</h2>{!paused&&settings.data?.recording_enabled!==false&&<Button variant="ghost" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await call();toast(r.message);await qc.invalidateQueries({queryKey:['tastes']});}catch{toast.error('No pudimos actualizar tus recomendaciones.');}finally{setBusy(false);}}}><RefreshCw className={busy?'animate-spin':''}/>{busy?'Betty está conectando…':'Actualizar'}</Button>}</div>{paused&&<p className="mt-2 text-sm text-muted-foreground">Personalización pausada · tus gustos no están cambiando.</p>}{q.isError?<p className="py-5 text-sm text-muted-foreground">No pudimos cargar tus recomendaciones.</p>:!rows.length?<div className="py-5"><p className="text-sm text-muted-foreground">Todavía no hay conexiones guardadas, che.</p><Button asChild variant="link"><Link to="/gustos">Elegir mis gustos</Link></Button></div>:<div aria-label="Recomendaciones para vos" tabIndex={horizontal?0:undefined} className={horizontal?"mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scrollbar-none":"mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4"}>{rows.slice(0,10).map(r=><div key={r.id} className={horizontal?"w-40 shrink-0 snap-start sm:w-44":"min-w-0"}><TasteCard row={r}/></div>)}</div>}</section>;
}
function TasteCard({row}:{row:Tables<'taste_recommendations'>}) {
  const {user}=useAuth();const qc=useQueryClient();const [menu,setMenu]=useState(false);const [busy,setBusy]=useState(false);
  const content=<>{row.category==='event'?<EventImage compact title={row.title} interest="festival" url={row.image_url}/>:<Poster src={row.image_url} alt={row.title} media={row.category==='book'?'book':row.category==='music'?'music':'movie'} aspect="aspect-[4/5]"/>}<p className="mt-3 cinema-meta text-muted-foreground">{({movie:'Cine',book:'Libros',music:'Música',event:'Eventos'})[row.category] ?? row.category}{row.exploration?' · Otra mirada':''}</p><h3 className="mt-1 break-words font-display text-xl text-primary">{row.title}</h3></>;
  async function feedback(kind:'interested'|'seen'|'style') {
    if(!user||busy)return;setBusy(true);
    try{const r=await supabase.rpc('record_taste_signal',{k:`feedback:${row.source}:${row.external_id}`,cat:row.category,src:row.source,eid:row.external_id,work_title:row.title,work_tags:kind==='seen'?[]:row.tags.slice(0,30),points:kind==='interested'?5:kind==='seen'?1:-6,is_excluded:kind!=='interested',why:kind==='seen'?'Ya la vi':kind==='style'?'No es mi estilo':'Me interesa'});if(r.error)throw r.error;setMenu(false);await qc.invalidateQueries({queryKey:['tastes']});toast.success('Joya, gusto anotado');}catch{toast.error('No pudimos guardar tu elección.');}finally{setBusy(false);}
  }
  return <article className="min-w-0">{row.category==='event'?<Link to="/event/$eventId" params={{eventId:row.external_id}}>{content}</Link>:row.category==='movie'?<Link to="/movie/$movieId" params={{movieId:row.external_id.replace(':','-')}}>{content}</Link>:<Link to="/culture/$cultureId" params={{cultureId:cultureRouteId(row.source,row.external_id)}}>{content}</Link>}<p className="mt-2 line-clamp-3 text-sm leading-5 text-muted-foreground">{row.reason}</p>{row.category==='event'&&<EventSchedule id={row.external_id}/>} {row.evidence_url&&<a href={row.evidence_url} target="_blank" rel="noreferrer" className="block min-h-11 py-3 text-xs text-primary">Fuente de la conexión ↗</a>}<Button variant="ghost" className="mt-1" aria-label={`Opciones de ${row.title}`} aria-expanded={menu} onClick={()=>setMenu(!menu)}><MoreHorizontal/>Tu elección</Button>{menu&&<div className="flex flex-col items-start border-t border-border"><Button variant="ghost" disabled={busy} onClick={()=>feedback('interested')}><Heart/>Me interesa</Button><p className="px-3 py-2 text-xs text-muted-foreground">No me interesa</p><Button variant="ghost" className="h-auto min-h-11 whitespace-normal text-left" disabled={busy} onClick={()=>feedback('seen')}><X/>{row.category==='music'?'Ya lo escuché':row.category==='book'?'Ya lo leí':row.category==='event'?'Ya fui':'Ya la vi'}</Button><Button variant="ghost" disabled={busy} onClick={()=>feedback('style')}><X/>No es mi estilo</Button></div>}</article>;
}
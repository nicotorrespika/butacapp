import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
import {ResultCard} from './ResultCard';
import {useAddToList} from '@/hooks/use-add-to-list';
import {useNavigate} from '@tanstack/react-router';
import {movieRouteId,type SearchResult} from '@/lib/media';
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
 const navigate=useNavigate();const add=useAddToList(undefined);
 const result:SearchResult={source:row.source,externalId:row.external_id,title:row.title,creator:row.creator,year:row.year,imageUrl:row.image_url,externalUrl:row.external_url,mediaType:row.category==='book'?'book':row.category==='music'?'music':'movie',kindLabel:row.category==='book'?'Libro':row.category==='music'?'Disco':'Película'};
 return <div className="min-w-0">{row.category==='event'?<Link to="/event/$eventId" params={{eventId:row.external_id}}><EventImage compact title={row.title} interest="festival" url={row.image_url}/><h3 className="mt-2 font-display text-xl text-primary">{row.title}</h3></Link>:<ResultCard result={result} onAdd={add.add} added={add.isAdded(result)} busy={add.isBusy(result)} onOpen={r=>r.mediaType==='movie'?navigate({to:'/movie/$movieId',params:{movieId:movieRouteId(r.externalId)}}):navigate({to:'/culture/$cultureId',params:{cultureId:cultureRouteId(r.source,r.externalId)}})}/>}<p className="mt-2 line-clamp-3 text-sm leading-5 text-muted-foreground">{row.reason}</p>{row.category==='event'&&<EventSchedule id={row.external_id}/>} {row.evidence_url&&<a href={row.evidence_url} target="_blank" rel="noreferrer" className="block min-h-11 py-3 text-xs text-primary">Fuente de la conexión ↗</a>}{add.sheet}</div>;
}

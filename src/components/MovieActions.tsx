import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, Save, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { SearchResult } from "@/lib/media";
import { Button } from "./ui/button";
import { StarRating } from "./StarRating";
import { recordWorkTaste } from '@/lib/tastes-client';
import { movieEntryChange } from '@/lib/movie-entry-change';
export function MovieActions({result,favoriteOnly=false,genres=[],extra=[],section="all",showPending=false}:{result:SearchResult;favoriteOnly?:boolean;genres?:string[];extra?:string[];section?:"all"|"controls"|"review";showPending?:boolean}){
 const {user}=useAuth();const qc=useQueryClient();const [draft,setDraft]=useState<string|null>(null);const [busy,setBusy]=useState(false);
 const key=["social","entry",user?.id,result.source,result.externalId];
 const entry=useQuery({queryKey:key,enabled:!!user,queryFn:async()=>{if(!user)return null;const r=await supabase.from("movie_entries").select("*").eq("user_id",user.id).eq("source",result.source).eq("external_id",result.externalId).maybeSingle();if(r.error)throw r.error;return r.data;}});
 const friends=useQuery({queryKey:["social","movie-friends",result.source,result.externalId],enabled:!!user&&!favoriteOnly&&section!=="controls",queryFn:async()=>{if(!user)return [];const r=await supabase.from("movie_entries").select("*, profile:profiles(display_name,username)").eq("source",result.source).eq("external_id",result.externalId).neq("user_id",user.id);if(r.error)throw r.error;return r.data;}});
 async function save(change:{queued?:boolean;watched?:boolean;favorite?:boolean;score_10?:number|null;review?:string}){
  if(!user||busy)return;setBusy(true);const previous=entry.data;
  const payload={user_id:user.id,source:result.source,external_id:result.externalId,title:result.title,year:result.year,image_url:result.imageUrl,...movieEntryChange(change)};
  const r=await (previous?supabase.from("movie_entries").update(payload).eq("id",previous.id):supabase.from("movie_entries").upsert(payload,{onConflict:"user_id,source,external_id"})).select("*").single();setBusy(false);
  if(r.error){toast.error("No se pudo guardar. Probá otra vez.");return;}
  const savedId=r.data.id;qc.setQueryData(key,r.data);qc.invalidateQueries({queryKey:["social"]});toast.success(change.queued===true?"Agregada a tu Watchlist":"Guardado",{action:{label:"Deshacer",onClick:async()=>{if(previous)await supabase.from("movie_entries").update({queued:previous.queued,watched:previous.watched,favorite:previous.favorite,score_10:previous.score_10,review:previous.review}).eq("id",savedId);else await supabase.from("movie_entries").delete().eq("id",savedId);qc.invalidateQueries({queryKey:["social"]});}}});
  void recordWorkTaste(result,{favorite:r.data.favorite,score:r.data.score_10,consumed:r.data.watched,queued:r.data.queued},genres,extra).then(()=>qc.invalidateQueries({queryKey:['tastes']})).catch(err=>console.error("recordWorkTaste",err));
 }
 return <div className="space-y-2">{entry.isError?<p className="text-sm text-muted-foreground">No pudimos cargar tus datos. <Button variant="link" onClick={()=>entry.refetch()}>Reintentar</Button></p>:<>
 {section!=="review"&&<><div className={onAddPending&&!favoriteOnly?"grid max-w-xl grid-cols-3 gap-1 border-y border-border py-1":"flex flex-wrap gap-2"}>{!favoriteOnly&&<Button variant={entry.data?.watched?"done":"ghost"} className="h-auto min-h-16 min-w-0 flex-col gap-1 px-1 py-2 text-center text-xs whitespace-normal [&_svg]:size-5" disabled={busy||entry.isLoading} aria-pressed={!!entry.data?.watched} onClick={()=>save({watched:!entry.data?.watched})}><Eye/>La vi</Button>}<Button variant="ghost" className="h-auto min-h-16 min-w-0 flex-col gap-1 px-1 py-2 text-center text-xs whitespace-normal [&_svg]:size-5" disabled={busy||entry.isLoading} aria-pressed={!!entry.data?.favorite} onClick={()=>save({favorite:!entry.data?.favorite})}><Heart className={entry.data?.favorite?"fill-primary text-primary":""}/>{entry.data?.favorite?"Favorita":"Marcar favorita"}</Button>{onAddPending&&!favoriteOnly&&<Button variant="ghost" className="h-auto min-h-16 min-w-0 flex-col gap-1 px-1 py-2 text-center text-xs whitespace-normal [&_svg]:size-5" onClick={onAddPending}><ListPlus/>Agregar a mis pendientes</Button>}</div>
 {!favoriteOnly&&<StarRating compact value={entry.data?.score_10 ?? null} onChange={score=>save({score_10:score})}/>}</>}
 {section!=="controls"&&!favoriteOnly&&<><form className="max-w-xl space-y-2" onSubmit={e=>{e.preventDefault();void save({review:(draft ?? entry.data?.review ?? "").trim()});}}><textarea aria-label="Mi reseña" placeholder="Escribí tu reseña…" value={draft ?? entry.data?.review ?? ""} onChange={e=>setDraft(e.target.value)} maxLength={3000} rows={2} className="block min-h-20 w-full resize-y rounded-sm border border-input bg-card px-3 py-2 text-sm"/><Button type="submit" size="sm" variant="outline" disabled={busy}><Save/>Guardar reseña</Button></form>{!!friends.data?.length&&<section><h2 className="mb-4 font-display text-2xl">Tus amigos</h2>{friends.data.map(f=><article key={f.id} className="py-3"><p className="text-sm">{f.profile?.username ?? f.profile?.display_name ?? "Alguien"} {f.watched?"· La vio":""}</p><StarRating value={f.score_10} size="sm"/><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{f.review}</p></article>)}</section>}</>}

 </>}</div>;
}
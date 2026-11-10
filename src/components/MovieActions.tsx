import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Heart, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { SearchResult } from "@/lib/media";
import { Button } from "./ui/button";
import { StarRating } from "./StarRating";
export function MovieActions({result,favoriteOnly=false}:{result:SearchResult;favoriteOnly?:boolean}){
 const {user}=useAuth();const qc=useQueryClient();const [draft,setDraft]=useState<string|null>(null);const [busy,setBusy]=useState(false);
 const key=["social","entry",user?.id,result.source,result.externalId];
 const entry=useQuery({queryKey:key,enabled:!!user,queryFn:async()=>{if(!user)return null;const r=await supabase.from("movie_entries").select("*").eq("user_id",user.id).eq("source",result.source).eq("external_id",result.externalId).maybeSingle();if(r.error)throw r.error;return r.data;}});
 const friends=useQuery({queryKey:["social","movie-friends",result.source,result.externalId],enabled:!!user&&!favoriteOnly,queryFn:async()=>{if(!user)return [];const r=await supabase.from("movie_entries").select("*, profile:profiles(display_name,username)").eq("source",result.source).eq("external_id",result.externalId).neq("user_id",user.id);if(r.error)throw r.error;return r.data;}});
 async function save(change:{watched?:boolean;favorite?:boolean;score_10?:number|null;review?:string}){
  if(!user||busy)return;setBusy(true);const previous=entry.data;
  const r=await supabase.from("movie_entries").upsert({user_id:user.id,source:result.source,external_id:result.externalId,title:result.title,year:result.year,image_url:result.imageUrl,watched:previous?.watched ?? false,favorite:previous?.favorite ?? false,score_10:previous?.score_10 ?? null,review:previous?.review ?? "",...change},{onConflict:"user_id,source,external_id"}).select("id").single();setBusy(false);
  if(r.error){toast.error("No se pudo guardar. Probá otra vez.");return;}
  const savedId=r.data.id;qc.invalidateQueries({queryKey:["social"]});toast.success("Guardado",{action:{label:"Deshacer",onClick:async()=>{if(previous)await supabase.from("movie_entries").update({watched:previous.watched,favorite:previous.favorite,score_10:previous.score_10,review:previous.review}).eq("id",savedId);else await supabase.from("movie_entries").delete().eq("id",savedId);qc.invalidateQueries({queryKey:["social"]});}}});
 }
 return <div className="space-y-5">{entry.isError?<p className="text-sm text-muted-foreground">No pudimos cargar tus datos. <Button variant="link" onClick={()=>entry.refetch()}>Reintentar</Button></p>:<>
 <div className="flex flex-wrap gap-2">{!favoriteOnly&&<Button variant={entry.data?.watched?"done":"outline"} disabled={busy||entry.isLoading} aria-pressed={!!entry.data?.watched} onClick={()=>save({watched:!entry.data?.watched})}><Check/>{entry.data?.watched?"La vi · Guardada":"La vi"}</Button>}<Button variant="outline" disabled={busy||entry.isLoading} aria-pressed={!!entry.data?.favorite} onClick={()=>save({favorite:!entry.data?.favorite})}><Heart className={entry.data?.favorite?"fill-primary text-primary":""}/>{entry.data?.favorite?"Favorita":"Marcar favorita"}</Button></div>
 {!favoriteOnly&&<><div><h2 className="mb-2 font-display text-2xl">Mi nota</h2><StarRating value={entry.data?.score_10 ?? null} onChange={score=>save({score_10:score})}/></div><label className="block text-sm text-muted-foreground">Mi reseña<textarea aria-label="Mi reseña" value={draft ?? entry.data?.review ?? ""} onChange={e=>setDraft(e.target.value)} maxLength={3000} rows={3} className="mt-3 w-full rounded-sm border border-input bg-card p-3 text-base"/></label><Button variant="outline" disabled={busy} onClick={()=>save({review:(draft ?? entry.data?.review ?? "").trim()})}><Save/>Guardar reseña</Button>{!!friends.data?.length&&<section><h2 className="mb-4 font-display text-2xl">Tus amigos</h2>{friends.data.map(f=><article key={f.id} className="py-3"><p className="text-sm">{f.profile?.username ?? f.profile?.display_name ?? "Alguien"} {f.watched?"· La vio":""}</p><StarRating value={f.score_10} size="sm"/><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{f.review}</p></article>)}</section>}</>}
 </>}</div>;
}
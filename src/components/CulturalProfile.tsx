import { useQuery,useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUp,Plus,X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { topFive } from "@/lib/social";
import { cultureRouteId,type CultureType } from "@/lib/culture";
import type { Json } from "@/integrations/supabase/types";
import type { SearchResult } from "@/lib/media";
import { Button } from "./ui/button";
import { Poster } from "./Poster";
import { toast } from "sonner";
export function CulturalProfile({userId,type,own,tab,topValue}:{userId:string;type:CultureType;own:boolean;tab:string;topValue:Json}) {
 const qc=useQueryClient();const group=topValue&&typeof topValue==="object"&&!Array.isArray(topValue)?topValue:{};const top=topFive(group[type]);
 const q=useQuery({queryKey:["culture","profile",userId,type],queryFn:async()=>{const r=await supabase.from("cultural_entries").select("*").eq("user_id",userId).eq("media_type",type).order("updated_at",{ascending:false});return r.data ?? [];}});
 async function saveTop(rows:SearchResult[]){const r=await supabase.from("profiles").update({cultural_top_five:JSON.parse(JSON.stringify({...group,[type]:rows}))}).eq("id",userId);if(r.error)return void toast.error("No se pudo guardar el Top 5.");qc.invalidateQueries({queryKey:["social"]});}
 const rows=(q.data ?? []).filter(e=>tab==="Pendientes"?e.queued&&!e.consumed:tab==="Favoritas"?e.favorite:tab==="Reseñas"?!!e.review:tab==="Vistas"?e.consumed:true);
 return <section className="space-y-7"><section><h2 className="mb-5 cinema-heading text-3xl">Top 5 {type==="book"?"libros":"discos"}</h2><div className="grid grid-cols-5 gap-2">{top.map((r,i)=><div key={r.externalId}><Link to="/culture/$cultureId" params={{cultureId:cultureRouteId(r.source,r.externalId)}}><Poster src={r.imageUrl} alt={r.title} media={type}/></Link>{own&&<><Button variant="ghost" className="w-full px-0 text-[10px]" disabled={i===0} onClick={()=>{const next=[...top];const a=next[i];const b=next[i-1];if(!a||!b)return;next[i-1]=a;next[i]=b;void saveTop(next);}}><ArrowUp/>Subir</Button><Button variant="ghost" className="w-full px-0 text-[10px]" onClick={()=>saveTop(top.filter((_,n)=>n!==i))}><X/>Quitar</Button></>}</div>)}</div>{own&&top.length<5&&<Button asChild variant="outline" className="mt-4"><Link to="/search" search={{f:type,top:true}}><Plus/>Elegir Top 5</Link></Button>}</section>{tab!=="Listas"&&<div className="grid grid-cols-3 gap-3">{rows.map(r=><Link key={r.id} to="/culture/$cultureId" params={{cultureId:cultureRouteId(r.source,r.external_id)}}><Poster src={r.image_url} alt={r.title} media={type}/><h3 className="mt-2 font-display text-lg text-primary">{r.title}</h3>{r.score_10&&<p className="text-xs text-primary">★ {r.score_10}/10</p>}{tab==="Reseñas"&&<p className="mt-2 text-sm text-muted-foreground">{r.review}</p>}</Link>)}</div>}</section>;
}
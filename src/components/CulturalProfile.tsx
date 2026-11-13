import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { cultureRouteId,type CultureType } from "@/lib/culture";
import { CATEGORY_COPY } from "@/lib/copy";
import {collectionMatch} from "@/lib/profile-collections";
import { Poster } from "./Poster";
export function CulturalProfile({userId,type,tab}:{userId:string;type:CultureType;tab:string}) {
 const copy=CATEGORY_COPY[type];
 const q=useQuery({queryKey:["culture","profile",userId,type],queryFn:async()=>{const r=await supabase.from("cultural_entries").select("*").eq("user_id",userId).eq("media_type",type).order("updated_at",{ascending:false});return r.data ?? [];}});
 const rows=(q.data ?? []).filter(e=>collectionMatch(tab,{queued:e.queued,consumed:e.consumed,favorite:e.favorite}));
 return <section className="space-y-7">{tab!=="Listas"&&<div className="grid grid-cols-3 gap-3">{rows.map(r=><Link key={r.id} to="/culture/$cultureId" params={{cultureId:cultureRouteId(r.source,r.external_id)}}><Poster src={r.image_url} alt={r.title} media={type}/><h3 className="mt-2 font-display text-lg text-primary">{r.title}</h3>{r.score_10&&<p className="text-xs text-primary">★ {r.score_10}/10</p>}{tab==="Reseñas"&&<p className="mt-2 text-sm text-muted-foreground">{r.review}</p>}</Link>)}{!rows.length&&tab!==""&&<p className="col-span-3 text-sm text-muted-foreground">{copy.emptyDone}</p>}</div>}</section>;
}
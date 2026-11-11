import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Poster } from "./Poster";
import { cultureRouteId } from "@/lib/culture";
import { movieRouteId } from "@/lib/media";
export function TasteCollage(){
 const {user}=useAuth();const q=useQuery({queryKey:["tastes","collage",user?.id],enabled:!!user,queryFn:async()=>{
  const [movies,culture]=await Promise.all([supabase.from("movie_entries").select("source,external_id,title,image_url,favorite,score_10,updated_at").eq("user_id",user?.id??"").eq("dismissed",false).or("favorite.eq.true,score_10.gte.7").order("updated_at",{ascending:false}).limit(12),supabase.from("cultural_entries").select("source,external_id,title,image_url,media_type,favorite,score_10,updated_at").eq("user_id",user?.id??"").eq("dismissed",false).or("favorite.eq.true,score_10.gte.7").order("updated_at",{ascending:false}).limit(12)]);
  return [...(movies.data??[]).map(r=>({...r,media_type:"movie"})),...(culture.data??[])].sort((a,b)=>Number(b.favorite)-Number(a.favorite)||b.updated_at.localeCompare(a.updated_at)).slice(0,12);
 }});
 return <section aria-label="Collage de tus gustos"><h2 className="mb-4 font-display text-2xl text-primary">Tu pequeño universo</h2>{q.data?.length?<div className="grid grid-cols-4 items-center gap-2 sm:grid-cols-6">{q.data.map((r,i)=>{const media=r.media_type==="movie"?"movie":r.media_type==="book"?"book":"music";const classes=`block min-w-0 transition-transform ${i%3===0?"-rotate-3":i%3===1?"rotate-2":""}`;return media==="movie"?<Link key={`${r.source}:${r.external_id}`} to="/movie/$movieId" params={{movieId:movieRouteId(r.external_id)}} aria-label={r.title} className={classes}><Poster src={r.image_url} alt={r.title} media={media}/></Link>:<Link key={`${r.source}:${r.external_id}`} to="/culture/$cultureId" params={{cultureId:cultureRouteId(r.source,r.external_id)}} aria-label={r.title} className={classes}><Poster src={r.image_url} alt={r.title} media={media}/></Link>;})}</div>:<p className="text-sm text-muted-foreground">Todavía estamos juntando tus figuritas.</p>}</section>;
}
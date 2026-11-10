import {useQuery} from "@tanstack/react-query";
import {Link} from "@tanstack/react-router";
import {supabase} from "@/integrations/supabase/client";
import {cultureRouteId} from "@/lib/culture";
import {Poster} from "./Poster";
export function SoundtrackCollection({userId}:{userId:string}){
  const q=useQuery({queryKey:["soundtrack","collection",userId],queryFn:async()=>{const seen=await supabase.from("movie_entries").select("external_id").eq("user_id",userId).eq("watched",true);const ids=seen.data?.map(r=>r.external_id.replace(":","-")) ?? [];if(!ids.length)return [];const r=await supabase.from("movie_soundtracks").select("*").in("movie_id",ids).eq("kind","album").eq("hidden",false);return r.data ?? [];}});
  return <section><h2 className="cinema-heading mb-5 text-2xl">Banda sonora de mi cine</h2><div className="flex gap-4 overflow-x-auto">{q.data?.map(r=><Link key={r.id} to="/culture/$cultureId" params={{cultureId:cultureRouteId(r.source,r.external_id)}} search={{soundtrack:r.movie_id}} className="w-32 shrink-0"><Poster src={r.image_url} alt={r.title} media="music"/><h3 className="mt-3 font-display text-xl text-primary">{r.title}</h3><p className="mt-2 text-xs text-muted-foreground">{r.movie_title}</p></Link>)}</div>{!q.data?.length&&<p className="text-sm text-muted-foreground">Los soundtracks de tus pelis vistas van apareciendo acá.</p>}</section>;
}
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { HomeCategory } from "@/lib/culture";
import { Poster } from "./Poster";
export function HomeCollage({category}:{category:HomeCategory}){
 const {user}=useAuth();const q=useQuery({queryKey:["home","collage",user?.id,category],enabled:!!user,staleTime:30*60_000,queryFn:async()=>{
  if(category==="event"){const r=await supabase.from("cultural_events").select("title,image_url").or("verified.eq.true,community.eq.true").not("image_url","is",null).limit(8);return (r.data??[]).map(x=>({...x,media_type:"art"}));}
  let query=supabase.from("list_items").select("title,image_url,media_type").not("image_url","is",null).order("created_at",{ascending:false}).limit(30);if(category!=="all")query=query.eq("media_type",category);
  const r=await query;const seen=new Set<string>();return (r.data??[]).filter(x=>!seen.has(x.title)&&(seen.add(x.title),true)).slice(0,8);
 }});
 return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -right-8 -top-10 grid w-full grid-cols-4 gap-3 opacity-25 sm:w-3/4">{q.data?.map((r,i)=><Poster key={r.title} src={r.image_url} alt={r.title} media={r.media_type==="movie"?"movie":r.media_type==="book"?"book":r.media_type==="music"?"music":"art"} className={i%2?"rotate-6":"-rotate-6"}/>)}</div><div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/40"/><div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40"/></div>;
}
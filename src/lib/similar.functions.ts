import {createServerFn} from "@tanstack/react-start";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
import {z} from "zod";
import type {SimilarData} from "./similar";
export const getSimilar=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({kind:z.enum(["movie","culture"]),id:z.string().min(1).max(200),page:z.number().int().min(1).max(5).default(1)}).parse(input)).handler(async({data,context})=>{
  const cacheKey=`${data.kind}:${data.id}:${data.page}`;const cached=await context.supabase.from("similar_recommendations").select("payload,updated_at").eq("cache_key",cacheKey).maybeSingle();
  if(cached.data&&Date.now()-new Date(cached.data.updated_at).getTime()<3*86400000)return {ok:true as const,data:cached.data.payload as unknown as SimilarData};
  try{
    const key=process.env[data.kind==="movie"?"TMDB_API_KEY":"LOVABLE_API_KEY"];if(!key)throw new Error("Unavailable");
    const {movieSimilar,cultureSimilar}=await import("@/server/similar-providers");const result=data.kind==="movie"?await movieSimilar(data.id,key,data.page):await cultureSimilar(data.id,key,data.page);
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");await supabaseAdmin.from("similar_recommendations").upsert({cache_key:cacheKey,payload:JSON.parse(JSON.stringify(result)),updated_at:new Date().toISOString()});return {ok:true as const,data:result};
  }catch{return cached.data?{ok:true as const,data:cached.data.payload as unknown as SimilarData}:{ok:false as const};}
});
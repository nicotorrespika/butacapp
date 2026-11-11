import {createServerFn} from "@tanstack/react-start";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
import {z} from "zod";
import type {SimilarData} from "./similar";
import { hasCrossConnections } from './cross-cache';
export const getSimilar=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({kind:z.enum(["movie","culture"]),id:z.string().min(1).max(200),generate:z.boolean().default(false),page:z.number().int().min(1).max(5).default(1)}).parse(input)).handler(async({data,context})=>{
  const cacheKey=`${data.kind==="movie"?"v3":"v2"}:${data.kind}:${data.id}:${data.page}`;const cached=await context.supabase.from("similar_recommendations").select("payload,updated_at").eq("cache_key",cacheKey).maybeSingle();
  if(cached.data&&Date.now()-new Date(cached.data.updated_at).getTime()<3*86400000)return {ok:true as const,data:cached.data.payload as unknown as SimilarData};
  if(data.kind==="culture"&&!data.generate)return cached.data?{ok:true as const,data:cached.data.payload as unknown as SimilarData}:{ok:false as const};
  try{
    const key=process.env[data.kind==="movie"?"TMDB_API_KEY":"LOVABLE_API_KEY"];if(!key)throw new Error("Unavailable");
    const {movieSimilar,cultureSimilar}=await import("@/server/similar-providers");const result=data.kind==="movie"?await movieSimilar(data.id,key,data.page):await cultureSimilar(data.id,key,data.page);
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");await supabaseAdmin.from("similar_recommendations").upsert({cache_key:cacheKey,payload:JSON.parse(JSON.stringify(result)),updated_at:new Date().toISOString()});return {ok:true as const,data:result};
  }catch{return cached.data?{ok:true as const,data:cached.data.payload as unknown as SimilarData}:{ok:false as const};}
});export const getCrossUniverse=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({kind:z.enum(["movie","culture"]),id:z.string().min(1).max(200),generate:z.boolean().default(false)}).parse(input)).handler(async({data,context})=>{
  type Cross=import("@/server/similar-providers").CrossData;
  let id=data.id;
  if(data.kind==='movie'&&/^tt\d+$/.test(id)){
    const key=process.env['TMDB_API_KEY'];if(!key)return {ok:false as const};
    const {tmdbFetcher}=await import('@/server/search-providers');
    const found=await tmdbFetcher(key)<{movie_results:{id:number}[];tv_results:{id:number}[]}>(`/find/${id}`,{external_source:'imdb_id'});
    const movie=found.movie_results[0],tv=found.tv_results[0];
    if(movie)id=`movie-${movie.id}`;else if(tv)id=`tv-${tv.id}`;else return {ok:false as const};
  }
  const cacheKey=`cross:${data.kind}:${id}`;const cached=await context.supabase.from("similar_recommendations").select("payload,updated_at").eq("cache_key",cacheKey).maybeSingle();
  const payload=cached.data?.payload as unknown as Cross|undefined;
  const usable=hasCrossConnections(payload,data.kind);
  if(usable&&cached.data&&Date.now()-new Date(cached.data.updated_at).getTime()<7*86400000)return {ok:true as const,data:payload as Cross};
  if(!data.generate)return usable?{ok:true as const,data:payload as Cross}:{ok:false as const};
  try{
    const ai=process.env["LOVABLE_API_KEY"];if(!ai)throw new Error("Unavailable");
    const {crossUniverse}=await import("@/server/similar-providers");const result=await crossUniverse(data.kind,id,ai,process.env["TMDB_API_KEY"]);
    if(!hasCrossConnections(result,data.kind))return {ok:false as const};
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");await supabaseAdmin.from("similar_recommendations").upsert({cache_key:cacheKey,payload:JSON.parse(JSON.stringify(result)),updated_at:new Date().toISOString()});return {ok:true as const,data:result};
  }catch{return usable?{ok:true as const,data:payload as Cross}:{ok:false as const};}
});

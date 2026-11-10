import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {APICallError} from "ai";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
import {askBetty} from "@/server/betty";
import {recommendationError} from "@/server/recommendations";
import type {BettyResponse} from "./betty-types";
import {tmdbFetcher,mapTmdb,type TmdbItem} from "@/server/search-providers";
export const discoverMovies=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({argentina:z.boolean().optional(),genre:z.string().optional(),decade:z.number().optional(),mood:z.string().optional()}).parse(input)).handler(async({data,context})=>{
 const key=process.env["TMDB_API_KEY"];if(!key)return [];
 const tmdb=tmdbFetcher(key);const db=context.supabase;
 const [entries,items,profile]=await Promise.all([db.from("movie_entries").select("external_id,watched,queued,dismissed,user_id").limit(500),db.from("list_items").select("external_id").eq("media_type","movie").limit(500),db.from("profiles").select("top_five").eq("id",context.userId).single()]);
 const excluded=new Set([...(entries.data ?? []).filter(e=>e.user_id===context.userId&&(e.watched||e.queued||e.dismissed)).map(e=>e.external_id),...(items.data ?? []).map(i=>i.external_id)]);
 const genre=data.genre||({"Para llorar":"18","Para no pensar":"35","De noche":"53","Con amigos":"12"}[data.mood ?? ""]);
 const filters={with_origin_country:data.argentina?"AR":undefined,with_genres:genre,"primary_release_date.gte":data.decade?`${data.decade}-01-01`:undefined,"primary_release_date.lte":data.decade?`${data.decade+9}-12-31`:undefined};
 const popular=await tmdb<{results:TmdbItem[]}>("/discover/movie",{sort_by:"popularity.desc","vote_count.gte":50,...filters});
 let recommendations:TmdbItem[]=[];
 if(!data.argentina&&!genre&&!data.decade){const top=Array.isArray(profile.data?.top_five)?profile.data.top_five:[];const first=top.find(v=>v&&typeof v==="object"&&"externalId" in v);if(first&&typeof first==="object"&&"externalId" in first&&typeof first['externalId']==="string"){const id=first['externalId'].match(/movie[:-](\d+)/)?.[1];if(id)recommendations=(await tmdb<{results:TmdbItem[]}>(`/movie/${id}/recommendations`)).results;}}
 const friendIds=[...new Set((entries.data ?? []).filter(e=>e.user_id!==context.userId&&e.queued).map(e=>e.external_id))].slice(0,5);
 const friendMovies:TmdbItem[]=[];if(!data.argentina&&!genre&&!data.decade)for(const external of friendIds){const id=external.match(/movie[:-](\d+)/)?.[1];if(id)try{friendMovies.push(await tmdb<TmdbItem>(`/movie/${id}`));}catch{/* one unavailable title does not stop discovery */}}
 const seen=new Set<string>();return [...recommendations,...friendMovies,...popular.results].map(m=>mapTmdb(m,"movie")).filter(m=>{if(excluded.has(m.externalId)||seen.has(m.externalId))return false;seen.add(m.externalId);return true;});
});
export const getBetty=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({prompt:z.string().trim().min(1).max(2000),threadId:z.string().uuid().optional()}).parse(input)).handler(async({data,context}):Promise<BettyResponse>=>{
 const db=context.supabase;const key=process.env["LOVABLE_API_KEY"];const tmdb=process.env["TMDB_API_KEY"];
 if(!key||!tmdb)return {ok:false,message:"Uy, me mandé una bettiada. Falta configurar mi videoteca.",retryable:false};
 const [profile,entries,history,feedback]=await Promise.all([db.from("profiles").select("top_five").eq("id",context.userId).single(),db.from("movie_entries").select("title,external_id,watched,score_10,review").eq("user_id",context.userId).limit(200),data.threadId?db.from("betty_history").select("prompt,movies").eq("user_id",context.userId).eq("thread_id",data.threadId).order("created_at").limit(8):Promise.resolve({data:[]}),db.from("betty_feedback").select("external_id").eq("user_id",context.userId).limit(100)]);
 try{
  const excluded=[...(entries.data ?? []).filter(e=>e.watched).map(e=>e.external_id),...(feedback.data ?? []).map(f=>f.external_id)];
  const movies=await askBetty(key,tmdb,data.prompt,{top5:profile.data?.top_five,mejoresNotas:(entries.data ?? []).filter(e=>(e.score_10 ?? 0)>=8),vistas:(entries.data ?? []).filter(e=>e.watched),historial:history.data},excluded);
  const saved=await db.from("betty_history").insert({user_id:context.userId,prompt:data.prompt,movies:JSON.parse(JSON.stringify(movies)),...(data.threadId?{thread_id:data.threadId}:{})}).select("id,thread_id").single();
  if(saved.error)throw saved.error;return {ok:true,movies,historyId:saved.data.id,threadId:saved.data.thread_id};
 }catch(e){if(APICallError.isInstance(e)&&[401,402,403,404].includes(e.statusCode ?? 0))return {ok:false,message:`Uy, me mandé una bettiada. ${recommendationError(e)}`,retryable:false};return {ok:false,message:"Uy, me mandé una bettiada. Probá de nuevo.",retryable:true};}
});
import { parseQuery } from "./search-query";
import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {APICallError} from "ai";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
import {askBetty} from "@/server/betty";
import {recommendationError} from "@/server/recommendations";
import {catalogId,type BettyResponse} from "./betty-types";
import {tmdbFetcher,mapTmdb,searchTmdb,type TmdbItem} from "@/server/search-providers";
import {discoveryExclusions} from "./discovery";
import {randomMix} from "./random-discovery";
export const discoverMovies=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({surprise:z.boolean().optional(),argentina:z.boolean().optional(),genre:z.string().optional(),decade:z.number().optional(),mood:z.string().optional()}).parse(input)).handler(async({data,context})=>{
 const key=process.env["TMDB_API_KEY"];if(!key)return [];
 const tmdb=tmdbFetcher(key);const db=context.supabase;
 const [entries,items,profile]=await Promise.all([db.from("movie_entries").select("external_id,watched,queued,dismissed,user_id").limit(500),db.from("list_items").select("external_id").eq("media_type","movie").limit(500),db.from("profiles").select("top_five").eq("id",context.userId).single()]);
 const excluded=discoveryExclusions(entries.data ?? [],items.data ?? [],context.userId);
 const tastes=await db.from("taste_chips").select("label,weight,suppressed").eq("user_id",context.userId);const settings=await db.from("taste_settings").select("paused,recording_enabled").eq("user_id",context.userId).maybeSingle();const personal=settings.data?.paused||settings.data?.recording_enabled===false?[]:tastes.data ?? [];
 const genre=data.genre||({"Para llorar":"18","Para no pensar":"35","De noche":"53","Con amigos":"12"}[data.mood ?? ""]);
 const filters={with_origin_country:data.argentina?"AR":undefined,with_genres:genre,"primary_release_date.gte":data.decade?`${data.decade}-01-01`:undefined,"primary_release_date.lte":data.decade?`${data.decade+9}-12-31`:undefined};
 const popular=await tmdb<{results:TmdbItem[]}>("/discover/movie",{sort_by:"popularity.desc","vote_count.gte":50,page:data.surprise?1+Math.floor(Math.random()*10):1,...filters});
 const history=settings.data?.paused||settings.data?.recording_enabled===false?[]:(await db.from("taste_signals").select("signal_key,title").eq("user_id",context.userId).eq("category","movie").order("occurred_at",{ascending:false}).limit(500)).data ?? [];
 let recommendations:TmdbItem[]=[];
 if(!data.argentina&&!genre&&!data.decade){const top=Array.isArray(profile.data?.top_five)?profile.data.top_five:[];const first=top.find(v=>v&&typeof v==="object"&&"externalId" in v);if(first&&typeof first==="object"&&"externalId" in first&&typeof first['externalId']==="string"){const id=first['externalId'].match(/movie[:-](\d+)/)?.[1];if(id)recommendations=(await tmdb<{results:TmdbItem[]}>(`/movie/${id}/recommendations`)).results;}}
 if(!settings.data?.paused&&settings.data?.recording_enabled!==false&&!data.argentina&&!genre&&!data.decade){
  const recent=await db.from("taste_signals").select("title").eq("user_id",context.userId).eq("category","movie").like("signal_key","search:%").order("occurred_at",{ascending:false}).limit(1);
  const term=recent.data?.[0]?.title;if(term)try{const matches=await searchTmdb(parseQuery(term),key);const id=matches.results[0]?.externalId.match(/movie:(\d+)/)?.[1];if(id)recommendations=(await tmdb<{results:TmdbItem[]}>(`/movie/${id}/recommendations`)).results;}catch{/* Keep existing defaults. */}
 }
 const friendIds=[...new Set((entries.data ?? []).filter(e=>e.user_id!==context.userId&&e.queued).map(e=>e.external_id))].slice(0,5);
 const friendMovies:TmdbItem[]=[];if(!data.argentina&&!genre&&!data.decade)for(const external of friendIds){const id=external.match(/movie[:-](\d+)/)?.[1];if(id)try{friendMovies.push(await tmdb<TmdbItem>(`/movie/${id}`));}catch{/* one unavailable title does not stop discovery */}}
 const allowed=(pool:TmdbItem[])=>pool.map(m=>mapTmdb(m,"movie")).filter(m=>!excluded.has(catalogId(m.externalId)));
 if(data.surprise)return randomMix(allowed(popular.results),allowed([...recommendations,...friendMovies]),history);
 const seen=new Set<string>();return allowed([...recommendations,...friendMovies,...popular.results]).filter(m=>{if(seen.has(m.externalId))return false;seen.add(m.externalId);return true;}).sort((a,b)=>{const match=(m:typeof a)=>personal.reduce((n,t)=>n+(!t.suppressed&&`${m.title} ${m.creator ?? ""} ${m.year ?? ""}`.toLowerCase().includes(t.label.toLowerCase())?Number(t.weight):0),0);return match(b)-match(a);});
});
export const getBetty=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({prompt:z.string().trim().min(1).max(2000),threadId:z.string().uuid().optional()}).parse(input)).handler(async({data,context}):Promise<BettyResponse>=>{
 const db=context.supabase;const key=process.env["LOVABLE_API_KEY"];const tmdb=process.env["TMDB_API_KEY"];
 if(!key||!tmdb)return {ok:false,message:"Uy, me mandé una bettiada. Falta configurar mi videoteca.",retryable:false};
 const [profile,entries,history,feedback,topEntries]=await Promise.all([db.from("profiles").select("top_five").eq("id",context.userId).single(),db.from("movie_entries").select("title,external_id,watched,score_10,review").eq("user_id",context.userId).limit(200),data.threadId?db.from("betty_history").select("prompt,movies").eq("user_id",context.userId).eq("thread_id",data.threadId).order("created_at").limit(8):Promise.resolve({data:[]}),db.from("betty_feedback").select("external_id").eq("user_id",context.userId).limit(100),db.from("top_five_entries").select("source,external_id,title,creator,year,image_url,kind").eq("user_id",context.userId).order("position")]);
 try{
  const excluded=[...(entries.data ?? []).filter(e=>e.watched).map(e=>e.external_id),...(feedback.data ?? []).map(f=>f.external_id)];
  const settings=await db.from("taste_settings").select("paused,recording_enabled").eq("user_id",context.userId).maybeSingle();const chips=await db.from("taste_chips").select("label,weight,suppressed").eq("user_id",context.userId);const tastes=settings.data?.paused||settings.data?.recording_enabled===false?[]:(chips.data ?? []).filter(t=>!t.suppressed);
  const newTop=(topEntries.data ?? []).map(t=>({source:t.source,externalId:t.external_id,mediaType:t.kind==="movie"?"movie":t.kind==="book"||t.kind==="author"?"book":"music",title:t.title,creator:t.creator,year:t.year,imageUrl:t.image_url,kindLabel:null,externalUrl:null}));
  const movies=await askBetty(key,tmdb,data.prompt,{gustos:tastes,exploracion:0.2,top5:newTop.length?newTop:profile.data?.top_five,mejoresNotas:(entries.data ?? []).filter(e=>(e.score_10 ?? 0)>=8),vistas:(entries.data ?? []).filter(e=>e.watched),historial:history.data},excluded,async movie=>{const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const {cachedMovieResearch}=await import("@/server/movie-research");return cachedMovieResearch(supabaseAdmin,catalogId(movie.result.externalId));});
  const saved=await db.from("betty_history").insert({user_id:context.userId,prompt:data.prompt,movies:JSON.parse(JSON.stringify(movies)),...(data.threadId?{thread_id:data.threadId}:{})}).select("id,thread_id").single();
  if(saved.error)throw saved.error;return {ok:true,movies,historyId:saved.data.id,threadId:saved.data.thread_id};
 }catch(e){if(APICallError.isInstance(e)&&[401,402,403,404].includes(e.statusCode ?? 0))return {ok:false,message:`Uy, me mandé una bettiada. ${recommendationError(e)}`,retryable:false};return {ok:false,message:"Uy, me mandé una bettiada. Probá de nuevo.",retryable:true};}
});
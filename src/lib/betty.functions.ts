import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {APICallError} from "ai";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
import {askBetty} from "@/server/betty";
import {recommendationError} from "@/server/recommendations";
import type {BettyResponse} from "./betty-types";
import {tmdbFetcher,mapTmdb,type TmdbItem} from "@/server/search-providers";
export const discoverMovies=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async()=>{
 const key=process.env["TMDB_API_KEY"];if(!key)return [];
 const data=await tmdbFetcher(key)<{results:TmdbItem[]}>("/discover/movie",{sort_by:"popularity.desc","vote_count.gte":100});return data.results.map(m=>mapTmdb(m,"movie"));
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
import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
import {researchSchema,type MovieReview} from "@/lib/movie-research";
export const getMovieResearch=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().regex(/^((movie|tv)-\d+|tt\d{5,10})$/),search:z.boolean().optional()}).parse(v)).handler(async({data})=>{
 const parallel=process.env["PARALLEL_API_KEY"];
 if(!parallel)return {ok:true as const,enabled:false as const,reviews:[] as MovieReview[]};
 const cacheKey=`movie-reviews-v2:${data.id}`;
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 if(!data.search){
  try{
   const cache=await supabaseAdmin.from("culture_cache").select("payload").eq("key",cacheKey).maybeSingle();
   if(cache.data){
    const parsed=researchSchema.safeParse(cache.data.payload);
    if(parsed.success)return {ok:true as const,enabled:true as const,reviews:parsed.data.reviews};
   }
  }catch(e){console.error("Movie research cache",e);}
  return {ok:true as const,enabled:true as const,reviews:[] as MovieReview[]};
 }
 const tmdb=process.env["TMDB_API_KEY"];const ai=process.env["LOVABLE_API_KEY"];
 if(!tmdb||!ai)return {ok:false as const,enabled:true as const,reviews:[] as MovieReview[],message:"No pude consultar las críticas, fue una bettiada."};
 try{const {fetchMovieDetail}=await import("@/server/tmdb-details");const movie=await fetchMovieDetail(data.id,tmdb,undefined);const {movieResearch}=await import("@/server/movie-research");return {ok:true as const,enabled:true as const,reviews:await movieResearch(supabaseAdmin,data.id,movie.title,movie.year,movie.originalTitle,{ai,parallel})};}catch(e){console.error("Movie research",e);return {ok:false as const,enabled:true as const,reviews:[] as MovieReview[],message:"Uy, fue una bettiada. Las críticas no respondieron."};}
});
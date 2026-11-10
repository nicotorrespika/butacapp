import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
export const getMovieResearch=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().regex(/^((movie|tv)-\d+|tt\d{5,10})$/)}).parse(v)).handler(async({data})=>{
 const tmdb=process.env["TMDB_API_KEY"];const ai=process.env["LOVABLE_API_KEY"];const parallel=process.env["PARALLEL_API_KEY"];if(!tmdb||!ai||!parallel)return {ok:false as const,reviews:[],message:"No pude consultar las críticas, fue una bettiada."};
 try{const {fetchMovieDetail}=await import("@/server/tmdb-details");const movie=await fetchMovieDetail(data.id,tmdb,undefined);const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const {movieResearch}=await import("@/server/movie-research");return {ok:true as const,reviews:await movieResearch(supabaseAdmin,data.id,movie.title,movie.year,movie.originalTitle,{ai,parallel})};}catch(e){console.error("Movie research",e);return {ok:false as const,reviews:[],message:"Uy, fue una bettiada. Las críticas no respondieron."};}
});
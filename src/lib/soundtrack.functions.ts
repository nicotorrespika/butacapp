import {createServerFn} from "@tanstack/react-start";
import {requireSupabaseAuth} from "@/integrations/supabase/auth-middleware";
import {z} from "zod";
export const fillSoundtrack=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({id:z.string().regex(/^movie-\d+$/)}).parse(v)).handler(async({data,context})=>{
  const cache=await context.supabase.from("soundtrack_updates").select("updated_at").eq("movie_id",data.id).maybeSingle();if(cache.data&&Date.now()-Date.parse(cache.data.updated_at)<7*86400000)return {ok:true};
  const key=process.env["TMDB_API_KEY"];if(!key)return {ok:false};
  try{const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const {collectSoundtrack}=await import("@/server/soundtracks");await collectSoundtrack(supabaseAdmin,data.id,key);return {ok:true};}catch{return {ok:false};}
});
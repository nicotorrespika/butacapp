import {createFileRoute} from "@tanstack/react-router";
import {authenticateCronRequest} from "@/integrations/supabase/cron-auth";
export const Route=createFileRoute("/api/public/jobs/soundtracks")({server:{handlers:{POST:async({request})=>{
  const failure=await authenticateCronRequest(request);if(failure)return failure;
  const key=process.env["TMDB_API_KEY"];if(!key)return Response.json({ok:false},{status:503});
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");const rows=await supabaseAdmin.from("movie_entries").select("external_id").eq("watched",true).eq("source","tmdb").limit(100);
  const counts=new Map<string,number>();for(const r of rows.data ?? [])counts.set(r.external_id,(counts.get(r.external_id) ?? 0)+1);
  const {collectSoundtrack}=await import("@/server/soundtracks");let done=0;
  for(const [id] of [...counts].sort((a,b)=>b[1]-a[1]).slice(0,2)){
    const routeId=id.replace(":","-");const update=await supabaseAdmin.from("soundtrack_updates").select("updated_at").eq("movie_id",routeId).maybeSingle();if(update.data&&Date.now()-Date.parse(update.data.updated_at)<7*86400000)continue;
    try{await collectSoundtrack(supabaseAdmin,routeId,key);done++;}catch{/* Keep the other movie independent. */}
  }
  return Response.json({ok:true,done});
}}}});
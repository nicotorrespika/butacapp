import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { z } from "zod";
export const Route=createFileRoute("/api/public/jobs/culture")({staticData:{sitemap:false},server:{handlers:{POST:async({request})=>{
 const failure=await authenticateCronRequest(request);if(failure)return failure;
 const body=z.object({kind:z.enum(["daily","events","cleanup"])}).safeParse(await request.json());if(!body.success)return Response.json({error:"Invalid request"},{status:400});
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 if(body.data.kind==="cleanup"){const r=await supabaseAdmin.from("cultural_events").delete().lt("starts_at",new Date(Date.now()-86400000).toISOString()).is("ends_at",null);const ended=await supabaseAdmin.from("cultural_events").delete().lt("ends_at",new Date().toISOString());return Response.json({ok:!r.error&&!ended.error});}
 const {collectCulture}=await import("@/server/culture-collector");await collectCulture(supabaseAdmin,body.data.kind,{ai:process.env["LOVABLE_API_KEY"],parallel:process.env["PARALLEL_API_KEY"],tmdb:process.env["TMDB_API_KEY"]});return Response.json({ok:true});
}}}});
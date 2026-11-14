import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/jobs/personalization')({staticData:{sitemap:false},server:{handlers:{POST:async({request})=>{
  const failure=await authenticateCronRequest(request);if(failure)return failure;
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {buildPersonalization}=await import('@/server/personalization');
  const users=await supabaseAdmin.from('personalization_jobs').select('user_id').is('paused_reason',null).order('updated_at').limit(20);
  let completed=0;
  for(const row of users.data ?? []){const lease=await supabaseAdmin.rpc('claim_personalization',{uid:row.user_id});if(!lease.data)continue;await supabaseAdmin.rpc('rebuild_tastes',{uid:row.user_id});const result=await buildPersonalization(supabaseAdmin,row.user_id,{ai:process.env['LOVABLE_API_KEY'],tmdb:process.env['TMDB_API_KEY']});if(result.ok)completed++;else break;}
  return Response.json({completed});
}}}});
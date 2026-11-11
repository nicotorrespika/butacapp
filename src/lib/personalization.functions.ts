import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const refreshPersonalization=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const claimed=await context.supabase.rpc('claim_personalization',{uid:context.userId});
  if(claimed.error)throw claimed.error;
  if(!claimed.data)return {ok:false,message:'La personalización está pausada, ya hay una actualización en curso o necesita reanudarse desde Mis gustos.'};
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {buildPersonalization}=await import('@/server/personalization');
  return buildPersonalization(supabaseAdmin,context.userId,{ai:process.env['LOVABLE_API_KEY'],tmdb:process.env['TMDB_API_KEY']});
});
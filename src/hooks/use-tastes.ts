import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { tasteScore } from '@/lib/tastes';
export function useTastes() {
  const {user}=useAuth();
  const settings=useQuery({queryKey:['tastes','settings',user?.id],enabled:!!user,queryFn:async()=>{const r=await supabase.from('taste_settings').select('*').eq('user_id',user?.id ?? '').maybeSingle();if(r.error)throw r.error;return r.data;}});
  const chips=useQuery({queryKey:['tastes','chips',user?.id],enabled:!!user,queryFn:async()=>{const r=await supabase.from('taste_chips').select('*').eq('user_id',user?.id ?? '').order('weight',{ascending:false});if(r.error)throw r.error;return r.data;}});
  return {settings,chips,paused:settings.data?.paused ?? false,score:(tags:string[])=>tasteScore(tags,chips.data ?? [],settings.data?.paused || settings.data?.recording_enabled===false)};
}
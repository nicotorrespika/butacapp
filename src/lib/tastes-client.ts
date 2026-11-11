import { supabase } from '@/integrations/supabase/client';
import type { SearchResult } from './media';
import { activityWeight,workTags } from './tastes';
export async function recordWorkTaste(result: SearchResult, change: {favorite?:boolean;score?:number|null;consumed?:boolean;queued?:boolean;dismissed?:boolean}, genres:string[]=[], extra:string[]=[]) {
  const r=await supabase.rpc('record_taste_signal',{k:`detail:${result.source}:${result.externalId}`,cat:result.mediaType,src:result.source,eid:result.externalId,work_title:result.title,work_tags:workTags(result,genres,extra),points:activityWeight(change),is_excluded:!!(change.consumed||change.dismissed)});
  if(r.error) throw r.error;
}
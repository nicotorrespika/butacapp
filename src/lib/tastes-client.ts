import { supabase } from '@/integrations/supabase/client';
import type { SearchResult } from './media';
import { activityWeight,workTags } from './tastes';
import { searchTaste, searchOpenTaste } from './search-tastes';
import type { SearchFilter, SearchResponse } from './media';
export async function recordSearchTaste(query: string, filter: SearchFilter, response?: SearchResponse) {
  const signal = searchTaste(query, filter, response);
  if (!signal) return;
  const r = await supabase.rpc('record_taste_signal', signal);
  if (r.error) throw r.error;
}
export async function recordSearchOpenTaste(result: SearchResult) {
  const r = await supabase.rpc('record_taste_signal', searchOpenTaste(result));
  if (r.error) throw r.error;
}
export async function recordWorkTaste(result: SearchResult, change: {favorite?:boolean;score?:number|null;consumed?:boolean;queued?:boolean;dismissed?:boolean}, genres:string[]=[], extra:string[]=[]) {
  const r=await supabase.rpc('record_taste_signal',{k:`detail:${result.source}:${result.externalId}`,cat:result.mediaType,src:result.source,eid:result.externalId,work_title:result.title,work_tags:workTags(result,genres,extra),points:activityWeight(change),is_excluded:!!(change.consumed||change.dismissed)});
  if(r.error) throw r.error;
}
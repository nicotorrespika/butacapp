import {expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({getMyLists:vi.fn(),getUser:vi.fn()}));
vi.mock('./queries',()=>({getMyLists:mocks.getMyLists}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getUser:mocks.getUser}}}));
import {profileListsQuery} from './social';
it('own profile includes joined lists even when someone else owns them',async()=>{
 mocks.getUser.mockResolvedValue({data:{user:{id:'me'}}});
 mocks.getMyLists.mockResolvedValue([{id:'own',owner_id:'me'},{id:'shared',owner_id:'friend'}]);
 const options=profileListsQuery('me');
 if(typeof options.queryFn!=='function')throw new Error('Missing query');
 const rows=await options.queryFn({queryKey:options.queryKey,signal:new AbortController().signal,meta:undefined,client:undefined} as Parameters<typeof options.queryFn>[0]);
 expect(rows.map(row=>row.id)).toEqual(['own','shared']);
});
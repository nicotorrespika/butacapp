import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
const pending = new Map<string, Promise<unknown>>();
/** Shared public catalog data only; never store user state in this cache. */
export async function cachedCatalog<T>(sb: SupabaseClient<Database>, key: string, load: () => Promise<T>, days = 7): Promise<T> {
  const cached = await sb.from("similar_recommendations").select("payload,updated_at").eq("cache_key",key).maybeSingle();
  if(cached.data && Date.now()-new Date(cached.data.updated_at).getTime()<days*86400000) return cached.data.payload as unknown as T;
  const active=pending.get(key);if(active)return active as Promise<T>;
  const job=(async()=>{
    try {
      const data=await load();
      const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("similar_recommendations").upsert({cache_key:key,payload:JSON.parse(JSON.stringify(data)),updated_at:new Date().toISOString()});
      return data;
    } catch(e) {if(cached.data)return cached.data.payload as unknown as T;throw e;}
    finally{pending.delete(key);}
  })();pending.set(key,job);return job;
}
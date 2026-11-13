import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { friendsQuery } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";

export function FriendsPanel(){
 const {user}=useAuth();const id=user?.id ?? "";const qc=useQueryClient();const q=useQuery({...friendsQuery(id),enabled:!!id});const [text,setText]=useState("");const [section,setSection]=useState("Seguidos");const [busy,setBusy]=useState("");const term=useDebouncedValue(text,300);
 const search=useQuery({queryKey:["social","people-search",term],enabled:term.trim().length>=2,queryFn:async()=>{const clean=term.replace(/[^\p{L}\p{N}_ ]/gu,"");const r=await supabase.rpc("search_people",{term:clean});if(r.error)throw r.error;return r.data;}});
 async function toggle(to:string){if(!id||busy)return;setBusy(to);const following=q.data?.some(f=>f.profile.id===to&&f.following);const r=following?await supabase.from("user_follows").delete().eq("follower_id",id).eq("followed_id",to):await supabase.from("user_follows").insert({follower_id:id,followed_id:to});setBusy("");if(r.error)return void toast.error("No pudimos actualizar. Probá de nuevo.");qc.invalidateQueries({queryKey:["social"]});qc.invalidateQueries({queryKey:["share"]});toast.success(following?"Dejaste de seguir":"Ya lo seguís");}
 const people=term.trim().length>=2?search.data:q.data?.filter(f=>section==="Seguidos"?f.following:f.follower).map(f=>f.profile);
 return <div className="space-y-5"><label className="block text-sm text-muted-foreground">Buscar personas<input aria-label="Buscar personas" value={text} onChange={e=>setText(e.target.value)} placeholder="Nombre o usuario" className="mt-2 h-11 w-full rounded-sm border border-input bg-card px-3 text-base"/></label><div role="tablist" aria-label="Conexiones" className="flex gap-2">{["Seguidos","Seguidores"].map(t=><Button key={t} role="tab" aria-selected={section===t} variant={section===t?"secondary":"ghost"} onClick={()=>{setSection(t);setText("");}}>{t} {q.data?.filter(f=>t==="Seguidos"?f.following:f.follower).length ?? 0}</Button>)}</div>
 {(search.isError||q.isError)&&<p className="text-sm text-muted-foreground">No pudimos cargar. Probá otra vez.</p>}
 {people?.map(p=>{const following=q.data?.some(f=>f.profile.id===p.id&&f.following);return <div key={p.id} className="flex items-center gap-3 border-b border-border py-2"><Link to="/people/$userId" params={{userId:p.id}}><UserAvatar name={p.display_name} url={p.avatar_url}/></Link><Link to="/people/$userId" params={{userId:p.id}} className="min-w-0 flex-1 truncate py-3">{p.username ?? p.display_name}</Link><Button variant="outline" disabled={busy===p.id} onClick={()=>toggle(p.id)}>{following?<UserCheck/>:<UserPlus/>}{following?"Siguiendo":"Seguir"}</Button></div>;})}
 {!q.isLoading&&!search.isFetching&&!people?.length&&<p className="py-4 text-sm text-muted-foreground">Todavía no hay nadie por acá. Buscá por nombre.</p>}
 </div>;
}

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { friendsQuery } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";

export function FriendsPanel(){
 const {user}=useAuth();const id=user?.id ?? "";const qc=useQueryClient();const q=useQuery({...friendsQuery(id),enabled:!!id});const [text,setText]=useState("");const term=useDebouncedValue(text,300);
 const search=useQuery({queryKey:["social","people-search",term],enabled:term.trim().length>=2,queryFn:async()=>{const clean=term.replace(/[^\p{L}\p{N}_ ]/gu,"");const r=await supabase.rpc("search_people",{term:clean});if(r.error)throw r.error;return r.data;}});
 const refresh=()=>qc.invalidateQueries({queryKey:["social"]});
 async function request(to:string){if(!user)return;const r=await supabase.from("friendships").insert({sender_id:id,receiver_id:to}).select("id").single();if(r.error)return void toast.error("No se pudo enviar. Revisá si ya existe una solicitud.");refresh();toast.success("Solicitud enviada",{action:{label:"Deshacer",onClick:async()=>{await supabase.from("friendships").delete().eq("id",r.data.id);refresh();}}});}
 return <div className="space-y-6"><label className="block text-sm text-muted-foreground">Buscar amigos<input aria-label="Buscar amigos" value={text} onChange={e=>setText(e.target.value)} placeholder="Buscá amigos por nombre o usuario" className="mt-2 h-12 w-full rounded-sm border border-input bg-card px-4 text-base"/></label>
 {search.isError&&<p className="text-sm text-muted-foreground">No pudimos buscar. Probá otra vez.</p>}
 {search.data?.map(p=><div key={p.id} className="flex flex-wrap items-center gap-3"><UserAvatar name={p.display_name} url={p.avatar_url}/><Link to="/people/$userId" params={{userId:p.id}} className="min-w-0 flex-1 py-3">{p.username ?? p.display_name}</Link>{q.data?.some(f=>f.sender_id===p.id||f.receiver_id===p.id)?<span className="text-xs text-muted-foreground">{q.data.find(f=>f.sender_id===p.id||f.receiver_id===p.id)?.status==="accepted"?"Amigos":"Solicitud pendiente"}</span>:<Button variant="outline" onClick={()=>request(p.id)}><UserPlus/>Agregar</Button>}</div>)}
 <Button variant="outline" onClick={async()=>{if(!user)return;const url=`${window.location.origin}/people/${user.id}`;try{if(navigator.share)await navigator.share({title:"Sumate a mi butaca",url});else{await navigator.clipboard.writeText(url);toast.success("Link de perfil copiado");}}catch{/* canceled */}}}><UserPlus/>Invitá a un amigo</Button><h2 className="font-display text-2xl">Solicitudes y mis amigos</h2>
 {q.isError&&<Button variant="outline" onClick={()=>q.refetch()}>Reintentar</Button>}
 {!q.isLoading&&!q.data?.length&&<p className="py-6 text-sm text-muted-foreground">Todavía no hay nadie en esta sala. Buscá por nombre.</p>}
 {q.data?.map(f=><div key={f.id} className="flex flex-wrap items-center gap-3"><UserAvatar name={f.profile?.display_name} url={f.profile?.avatar_url}/><Link to="/people/$userId" params={{userId:f.profile?.id ?? (f.sender_id===id?f.receiver_id:f.sender_id)}} className="min-w-0 flex-1 py-3">{f.profile?.username ?? f.profile?.display_name}</Link>{f.status==="pending"&&f.receiver_id===id?<><Button variant="outline" onClick={async()=>{const r=await supabase.rpc("accept_friend",{request_id:f.id});if(r.error)toast.error("No se pudo aceptar");else toast.success("Ya son amigos");refresh();}}><Check/>Aceptar</Button><Button variant="ghost" onClick={async()=>{await supabase.from("friendships").delete().eq("id",f.id);refresh();}}><X/>Ahora no</Button></>:<Button variant="ghost" onClick={async()=>{await supabase.from("friendships").delete().eq("id",f.id);refresh();}}><X/>{f.status==="accepted"?"Quitar":"Cancelar"}</Button>}</div>)}
 </div>;
}
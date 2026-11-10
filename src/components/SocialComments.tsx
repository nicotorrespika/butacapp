import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";

export function SocialComments({ activityId, profileId, listId, reviewItemId, reviewUserId, canComment=true }: { activityId?: string; profileId?: string; listId?: string; reviewItemId?: string; reviewUserId?: string; canComment?: boolean }) {
 const {user}=useAuth(); const qc=useQueryClient(); const [body,setBody]=useState(""); const [busy,setBusy]=useState(false);
 const key=["social","comments",activityId,profileId,listId,reviewItemId,reviewUserId];
 const q=useQuery({queryKey:key,queryFn:async()=>{
  let query=supabase.from("social_comments").select("*, profile:profiles!social_comments_user_id_fkey(username,display_name)").order("created_at");
  if(activityId)query=query.eq("activity_id",activityId);else if(profileId)query=query.eq("profile_id",profileId);else if(listId)query=query.eq("list_id",listId);
  if(reviewItemId)query=query.eq("review_item_id",reviewItemId).eq("review_user_id",reviewUserId ?? "");else query=query.is("review_item_id",null);
  const r=await query;if(r.error)throw r.error;return r.data;
 }});
 async function send(e:React.FormEvent){e.preventDefault();if(!user||!body.trim())return;setBusy(true);const r=await supabase.from("social_comments").insert({user_id:user.id,body:body.trim(),activity_id:activityId,profile_id:profileId,list_id:listId,review_item_id:reviewItemId,review_user_id:reviewUserId});setBusy(false);if(r.error)return void toast.error("No se pudo enviar. Probá otra vez.");setBody("");qc.invalidateQueries({queryKey:key});toast.success("Comentario enviado",{action:{label:"Deshacer",onClick:async()=>{const latest=await supabase.from("social_comments").select("id").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).single();if(latest.data)await supabase.from("social_comments").delete().eq("id",latest.data.id);qc.invalidateQueries({queryKey:key});}});}
 return <div className="space-y-4">
  {q.isError&&<p className="text-sm text-muted-foreground">No pudimos cargar los comentarios. <Button variant="link" onClick={()=>q.refetch()}>Reintentar</Button></p>}
  {q.data?.map(c=><article key={c.id} className="flex gap-2"><div className="min-w-0 flex-1"><Link to="/people/$userId" params={{userId:c.user_id}} className="inline-flex min-h-11 items-center text-sm">{c.profile?.username ?? c.profile?.display_name ?? "Alguien"}</Link><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{c.body}</p></div>{user?.id===c.user_id&&<Button variant="ghost" onClick={async()=>{await supabase.from("social_comments").delete().eq("id",c.id);qc.invalidateQueries({queryKey:key});}}><Trash2/>Borrar</Button>}</article>)}
  {canComment&&<form onSubmit={send} className="space-y-2"><textarea aria-label="Tu respuesta" value={body} onChange={e=>setBody(e.target.value)} placeholder="Escribí algo…" rows={2} maxLength={1000} className="w-full rounded-sm border border-input bg-card p-3 text-base"/><Button variant="outline" disabled={busy||!body.trim()} type="submit"><Send/>Responder</Button></form>}
 </div>;
}
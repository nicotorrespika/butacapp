import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Check, Copy, MessageCircle, MoreHorizontal, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { friendsQuery } from "@/lib/social";
import { shareUrl, whatsappUrl, type ShareContent } from "@/lib/sharing";
import { Button, type ButtonProps } from "./ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { UserAvatar } from "./UserAvatar";

export function ShareButton({ content, compact=false, label="Compartir", variant="ghost", icon }: { content: ShareContent; compact?: boolean; label?: string; variant?: ButtonProps["variant"]; icon?: ReactNode }) {
  const {user}=useAuth(); const qc=useQueryClient();
  const [open,setOpen]=useState(false), [term,setTerm]=useState(""), [message,setMessage]=useState(""), [selected,setSelected]=useState<string[]>([]), [busy,setBusy]=useState(false);
  const friends=useQuery({...friendsQuery(user?.id ?? ""),enabled:open && !!user});
  const permissions=useQuery({queryKey:["share","access",content.kind,content.id,user?.id],enabled:open && !!user,queryFn:async()=>{
    const [access,publicData]=await Promise.all([supabase.rpc("share_access",{k:content.kind,cid:content.id,viewer:user?.id ?? ""}),supabase.rpc("public_share_summary",{k:content.kind,cid:content.id})]);
    if(access.error)throw access.error;
    return {allowed:access.data,public:content.kind==="movie"||content.kind==="culture"||!!publicData.data};
  }});
  const recipients=useQuery({queryKey:["share","friends",content.kind,content.id,friends.data?.map(f=>f.id)],enabled:open && friends.isSuccess,queryFn:async()=>Promise.all((friends.data ?? []).filter(f=>f.status==="accepted").map(async f=>{
    const id=f.sender_id===user?.id?f.receiver_id:f.sender_id;
    const access=await supabase.rpc("share_access",{k:content.kind,cid:content.id,viewer:id});
    return {...f,peerId:id,allowed:access.data===true};
  }))});
  const recent=useQuery({queryKey:["share","recent",user?.id],enabled:open && !!user,queryFn:async()=>{
    const r=await supabase.from("direct_messages").select("sender_id,recipient_id").order("created_at",{ascending:false}).limit(100);return r.data ?? [];
  }});
  const people=[...(recipients.data ?? [])].sort((a,b)=>{
    const rank=(id:string)=>(recent.data ?? []).reduce((n,m,i)=>n+(m.sender_id===id||m.recipient_id===id?100-i:0),0);
    return rank(b.peerId)-rank(a.peerId);
  }).filter(f=>`${f.profile?.display_name} ${f.profile?.username}`.toLowerCase().includes(term.toLowerCase()));
  const locked=permissions.data ? !permissions.data.public : !!content.private;
  const log=async(channel:"chat"|"whatsapp"|"copy"|"native")=>{
    if(user)await supabase.from("content_shares").insert({user_id:user.id,kind:content.kind,content_id:content.id,channel});
  };
  async function send(){
    if(!user||!selected.length||busy)return;setBusy(true);
    const card={kind:content.kind,id:content.id,title:content.title,image:content.image?.startsWith("https://")?content.image:null,year:content.year ?? null,category:content.category ?? "Contenido"};
    const r=await supabase.from("direct_messages").insert(selected.map(id=>({sender_id:user.id,recipient_id:id,body:message.trim(),shared_url:shareUrl(content),shared_title:content.title,shared_card:card}))).select("id");setBusy(false);
    if(r.error)return void toast.error("No se pudo enviar. Revisá que tus amigos tengan acceso.");
    await log("chat");qc.invalidateQueries({queryKey:["avisos"]});setOpen(false);
    const names=people.filter(f=>selected.includes(f.peerId)).map(f=>f.profile?.display_name ?? "tu amigo");
    toast.success(`Enviado a ${names.join(", ")}`,{action:{label:"Deshacer",onClick:async()=>{
      const undone=await supabase.from("direct_messages").delete().in("id",r.data.map(m=>m.id)).select("id");
      qc.invalidateQueries({queryKey:["avisos"]});
      if(undone.error||undone.data?.length!==r.data.length)toast("Alguno ya fue leído y no se pudo deshacer.");else toast.success("Envío deshecho");
    }}});setSelected([]);setMessage("");
  }
  async function external(channel:"whatsapp"|"copy"|"native"){
    if(locked)return void toast("Este contenido es privado. Solo lo ven quienes tengan acceso.");
    try{
      if(channel==="whatsapp")window.open(whatsappUrl(content,user?.id),"_blank","noopener,noreferrer");
      else if(channel==="copy"){await navigator.clipboard.writeText(shareUrl(content,user?.id));toast.success("Link copiado, joya");}
      else if(navigator.share)await navigator.share({title:content.title,text:`Mirá esto en BUTACAPP: ${content.title}`,url:shareUrl(content,user?.id)});
      await log(channel);
    }catch(e){if(!(e instanceof Error&&e.name==="AbortError"))toast.error("No se pudo compartir. Probá copiar el link.");}
  }
  return <><Button variant={variant} size={compact?"sm":"default"} aria-label={label==="Compartir"?`Compartir ${content.title}`:label} onClick={()=>setOpen(true)}>{icon ?? <Send/>}{label}</Button>
    <Drawer open={open} onOpenChange={setOpen}><DrawerContent className="max-h-[88dvh]"><DrawerHeader><DrawerTitle>Compartir</DrawerTitle><p className="font-display text-xl text-primary">{content.title}</p></DrawerHeader>
      <div className="overflow-y-auto px-4 pb-6 space-y-4">
        <label className="flex items-center gap-2 border border-input bg-card px-3"><Search className="size-4 text-muted-foreground"/><input aria-label="Buscar amigos para compartir" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Buscá un amigo" className="h-12 min-w-0 flex-1 bg-transparent outline-none"/></label>
        <div className="flex gap-3 overflow-x-auto pb-2">{people.map(f=><Button key={f.id} variant="ghost" aria-pressed={selected.includes(f.peerId)} disabled={!f.allowed} onClick={()=>setSelected(ids=>ids.includes(f.peerId)?ids.filter(id=>id!==f.peerId):[...ids,f.peerId])} className="h-auto min-h-20 w-20 shrink-0 flex-col whitespace-normal px-1"><span className="relative"><UserAvatar name={f.profile?.display_name} url={f.profile?.avatar_url}/>{selected.includes(f.peerId)&&<Check className="absolute -right-1 -bottom-1 size-4 text-primary"/>}</span><span className="line-clamp-2 text-xs">{f.profile?.display_name}</span>{!f.allowed&&<span className="text-[10px]">Sin acceso</span>}</Button>)}</div>
        {!people.length&&<p className="text-sm text-muted-foreground">{recipients.isLoading?"Buscando a tu gente…":"No hay amigos para enviar por acá todavía."}</p>}
        <textarea aria-label="Mensaje opcional" value={message} onChange={e=>setMessage(e.target.value)} maxLength={1000} rows={2} placeholder="Agregá un mensaje (opcional)" className="w-full border border-input bg-card p-3"/>
        <Button className="w-full" disabled={!selected.length||busy||permissions.data?.allowed!==true} onClick={send}>{busy?<Loader2 className="animate-spin"/>:<Send/>}Enviar{selected.length?` (${selected.length})`:""}</Button>
        {locked&&<div className="border-t border-border pt-4"><p role="status" className="text-sm text-muted-foreground">{content.kind==="list"?"Esta lista es privada. Solo la ven quienes tengan acceso.":"Este contenido es privado. Solo lo ven quienes tengan acceso."}</p>{content.ownerId===user?.id&&(content.kind==="list"||content.kind==="profile")&&<Button variant="outline" className="mt-3" onClick={async()=>{
          if(!confirm("¿Hacer público este contenido para que cualquiera con el link pueda verlo?"))return;
          const r=content.kind==="list"?await supabase.from("lists").update({visibility:"public"}).eq("id",content.id):await supabase.from("profiles").update({share_visibility:"public"}).eq("id",content.id);
          if(r.error)toast.error("No se pudo cambiar la visibilidad.");else{qc.invalidateQueries();toast.success("Ahora es público");}
        }}>Cambiar a público</Button>}</div>}
        <div className="grid grid-cols-3 gap-1 border-t border-border pt-4 pb-6"><Button variant="ghost" className="h-auto min-h-16 flex-col px-1" disabled={locked||permissions.isLoading} onClick={()=>external("whatsapp")}><MessageCircle/>WhatsApp</Button><Button variant="ghost" className="h-auto min-h-16 flex-col px-1" disabled={locked||permissions.isLoading} onClick={()=>external("copy")}><Copy/>Copiar link</Button><Button variant="ghost" className="h-auto min-h-16 flex-col px-1" disabled={locked||permissions.isLoading} onClick={()=>external("native")}><MoreHorizontal/>Más…</Button></div>
      </div></DrawerContent></Drawer></>;
}
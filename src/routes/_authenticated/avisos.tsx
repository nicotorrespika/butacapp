import {createFileRoute,Link,useNavigate} from "@tanstack/react-router";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {useScreenState} from "@/hooks/use-screen-state";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {FriendsPanel} from "@/components/FriendsPanel";
import {Messages} from "@/components/Messages";
import {UserAvatar} from "@/components/UserAvatar";
import {BackButton} from "@/components/BackButton";
import {CheckCheck} from "lucide-react";
export const Route=createFileRoute("/_authenticated/avisos")({head:()=>({meta:[{title:"Avisos y mensajes — MOMENTO BUTACA"},{name:"description",content:"Tus amigos, mensajes privados y novedades compartidas."},{property:"og:title",content:"Avisos — MOMENTO BUTACA"},{property:"og:description",content:"Lo que pasa con tu gente, en un solo lugar."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Avisos});
function Avisos(){
  const {user}=Route.useRouteContext();
  const qc=useQueryClient();
  const navigate=useNavigate();
  const [tab,setTab]=useScreenState("avisos:section","Avisos");
  const notices=useQuery({queryKey:["avisos","notices",user.id],queryFn:async()=>{const r=await supabase.from("user_notifications").select("*,actor:profiles!user_notifications_actor_id_fkey(display_name,avatar_url)").eq("user_id",user.id).order("created_at",{ascending:false});return r.data;}});
  function openTarget(targetUrl:string|null|undefined){
    const raw=targetUrl?.trim();
    if(!raw)return;
    let parsed:URL|null=null;
    if(raw.startsWith("/")&&!raw.startsWith("//")){
      parsed=new URL(raw,window.location.origin);
    }else if(raw.startsWith("https://")||raw.startsWith("http://")){
      try{
        const candidate=new URL(raw);
        if(candidate.origin===window.location.origin)parsed=candidate;
      }catch{
        return;
      }
    }
    if(!parsed)return;
    if(parsed.pathname==="/avisos"){
      const requestedTab=parsed.searchParams.get("tab");
      setTab(requestedTab==="Mensajes"?"Mensajes":"Amigos");
      return;
    }
    void navigate({to:parsed.pathname+parsed.search,...(parsed.hash?{hash:parsed.hash.slice(1)}:{})});
  }
  return <div className="space-y-6 px-4 py-5"><BackButton/><h1 className="font-display text-4xl">Avisos</h1><div role="tablist" aria-label="Secciones de Avisos" className="flex gap-2">{["Avisos","Mensajes","Amigos"].map(t=><Button variant="ghost" role="tab" aria-selected={tab===t} key={t} onClick={()=>setTab(t)}>{t}</Button>)}</div>{tab==="Amigos"?<FriendsPanel/>:tab==="Mensajes"?<Messages/>:<><Button variant="outline" onClick={async()=>{await supabase.from("user_notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);qc.invalidateQueries({queryKey:["avisos"]});}}><CheckCheck/>Marcar todo como leído</Button>{[false,true].map(read=><section key={String(read)}><h2 className="font-display text-2xl">{read?"Antes":"Nuevas"}</h2>{notices.data?.filter(n=>!!n.read_at===read).map(n=><div className="flex gap-3 border-b border-border py-4" key={n.id}><Link to="/people/$userId" params={{userId:n.actor_id}}><UserAvatar name={n.actor?.display_name} url={n.actor?.avatar_url}/></Link><div><Link to="/people/$userId" params={{userId:n.actor_id}} className="text-sm">{n.actor?.display_name}</Link><Button variant="ghost" className="block h-auto min-h-11 whitespace-normal px-0 text-left" onClick={async()=>{if(!n.read_at){await supabase.from("user_notifications").update({read_at:new Date().toISOString()}).eq("id",n.id);qc.invalidateQueries({queryKey:["avisos"]});}openTarget(n.target_url);}}>{n.title}</Button><p className="cinema-meta text-muted-foreground">{new Date(n.created_at).toLocaleDateString("es-AR")}</p></div></div>)}</section>)}{!notices.data?.length&&<p className="py-6 text-muted-foreground">Todo tranquilo por acá, che.</p>}</>}</div>;
}
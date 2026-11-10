import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {friendsQuery} from "@/lib/social";
import {useAuth} from "@/hooks/use-auth";
import {Button} from "./ui/button";
import {Drawer,DrawerContent,DrawerHeader,DrawerTitle} from "./ui/drawer";
import {Send} from "lucide-react";
import {toast} from "sonner";
export function SendToFriend({title}:{title:string}){const {user}=useAuth();const [open,setOpen]=useState(false);const friends=useQuery({...friendsQuery(user?.id ?? ""),enabled:open&&!!user});return <><Button variant="outline" onClick={()=>setOpen(true)}><Send/>Mandar a un amigo</Button><Drawer open={open} onOpenChange={setOpen}><DrawerContent><DrawerHeader><DrawerTitle>Mandar a un amigo</DrawerTitle></DrawerHeader><div className="space-y-3 p-4">{friends.data?.filter(f=>f.status==="accepted").map(f=><Button key={f.id} variant="ghost" className="w-full justify-start" onClick={async()=>{if(!user)return;const id=f.sender_id===user.id?f.receiver_id:f.sender_id;const r=await supabase.from("direct_messages").insert({sender_id:user.id,recipient_id:id,body:"Mirá esto",shared_url:window.location.href,shared_title:title});if(r.error)return void toast.error("No se pudo mandar.");setOpen(false);toast.success("Joya, compartido");}}>{f.profile?.display_name}</Button>)}{!friends.data?.some(f=>f.status==="accepted")&&<p className="py-5 text-sm text-muted-foreground">Sumá amigos desde Avisos para compartir por acá.</p>}</div></DrawerContent></Drawer></>;}
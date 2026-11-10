import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, savePendingRedirect } from "@/hooks/use-auth";
import { internalShareTarget, sharePath, type ShareRef } from "@/lib/sharing";
import { Button } from "./ui/button";
import { Poster } from "./Poster";

export function PublicSharePage({refData,summary,inviter}:{refData:ShareRef;summary:{title:string;description:string|null;image:string|null;year:number|null;category:string}|null;inviter?:string}){
  const {user,loading}=useAuth(); const navigate=useNavigate();const path=sharePath(refData);
  useEffect(()=>{if(inviter&&/^[0-9a-f-]{36}$/i.test(inviter))sessionStorage.setItem("butacapp:invited-by",inviter);},[inviter]);
  useEffect(()=>{if(!loading&&user&&["movie","culture","event","list","profile","betty"].includes(refData.kind))void navigate({to:internalShareTarget(refData),replace:true});},[user,loading,refData.kind,refData.id,navigate]);
  return <main className="mx-auto max-w-lg space-y-6 px-6 py-8"><Link to="/" className="cinema-heading text-3xl text-primary">BUTACAPP</Link>{summary?<><p className="cinema-meta text-muted-foreground">{summary.category}{summary.year?` · ${summary.year}`:""}</p>{summary.image&&<Poster src={summary.image} alt={summary.title} media={refData.kind==="culture"?"book":"movie"} className="mx-auto w-52"/>}<h1 className="break-words font-display text-4xl text-primary">{summary.title}</h1>{summary.description&&<p className="text-sm leading-7 text-muted-foreground">{summary.description}</p>}</>:<><h1 className="font-display text-3xl">Contenido privado o no disponible</h1><p className="text-sm text-muted-foreground">Solo lo ven quienes tienen acceso. Entrá a tu cuenta para comprobarlo.</p></>}
    <Button asChild size="lg" className="w-full"><Link to="/auth" search={{redirect:path,mode:"signup"}} onClick={()=>savePendingRedirect(path)}>Entrá a BUTACAPP</Link></Button>
  </main>;
}
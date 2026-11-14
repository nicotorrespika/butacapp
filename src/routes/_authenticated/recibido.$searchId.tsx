import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {parseSharedCard,shareResult} from "@/lib/sharing";
import {ShareButton} from "@/components/ShareButton";
import {BackButton} from "@/components/BackButton";
import {ResultCard} from "@/components/ResultCard";
import {useAddToList} from "@/hooks/use-add-to-list";
import type {BettyMovie} from "@/lib/betty-types";
export const Route=createFileRoute("/_authenticated/recibido/$searchId")({staticData:{sitemap:false},head:()=>({meta:[{title:"Betty compartida — MOMENTO BUTACA"},{name:"description",content:"Recomendaciones que te compartieron."},{property:"og:title",content:"Betty compartida — MOMENTO BUTACA"},{property:"og:description",content:"Recomendaciones entre amigos."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:ReceivedBetty});
function ReceivedBetty(){const {searchId}=Route.useParams();const add=useAddToList(undefined);const q=useQuery({queryKey:["betty","received",searchId],queryFn:async()=>{const r=await supabase.rpc("shared_betty_results",{hid:searchId});if(r.error)throw r.error;return (Array.isArray(r.data)?r.data:[]) as unknown as BettyMovie[];}});return <main className="space-y-6 p-4"><BackButton/><h1 className="font-display text-3xl">Betty, de parte de un amigo</h1>{q.data?.map(m=>m?.result&&parseSharedCard(shareResult(m.result))?<article key={m.result.externalId}><ResultCard result={m.result} onAdd={add.add}/><p className="mt-3 text-sm text-muted-foreground">{m.reason}</p><ShareButton content={shareResult(m.result)}/></article>:null)}{!q.data?.length&&<p className="text-muted-foreground">No hay resultados disponibles para tu cuenta.</p>}{add.sheet}</main>;}
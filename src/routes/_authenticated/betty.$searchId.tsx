import {createFileRoute} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {BettySearch} from "@/components/BettySearch";
import {CultureBetty} from "@/components/CultureBetty";
import {BackButton} from "@/components/BackButton";
import {ErrorState} from "@/components/States";
import type {BettyMovie} from "@/lib/betty-types";
export const Route=createFileRoute("/_authenticated/betty/$searchId")({staticData:{sitemap:false},head:()=>({meta:[{title:"Lo que le pediste a Betty — MOMENTO BUTACA"},{name:"description",content:"Tus recomendaciones verificadas y guardadas, sin perder el hilo."},{property:"og:title",content:"Tu charla con Betty — MOMENTO BUTACA"},{property:"og:description",content:"Películas, discos y libros que Betty encontró para vos."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:SavedBetty});
function SavedBetty(){const {searchId}=Route.useParams();const {user}=Route.useRouteContext();const q=useQuery({queryKey:["betty","saved",searchId],staleTime:Infinity,queryFn:async()=>{const r=await supabase.from("betty_history").select("*").eq("id",searchId).eq("user_id",user.id).single();if(r.error)throw r.error;return r.data;}});if(q.isError)return <ErrorState onRetry={()=>q.refetch()}/>;if(!q.data)return <p className="p-4 text-muted-foreground">Abriendo tu charla…</p>;const rows=q.data.movies as unknown as BettyMovie[];const culture=rows.some(m=>m.result.mediaType!=="movie");return <div className="py-5"><div className="px-4 pb-6"><BackButton/></div>{culture?<CultureBetty key={searchId} type="all" saved={q.data}/>:<BettySearch key={searchId} saved={q.data}/>}</div>;}
import {useEffect,useRef,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {useNavigate} from "@tanstack/react-router";
import {Glasses} from "lucide-react";
import {getCrossUniverse} from "@/lib/similar.functions";
import {movieRouteId} from "@/lib/media";
import {cultureRouteId} from "@/lib/culture";
import {useAddToList} from "@/hooks/use-add-to-list";
import {ResultCard} from "./ResultCard";
import {Button} from "./ui/button";

const labels={movie:"PELÍCULAS",music:"MÚSICA",book:"LIBROS"} as const;
const verbs={movie:"VISTE",music:"ESCUCHASTE",book:"LEÍSTE"} as const;

/** "Porque viste X…": verified works from the other universes (cine, música, libros). Loads when scrolled into view. */
export function CrossUniverse({kind,id,type,title}:{kind:"movie"|"culture";id:string;type:"movie"|"music"|"book";title:string}){
  const el=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(false);const call=useServerFn(getCrossUniverse);const navigate=useNavigate();const add=useAddToList(undefined);
  useEffect(()=>{setVisible(false);const node=el.current;if(!node)return;const o=new IntersectionObserver(e=>{if(e.some(x=>x.isIntersecting)){setVisible(true);o.disconnect();}},{rootMargin:"200px"});o.observe(node);return()=>o.disconnect();},[id]);
  const q=useQuery({queryKey:["cross",kind,id],enabled:visible,staleTime:7*86400000,queryFn:()=>call({data:{kind,id}})});const data=q.data?.ok?q.data.data:null;
  const targets=(["movie","music","book"] as const).filter(t=>t!==type&&(data?.[t].length ?? 0)>0);
  return <div ref={el} className="space-y-6 py-4">
    <h2 className="cinema-heading text-2xl break-words">PORQUE {verbs[type]} <span className="font-display normal-case italic text-primary">{title}</span>…</h2>
    {q.isLoading||!visible?<p role="status" className="text-sm text-muted-foreground">Betty está cruzando universos…</p>:q.isError||q.data?.ok===false?<Button variant="ghost" onClick={()=>q.refetch()}><Glasses/>Betty, probá de nuevo</Button>:!targets.length?<p className="text-sm text-muted-foreground">Esta vez no encontré cruces verificados, che.</p>:null}
    {targets.map(t=><section key={t}><p className="cinema-meta mb-3 text-muted-foreground">{labels[t]}</p><div className="flex snap-x gap-4 overflow-x-auto pb-3 scrollbar-none">{data![t].map(i=><article key={i.result.externalId} className="w-36 shrink-0 snap-start"><ResultCard result={i.result} onAdd={add.add} busy={add.isBusy(i.result)} added={add.isAdded(i.result)} onOpen={r=>r.mediaType==="movie"?navigate({to:"/movie/$movieId",params:{movieId:movieRouteId(r.externalId)}}):navigate({to:"/culture/$cultureId",params:{cultureId:cultureRouteId(r.source,r.externalId)}})}/><p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{i.reason}</p></article>)}</div></section>)}
    {add.sheet}
  </div>;
}

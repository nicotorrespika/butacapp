import {useEffect,useRef,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {useNavigate} from "@tanstack/react-router";
import {Glasses} from "lucide-react";
import {getSimilar} from "@/lib/similar.functions";
import {countryLabels,isLatin,type SimilarItem} from "@/lib/similar";
import {movieRouteId} from "@/lib/media";
import {cultureRouteId} from "@/lib/culture";
import {useAddToList} from "@/hooks/use-add-to-list";
import {ResultCard} from "./ResultCard";
import {Button} from "./ui/button";
export function SimilarRecommendations({kind,id,type}:{kind:"movie"|"culture";id:string;type:"movie"|"music"|"book"}){
  const isMovie=type==="movie";
  const el=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(false),[page,setPage]=useState(1);const call=useServerFn(getSimilar);const navigate=useNavigate();const add=useAddToList(undefined);
  useEffect(()=>{setVisible(false);setPage(1);if(!isMovie)return;const node=el.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:"150px"});observer.observe(node);return()=>observer.disconnect();},[id,isMovie]);
  const q=useQuery({queryKey:["similar",kind,id,page],enabled:visible,staleTime:3*86400000,queryFn:()=>call({data:{kind,id,page}})});const data=q.data?.ok?q.data.data:null;
  const verb=type==="book"?"LEER":type==="music"?"ESCUCHAR":"VER";
  function row(items:SimilarItem[],regional=false){return <div className="flex snap-x gap-4 overflow-x-auto pb-3 scrollbar-none">{items.map(i=><article key={i.result.externalId} className="w-36 shrink-0 snap-start"><ResultCard result={i.result} onAdd={add.add} busy={add.isBusy(i.result)} added={add.isAdded(i.result)} onOpen={r=>r.mediaType==="movie"?navigate({to:"/movie/$movieId",params:{movieId:movieRouteId(r.externalId)}}):navigate({to:"/culture/$cultureId",params:{cultureId:cultureRouteId(r.source,r.externalId)}})}/>{regional&&<><p className="cinema-meta mt-3 text-muted-foreground">{i.country?countryLabels[i.country] ?? i.country:""}{i.estimated?" · estimado":""}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{i.reason}</p></>}</article>)}</div>;}
  return <div ref={el} className="space-y-8 py-4">{!isMovie&&!visible?<Button variant="outline" onClick={()=>setVisible(true)}><Glasses/>Pedirle parecidos a Betty</Button>:q.isLoading?<p role="status" className="text-sm text-muted-foreground">Betty está buscando parecidos…</p>:q.isError||q.data?.ok===false?<Button variant="ghost" onClick={()=>q.refetch()}><Glasses/>Betty, probá de nuevo</Button>:null}
    {!!data?.similar.length&&<section><h2 className="cinema-heading mb-5 text-2xl">SI TE GUSTÓ, PODÉS {verb}…</h2>{row(data.similar)}</section>}
    {!!data?.latin.length&&data.origin&&<section><h2 className="cinema-heading mb-5 text-2xl">{isLatin(data.origin)?"Más de la región":`¿Y SI MEJOR ${type==="book"?"LEEMOS":type==="music"?"ESCUCHAMOS":"VEMOS"} ALGO LATINO?`}</h2>{data.originEstimated&&<p className="cinema-meta mb-3 text-muted-foreground">Origen estimado por Betty</p>}{row(data.latin,true)}<Button variant="ghost" disabled={q.isFetching} onClick={()=>page<5?setPage(p=>p+1):q.refetch()}><Glasses/>Betty, otra opción</Button></section>}{add.sheet}
  </div>;
}
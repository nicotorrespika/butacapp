import {useEffect,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {ExternalLink,Search} from "lucide-react";
import {getMovieResearch} from "@/lib/movie-research.functions";
import {Button} from "./ui/button";
export function MovieReviews({id}:{id:string}){
 const call=useServerFn(getMovieResearch);
 const qc=useQueryClient();
 const [searching,setSearching]=useState(false);
 const [searchDone,setSearchDone]=useState(false);
 const [searchError,setSearchError]=useState(false);
 useEffect(()=>{setSearching(false);setSearchDone(false);setSearchError(false);},[id]);
 const q=useQuery({queryKey:["movie-research",id],queryFn:()=>call({data:{id}}),staleTime:3*86400000,retry:false});
 if(q.isLoading||q.isError||!q.data?.enabled)return null;
 const reviews=q.data.ok?q.data.reviews:[];
 async function searchPressReviews(){
  if(searching)return;
  setSearching(true);
  setSearchError(false);
  try{
   const res=await call({data:{id,search:true}});
   qc.setQueryData(["movie-research",id],res);
   if(!res.ok)setSearchError(true);
   setSearchDone(true);
  }catch{
   setSearchError(true);
   setSearchDone(true);
  }finally{
   setSearching(false);
  }
 }
 return <section className="space-y-4 px-4"><h2 className="font-display text-2xl">Lo que dice la crítica</h2>{reviews.length?reviews.map(r=><article key={r.url} className="border-b border-border py-4"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-display text-xl text-primary">{r.source}</h3>{r.score&&<span className="cinema-meta text-primary">{r.score}</span>}</div><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{r.summary}</p><Button asChild variant="link" className="mt-2 px-0"><a href={r.url} target="_blank" rel="noreferrer"><ExternalLink/>Leer la fuente</a></Button></article>):searching?<p role="status" className="text-sm text-muted-foreground">Betty está buscando el chisme cinéfilo…</p>:<div className="space-y-3">{searchDone&&<p className="text-sm text-muted-foreground">{searchError?"Las críticas no respondieron, fue una bettiada.":"No encontré críticas comprobadas para esta peli, che."}</p>}<Button variant="outline" disabled={searching} onClick={searchPressReviews}><Search/>Buscar críticas de la prensa</Button></div>}</section>;
}
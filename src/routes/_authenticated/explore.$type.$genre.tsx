import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { exploreGenre } from "@/lib/explore.functions";
import { BackButton } from "@/components/BackButton";
import { ResultCard } from "@/components/ResultCard";
import { ErrorState, PosterGridSkeleton } from "@/components/States";
import { useAddToList } from "@/hooks/use-add-to-list";
import { cultureRouteId } from "@/lib/culture";
import { movieRouteId } from "@/lib/media";
export const Route=createFileRoute("/_authenticated/explore/$type/$genre")({
  head:({params})=>({meta:[{title:`${params.genre} — Explorar en BUTACAPP`},{name:"description",content:`Explorá ${params.genre} y guardá tus próximos descubrimientos en BUTACAPP.`},{property:"og:title",content:`${params.genre} — BUTACAPP`},{property:"og:description",content:`Descubrí más títulos de ${params.genre}.`},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:ExplorePage,
});
function ExplorePage(){
  const {type,genre}=Route.useParams();const call=useServerFn(exploreGenre);const navigate=useNavigate();const add=useAddToList(undefined);
  const category=type==="book"?"book":type==="music"?"music":"movie";
  const q=useQuery({queryKey:["explore",category,genre],queryFn:()=>call({data:{type:category,genre}}),staleTime:3*86400000});
  return <main className="px-4 py-5"><BackButton/><h1 className="cinema-heading my-5 break-words text-3xl text-primary">{genre}</h1>{q.isError?<ErrorState onRetry={()=>q.refetch()}/>:!q.data?<PosterGridSkeleton/>:!q.data.length?<p className="text-sm text-muted-foreground">No encontré nada, probá con otro género.</p>:<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{q.data.map(r=><ResultCard key={`${r.source}:${r.externalId}`} result={r} onAdd={add.add} busy={add.isBusy(r)} added={add.isAdded(r)} onOpen={r=>r.externalId.startsWith("author:")||r.externalId.startsWith("artist:")?navigate({to:"/creator/$type/$name",params:{type:r.mediaType==="book"?"book":"music",name:r.title}}):r.mediaType==="movie"?navigate({to:"/movie/$movieId",params:{movieId:movieRouteId(r.externalId)}}):navigate({to:"/culture/$cultureId",params:{cultureId:cultureRouteId(r.source,r.externalId)}})}/>)}</div>}{add.sheet}</main>;
}
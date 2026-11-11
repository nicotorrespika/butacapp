import {ShareButton} from "@/components/ShareButton";
import {shareResult} from "@/lib/sharing";
import {supabase} from "@/integrations/supabase/client";
import {SimilarRecommendations} from "@/components/SimilarRecommendations";
import {TasteRecommendations} from "@/components/TasteRecommendations";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCultureDetail } from "@/lib/culture.functions";
import { BackButton } from "@/components/BackButton";
import { Poster } from "@/components/Poster";
import { CultureActions } from "@/components/CultureActions";
import { CultureListActivity } from "@/components/CultureListActivity";
import { ErrorState } from "@/components/States";
import { MusicLinks } from "@/components/MusicLinks";
export const Route=createFileRoute("/_authenticated/culture/$cultureId")({validateSearch:z.object({list:z.string().uuid().optional(),soundtrack:z.string().regex(/^movie-\d+$/).optional()}),head:()=>({meta:[{title:"Discos y libros — BUTACAPP"},{name:"description",content:"Fichas de discos y libros, notas, reseñas y listas compartidas."},{property:"og:title",content:"Discos y libros — BUTACAPP"},{property:"og:description",content:"Descubrí un título y compartí lo que te pareció."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:CulturePage});
function CulturePage(){const {cultureId}=Route.useParams();const {list,soundtrack}=Route.useSearch();const origin=useQuery({queryKey:["soundtrack","origin",soundtrack],enabled:!!soundtrack,queryFn:async()=>{const r=await supabase.from("movie_soundtracks").select("movie_title,movie_poster").eq("movie_id",soundtrack ?? "").limit(1).maybeSingle();return r.data;}});const call=useServerFn(getCultureDetail);const q=useQuery({queryKey:["culture","detail",cultureId],queryFn:()=>call({data:{id:cultureId}})});
 if(q.isError||q.data?.ok===false)return <div className="px-4 py-5"><BackButton/><ErrorState onRetry={()=>q.refetch()}/></div>;if(!q.data)return <p className="px-4 py-12 text-muted-foreground">Abriendo la ficha…</p>;
 const d=q.data.detail;return <div className="space-y-10 px-4 py-5"><div className="flex flex-wrap items-center justify-between gap-2"><BackButton/><ShareButton content={shareResult(d.result)}/></div>{soundtrack&&origin.data&&<Link to="/movie/$movieId" params={{movieId:soundtrack}} className="flex items-center gap-3"><Poster src={origin.data.movie_poster} alt={origin.data.movie_title} media="movie" className="w-10"/><span className="text-sm text-primary">Banda sonora de: {origin.data.movie_title}</span></Link>}<header className="flex items-start gap-5"><Poster src={d.result.imageUrl} alt={d.result.title} media={d.result.mediaType} className="w-36 shrink-0 sm:w-56"/><div className="min-w-0"><p className="cinema-meta text-muted-foreground">{d.result.kindLabel}</p><h1 className="mt-3 break-words font-display text-3xl text-primary sm:text-5xl">{d.result.title}</h1><p className="mt-3 text-sm text-muted-foreground">{d.result.creator}</p>{d.result.year&&<p className="mt-2 cinema-meta">{d.result.year}</p>}</div></header>
 {d.result.mediaType==="music"&&<MusicLinks title={d.result.title} artist={d.result.creator}/>}<div className="flex flex-wrap gap-3">{d.genres.map(g=><span key={g} className="text-xs text-muted-foreground">{g}</span>)}</div>{d.description&&<section><h2 className="mb-4 font-display text-2xl">Sinopsis</h2><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{d.description}</p></section>}
 <SimilarRecommendations kind="culture" id={cultureId} type={d.result.mediaType==="book"?"book":"music"}/>
 {(d.pages||d.publisher)&&<p className="text-sm text-muted-foreground">{[d.pages?`${d.pages} páginas · edición disponible`:null,d.publisher].filter(Boolean).join(" · ")}</p>}
 {!!d.tracks.length&&<section><h2 className="mb-4 font-display text-2xl">Canciones</h2><ol className="space-y-4">{d.tracks.map((t,i)=><li key={`${t.title}-${i}`}><p className="text-sm"><span className="mr-3 cinema-meta text-muted-foreground">{i+1}</span>{t.title}{t.duration&&<span className="ml-3 text-xs text-muted-foreground">{Math.floor(t.duration/60)}:{String(t.duration%60).padStart(2,"0")}</span>}</p>{t.preview&&<audio controls preload="none" src={t.preview} className="mt-3 w-full" aria-label={`Fragmento de ${t.title}`}/>}</li>)}</ol></section>}
 <div className="flex flex-wrap gap-4">{d.links.map(l=><a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="min-h-11 text-sm text-primary underline">{l.label} ↗</a>)}</div><CultureActions result={d.result}/><CultureListActivity result={d.result} {...(list?{listId:list}:{})}/></div>;
}
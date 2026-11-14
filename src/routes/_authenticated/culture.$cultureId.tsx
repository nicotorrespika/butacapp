import {ShareButton} from "@/components/ShareButton";
import {shareResult} from "@/lib/sharing";
import {supabase} from "@/integrations/supabase/client";
import {SimilarRecommendations} from "@/components/SimilarRecommendations";
import {BookMentions} from "@/components/BookMentions";
import {CrossUniverse} from "@/components/CrossUniverse";
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useDetailPreview } from "@/lib/detail-preview";
import { DetailPreview } from "@/components/DetailPreview";
export const Route=createFileRoute("/_authenticated/culture/$cultureId")({staticData:{sitemap:false},validateSearch:z.object({list:z.string().uuid().optional(),soundtrack:z.string().regex(/^movie-\d+$/).optional()}),head:()=>({meta:[{title:"Discos y libros — MOMENTO BUTACA"},{name:"description",content:"Fichas de discos y libros, notas, reseñas y listas compartidas."},{property:"og:title",content:"Discos y libros — MOMENTO BUTACA"},{property:"og:description",content:"Descubrí un título y compartí lo que te pareció."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:CulturePage});
function CulturePage(){const {cultureId}=Route.useParams();const preview=useDetailPreview(cultureId);const {list,soundtrack}=Route.useSearch();const origin=useQuery({queryKey:["soundtrack","origin",soundtrack],enabled:!!soundtrack,queryFn:async()=>{const r=await supabase.from("movie_soundtracks").select("movie_title,movie_poster").eq("movie_id",soundtrack ?? "").limit(1).maybeSingle();return r.data;}});const call=useServerFn(getCultureDetail);const q=useQuery({queryKey:["culture","detail",cultureId],queryFn:()=>call({data:{id:cultureId}}),staleTime:30*60_000});
 if(q.isError||q.data?.ok===false)return <div className="px-4 py-5"><BackButton/><ErrorState onRetry={()=>q.refetch()}/></div>;if(!q.data)return <DetailPreview result={preview}/>;
 const d=q.data.detail;const type=d.result.mediaType==="book"?"book":"music";
 return <div className="space-y-5 px-4 py-5">
 <div className="flex flex-wrap items-center justify-between gap-2"><BackButton/><ShareButton content={shareResult(d.result)}/></div>
 {soundtrack&&origin.data&&<Link to="/movie/$movieId" params={{movieId:soundtrack}} className="flex items-center gap-3"><Poster src={origin.data.movie_poster} alt={origin.data.movie_title} media="movie" className="w-10"/><span className="text-sm text-primary">Banda sonora de: {origin.data.movie_title}</span></Link>}
 <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 sm:items-center">
 <Poster src={d.result.imageUrl} alt={d.result.title} media={d.result.mediaType} className="w-24 shrink-0 sm:w-32"/>
 <div className="min-w-0"><p className="cinema-meta text-muted-foreground">{d.result.kindLabel}</p><h1 className="mt-1 break-words font-display text-3xl leading-tight text-primary sm:text-4xl">{d.result.title}</h1>
 {d.result.creator&&<div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm"><span className="cinema-meta text-muted-foreground">{type==="book"?"Por":"Artista"}</span>{d.result.creator.split(" · ").map(n=><Link key={n} to="/creator/$type/$name" params={{type,name:n}} className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline">{n}</Link>)}</div>}
 <p className="mt-2 text-xs text-muted-foreground">{d.result.year}</p><div className="mt-2 flex flex-wrap gap-1">{d.genres.map(g=><Button key={g} asChild variant="ghost" size="sm"><Link to="/explore/$type/$genre" params={{type,genre:g}}>{g}</Link></Button>)}</div></div></header>
 {type==="book"&&<div className="flex flex-wrap gap-2">{["Autores argentinos","Novelas argentinas"].map(g=><Button key={g} asChild variant="outline" size="sm"><Link to="/explore/$type/$genre" params={{type:"book",genre:g}}>{g}</Link></Button>)}</div>}
 <CultureActions key={`controls-${cultureId}`} section="controls" result={d.result} genres={d.genres}/>
 {!!d.ratings?.length&&<section className="grid grid-cols-2 gap-2">{d.ratings.map(r=><div key={r.source} className="border border-border px-2 py-2"><p className="cinema-meta text-muted-foreground">{r.source}</p><p className="font-display text-2xl text-primary">{r.value.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></p><p className="text-xs text-muted-foreground">{r.count} {r.count===1?"voto":"votos"}</p></div>)}</section>}
 {d.preview&&<a href={d.preview.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center border border-primary px-4 text-sm font-semibold text-primary">{d.preview.label}</a>}
 {d.description&&<section><h2 className="mb-3 font-display text-2xl">{type==="book"?"Sinopsis":"Sobre el disco"}</h2><p className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{d.description}</p></section>}
 {type==="music"&&<MusicLinks title={d.result.title} artist={d.result.creator}/>}
 <Accordion key={cultureId} type="multiple">
 {(d.pages||d.publisher||d.links.length>0)&&<AccordionItem value="details"><AccordionTrigger className="min-h-11 py-3 font-display text-xl">{type==="book"?"Ficha del libro":"Ficha del disco"}</AccordionTrigger><AccordionContent><dl className="space-y-3 text-sm">{d.pages&&<div><dt className="cinema-meta text-muted-foreground">Páginas · edición disponible</dt><dd>{d.pages}</dd></div>}{d.publisher&&<div><dt className="cinema-meta text-muted-foreground">Editorial</dt><dd>{d.publisher}</dd></div>}</dl><div className="mt-3 flex flex-wrap gap-4">{d.links.map(l=><a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm text-primary underline">{l.label} ↗</a>)}</div></AccordionContent></AccordionItem>}
 {!!d.tracks.length&&<AccordionItem value="tracks"><AccordionTrigger className="min-h-11 py-3 font-display text-xl">Canciones ({d.tracks.length})</AccordionTrigger><AccordionContent><ol className="space-y-4">{d.tracks.map((t,i)=><li key={`${t.title}-${i}`}><p className="text-sm"><span className="mr-3 cinema-meta text-muted-foreground">{i+1}</span>{t.title}{t.duration&&<span className="ml-3 text-xs text-muted-foreground">{Math.floor(t.duration/60)}:{String(t.duration%60).padStart(2,"0")}</span>}</p>{t.preview&&<audio controls preload="none" src={t.preview} className="mt-3 w-full" aria-label={`Fragmento de ${t.title}`}/>}</li>)}</ol></AccordionContent></AccordionItem>}
 </Accordion>
 {type==="book"&&<BookMentions key={`mentions-${cultureId}`} id={cultureId} title={d.result.title}/>}
 <CultureActions key={`review-${cultureId}`} section="review" result={d.result} genres={d.genres}/>
 <SimilarRecommendations key={`similar-${cultureId}`} kind="culture" id={cultureId} type={type}/>
 <CrossUniverse kind="culture" id={cultureId} type={type} title={d.result.title}/>
 <TasteRecommendations anchor={{source:d.result.source,id:d.result.externalId,title:d.result.title,verb:type==="book"?"leíste":"escuchaste"}}/>
 <CultureListActivity result={d.result} {...(list?{listId:list}:{})}/>
 </div>;
}

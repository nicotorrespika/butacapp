import {ShareButton} from "@/components/ShareButton";
import {shareResult} from "@/lib/sharing";
import {Soundtrack} from "@/components/Soundtrack";
import {SimilarRecommendations} from "@/components/SimilarRecommendations";
import {CrossUniverse} from "@/components/CrossUniverse";
import {TasteRecommendations} from "@/components/TasteRecommendations";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { BackButton } from "@/components/BackButton";
import { FetchProblem } from "@/components/FetchProblem";
import { MediaRow, useCardProps } from "@/components/MediaRow";
import { Poster } from "@/components/Poster";
import { MovieTrailer } from "@/components/MovieTrailer";
import { MovieListActivity } from "@/components/MovieListActivity";
import { MovieActions } from "@/components/MovieActions";
import { MovieReviews } from "@/components/MovieReviews";
import { Skeleton } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAddToList } from "@/hooks/use-add-to-list";
import type { CreditPerson, CriticScore, MovieDetail } from "@/lib/movie-types";
import { getMovie } from "@/lib/movies.functions";
import { StarRating } from "@/components/StarRating";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useDetailPreview } from "@/lib/detail-preview";
import { DetailPreview } from "@/components/DetailPreview";

export const Route = createFileRoute("/_authenticated/movie/$movieId")({
  validateSearch: z.object({ list: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Película — BUTACAPP" },
      { name: "description", content: "Sinopsis, puntajes de la crítica y películas parecidas para sumar a tu lista." },
      { property: "og:title", content: "Película — BUTACAPP" },
      { property: "og:description", content: "Puntajes de la crítica y películas parecidas." },
    ],
  }),
  component: MoviePage,
});

function MoviePage() {
  const { movieId } = Route.useParams();
  const preview=useDetailPreview(movieId);
  const { list } = Route.useSearch();
  const fetchMovie = useServerFn(getMovie);
  const q = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => fetchMovie({ data: { id: movieId } }),
    staleTime: 30 * 60_000,
  });
  const adder = useAddToList(list);
  const cardProps = useCardProps(adder, list);

  if (q.isLoading) return <DetailPreview result={preview} />;
  if (q.isError || !q.data || !q.data.ok) return (
    <div>
      <FetchProblem reason={q.data && !q.data.ok ? q.data.reason : "provider"} onRetry={() => q.refetch()} />
      <div className="flex justify-center px-4">
        <Button asChild variant="outline">
          <a href={/^tt\d+$/.test(movieId) ? `https://www.imdb.com/title/${movieId}/` : "https://www.imdb.com/"} target="_blank" rel="noreferrer"><ExternalLink /> Abrir IMDb</a>
        </Button>
      </div>
    </div>
  );

  const m = q.data.data;
  const meta = [
    m.year,
    m.runtime ? `${m.runtime} min` : null,
    m.seasons ? `${m.seasons} temporada${m.seasons > 1 ? "s" : ""}` : null,
    m.countries[0],
  ].filter(Boolean);

  return (
    <div className="pb-6">
      {/* Backdrop hero */}
      <header className="relative">
        {m.backdropUrl && <div className="absolute inset-x-0 top-0 h-80 overflow-hidden">
          <img src={m.backdropUrl} alt="" className="h-full w-full object-cover opacity-35 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>}
        <div className="relative px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <div className="flex flex-wrap items-center justify-between gap-2"><BackButton /><ShareButton content={shareResult(m.result)}/></div>
          <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 sm:items-center">
            <Poster src={m.posterUrl} alt={m.title} media="movie" className="w-24 shrink-0 sm:w-32" />
            <div className="min-w-0 pb-1 animate-rise">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {m.type === "tv" ? "Serie" : "Película"}
              </p>
              <h1 className="mt-1 break-words font-display text-3xl leading-tight text-primary sm:text-4xl">{m.title}</h1>
              {m.originalTitle && <p className="mt-1 text-xs italic text-muted-foreground">{m.originalTitle}</p>}
              {m.directors.length > 0 && <div className="mt-2"><PeopleLine people={m.directors} listId={list} /></div>}
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1">{[["AÑO",m.year],["DURACIÓN",m.runtime?`${m.runtime} min`:null],["GÉNERO",m.genres.join(" · ")]].filter(([,value])=>value).map(([label,value])=><div key={label} className="min-w-0"><dt className="sr-only">{label}</dt><dd className="text-xs text-muted-foreground">{value}</dd></div>)}</dl>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4 px-4"><MovieActions key={m.routeId} section="controls" result={m.result} genres={m.genres} extra={m.countries} onAddPending={()=>void adder.add(m.result)}/><div className="mt-2"><Scores scores={m.scores}/></div></section>
      <div className="mt-6 space-y-8 px-4">

        {(m.overview || m.genres.length > 0) && (
          <section>
            {m.genres.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {m.genres.map((g) => (
                  <li key={g}>
                    <Button asChild variant="ghost" size="sm"><Link to="/explore/$type/$genre" params={{type:"movie",genre:g}}>{g}</Link></Button>
                  </li>
                ))}
              </ul>
            )}
            {m.overview && <><h2 className="mt-8 font-display text-2xl">Sinopsis</h2><p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{m.overview}</p></>}
          </section>
        )}
      </div>

      {m.trailerKey && <div className="mt-8"><MovieTrailer key={m.trailerKey} videoKey={m.trailerKey} title={m.title} posterUrl={m.backdropUrl ?? m.posterUrl} /></div>}
      <Accordion key={m.routeId} type="multiple" className="mt-3 px-4">
        {m.cast.length > 0 && <AccordionItem value="cast"><AccordionTrigger className="min-h-11 py-3 font-display text-xl">Reparto</AccordionTrigger><AccordionContent><CastRow cast={m.cast} listId={list} /></AccordionContent></AccordionItem>}
        {!!m.crew?.length && <AccordionItem value="crew"><AccordionTrigger className="min-h-11 py-3 font-display text-xl">Ficha técnica</AccordionTrigger><AccordionContent><TechnicalCredits crew={m.crew} listId={list} /></AccordionContent></AccordionItem>}
        <AccordionItem value="soundtrack"><AccordionTrigger className="min-h-11 py-3 font-display text-xl">Soundtrack</AccordionTrigger><AccordionContent><Soundtrack id={m.routeId} title={m.title} poster={m.posterUrl}/></AccordionContent></AccordionItem>
      </Accordion>
      <section className="mt-4 px-4"><MovieActions key={`review-${m.routeId}`} section="review" result={m.result} genres={m.genres} extra={m.countries}/></section>
      <section className="px-4"><SimilarRecommendations kind="movie" id={m.routeId} type="movie"/><CrossUniverse kind="movie" id={m.routeId} type="movie" title={m.title}/></section>
      <div className="mt-10 space-y-10">
        <MovieListActivity key={m.routeId} movie={m} listId={list} />
        <TasteRecommendations anchor={{source:m.result.source,id:m.result.externalId,title:m.title,verb:'viste'}}/>
        <section className="px-4"><h2 className="mb-4 font-display text-2xl">Dónde verla en Argentina</h2>{m.watchProviders?.names.length?<><p className="mb-3 text-sm text-muted-foreground">{m.watchProviders.names.join(" · ")}</p><ExtLink href={m.watchProviders.link}>Ver opciones</ExtLink><p className="mt-3 text-xs text-muted-foreground">Disponibilidad: JustWatch vía TMDB.</p></>:<p className="text-sm text-muted-foreground">No hay opciones registradas acá todavía, che.</p>}</section>
        <div className="space-y-6 px-4">
          <div className="flex flex-wrap gap-2">
            {m.links.letterboxd && <ExtLink href={m.links.letterboxd}>Letterboxd</ExtLink>}
            {m.links.imdb && <ExtLink href={m.links.imdb}>IMDb</ExtLink>}
            <ExtLink href={m.links.tmdb}>TMDB</ExtLink>
          </div>
        </div>
      </div>

      <MovieReviews id={m.routeId}/>
      <div className="mt-8 space-y-8">
        {m.sections.filter(s=>s.id!=="recommended").map((s) => (
          <MediaRow
            key={s.id}
            title={s.title}
            items={s.items}
            cardProps={cardProps}
            action={
              s.personId ? (
                <Link
                  to="/person/$personId"
                  params={{ personId: String(s.personId) }}
                  search={{ list }}
                  className="flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary"
                >
                  Filmografía
                </Link>
              ) : undefined
            }
          />
        ))}
      </div>
      <p className="cinema-meta px-4 pt-10 text-muted-foreground">UNA FUNCIÓN DE BUTACAPP</p>
      {adder.sheet}
    </div>
  );
}

function PeopleLine({ people, listId }: { people: CreditPerson[]; listId: string | undefined }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      {people[0]?.role === "Creación" ? <span className="cinema-meta">CREADA POR</span> : <span className="cinema-meta">DIRIGIDA POR</span>}
      {people.map((p, i) => (
        <span key={p.id}>
          {i > 0 && ", "}
          <Link
            to="/person/$personId"
            params={{ personId: String(p.id) }}
            search={{ list: listId }}
            className="inline-flex min-h-11 items-center font-medium text-foreground transition-colors hover:text-primary"
          >
            {p.name}
          </Link>
        </span>
      ))}
    </div>
  );
}

const SCORE_STYLE: Record<CriticScore["source"], string> = {
  tmdb: "TMDB · usuarios",
  imdb: "IMDb · usuarios",
  rt: "Rotten Tomatoes · crítica",
  metacritic: "Metacritic · crítica",
};

function Scores({ scores }: { scores: CriticScore[] }) {
  const publicScore = scores.find(s => s.source === "tmdb");
  return <section aria-label="Promedios del público y la crítica" className="max-w-2xl border-y border-border py-2">
    <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><h2 className="cinema-meta text-muted-foreground">Promedio del público</h2><span className="text-[10px] text-muted-foreground">{publicScore?.votes ? `${publicScore.votes.toLocaleString("es-AR")} votos` : "TMDB"}</span></div>
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">{(["tmdb","imdb","rt","metacritic"] as const).map(source => {
      const score = scores.find(s => s.source === source);
      const value = <><p className="flex min-h-7 items-center font-mono text-[9px] uppercase leading-tight text-muted-foreground sm:text-[10px]">{source === "tmdb" ? "Público · TMDB" : source === "imdb" ? "IMDb" : source === "rt" ? "Rotten Tomatoes" : "Metacritic"}</p><p className="mt-1 font-heading text-2xl leading-none text-foreground">{score?.value ?? "—"}{score && (source === "tmdb" || source === "imdb") && <span className="text-xs text-muted-foreground">/10</span>}</p></>;
      return score?.url ? <a key={source} href={score.url} target="_blank" rel="noreferrer" className="min-w-0 rounded-sm border border-border bg-card px-2 py-2">{value}</a> : <div key={source} className="min-w-0 rounded-sm border border-border bg-card px-2 py-2">{value}</div>;
    })}</div>
  </section>;
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalLink /> {children}
      </a>
    </Button>
  );
}

const CREW_LABELS: Record<string, string> = {
  Director: "Dirección", "Director of Photography": "Dirección de fotografía",
  "Art Direction": "Dirección de arte", "Production Design": "Diseño de producción",
  Editor: "Montaje", Screenplay: "Guion", Writer: "Guion", Story: "Historia",
  "Original Music Composer": "Música original", Producer: "Producción",
  "Executive Producer": "Producción ejecutiva", "Co-Producer": "Coproducción",
  "Costume Design": "Vestuario", "Set Decoration": "Decoración",
  "Sound Designer": "Diseño de sonido", "Sound Director": "Dirección de sonido",
  "Sound Mixer": "Mezcla de sonido", "Sound Recordist": "Grabación de sonido",
  "Sound Re-Recording Mixer": "Mezcla final", "Sound Editor": "Edición de sonido",
  "Makeup Artist": "Maquillaje", "Hair Designer": "Peluquería", Hairstylist: "Peluquería",
  Casting: "Casting", "Visual Effects Supervisor": "Supervisión de efectos visuales",
  "Special Effects Supervisor": "Supervisión de efectos especiales",
  "First Assistant Director": "Primera asistencia de dirección", "Assistant Director": "Asistencia de dirección",
  "Second Assistant Director": "Segunda asistencia de dirección", "Camera Operator": "Cámara",
  "Still Photographer": "Fotografía fija", Gaffer: "Iluminación", "Script Supervisor": "Continuidad",
  "Production Manager": "Jefatura de producción", "Production Assistant": "Asistencia de producción",
  "Stunt Coordinator": "Coordinación de dobles", Stunts: "Dobles de riesgo",
  "Music Supervisor": "Supervisión musical", "Original Story": "Historia original", Novel: "Novela original",
};

function TechnicalCredits({ crew, listId }: { crew: CreditPerson[]; listId: string | undefined }) {
  const groups = new Map<string, CreditPerson[]>();
  for (const person of crew) {
    const role = person.role ?? "Equipo";
    const group = groups.get(role) ?? [];
    if (!group.some(p => p.id === person.id)) group.push(person);
    groups.set(role, group);
  }
  const priority = ["Director", "Director of Photography", "Art Direction", "Production Design", "Editor", "Screenplay", "Writer", "Original Music Composer"];
  const rank = (role: string) => { const index = priority.indexOf(role); return index < 0 ? priority.length : index; };
  return <section><dl className="grid gap-x-8 sm:grid-cols-2">{[...groups].sort(([a], [b]) => rank(a) - rank(b)).map(([role, people]) => <div key={role} className="min-w-0 border-b border-border/50 py-3"><dt className="cinema-meta break-words text-muted-foreground">{CREW_LABELS[role] ?? role}</dt><dd className="mt-1 flex flex-wrap gap-x-3">{people.map(person => <Link key={person.id} to="/person/$personId" params={{ personId: String(person.id) }} search={{ list: listId }} className="min-h-11 py-3 text-sm text-primary">{person.name}</Link>)}</dd></div>)}</dl><p className="mt-4 text-xs text-muted-foreground">Créditos: TMDB · <a className="text-primary" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">Fuente ↗</a></p></section>;
}

function CastRow({ cast, listId }: { cast: CreditPerson[]; listId: string | undefined }) {
  return (
    <section>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {cast.map((c) => (
          <Link
            key={c.id}
            to="/person/$personId"
            params={{ personId: String(c.id) }}
            search={{ list: listId }}
            className="w-24 shrink-0 text-center transition-transform active:scale-[0.97]"
          >
            <div className="mx-auto aspect-[3/4] w-20 overflow-hidden rounded-sm bg-secondary">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center font-display text-2xl text-muted-foreground">
                  {c.name.charAt(0)}
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight">{c.name}</p>
            {c.role && <p className="line-clamp-1 text-[11px] text-muted-foreground">{c.role}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MovieSkeleton() {
  return (
    <div className="px-4 pt-4">
      <Skeleton className="size-11 rounded-full" />
      <div className="mt-24 flex items-end gap-4">
        <Skeleton className="aspect-[2/3] w-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-full" />
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}

export type { MovieDetail };

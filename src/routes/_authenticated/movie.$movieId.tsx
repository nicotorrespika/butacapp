import {ShareButton} from "@/components/ShareButton";
import {shareResult} from "@/lib/sharing";
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
import { cn } from "@/lib/utils";

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
  const { list } = Route.useSearch();
  const fetchMovie = useServerFn(getMovie);
  const q = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => fetchMovie({ data: { id: movieId } }),
    staleTime: 30 * 60_000,
  });
  const adder = useAddToList(list);
  const cardProps = useCardProps(adder, list);

  if (q.isLoading) return <MovieSkeleton />;
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
          <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
            <Poster src={m.posterUrl} alt={m.title} media="movie" className="w-44 shrink-0 sm:w-48" />
            <div className="min-w-0 pb-1 animate-rise">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {m.type === "tv" ? "Serie" : "Película"}
              </p>
              <h1 className="mt-2 break-words font-display text-5xl leading-tight text-primary">{m.title}</h1>
              {m.originalTitle && <p className="mt-1 text-xs italic text-muted-foreground">{m.originalTitle}</p>}
              <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4">{[["AÑO",m.year],["DURACIÓN",m.runtime?`${m.runtime} min`:null],["GÉNERO",m.genres.join(" · ")]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt className="cinema-meta text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}</dl>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-8 px-4">
        {m.directors.length > 0 && <PeopleLine people={m.directors} listId={list} />}

        {(m.overview || m.genres.length > 0) && (
          <section>
            {m.genres.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {m.genres.map((g) => (
                  <li key={g} className="rounded-sm bg-card px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {g}
                  </li>
                ))}
              </ul>
            )}
            {m.overview && <><h2 className="mt-8 font-display text-2xl">Sinopsis</h2><p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{m.overview}</p></>}
          </section>
        )}
      </div>

      {m.cast.length > 0 && <CastRow cast={m.cast} listId={list} />}
      <div className="mt-10 space-y-10">
        {m.trailerKey && <MovieTrailer key={m.trailerKey} videoKey={m.trailerKey} title={m.title} posterUrl={m.backdropUrl ?? m.posterUrl} />}
        <MovieListActivity key={m.routeId} movie={m} listId={list} />
        <section className="px-4"><MovieActions key={m.routeId} result={m.result}/></section>
        <section className="px-4"><h2 className="mb-4 font-display text-2xl">Dónde verla en Argentina</h2>{m.watchProviders?.names.length?<><p className="mb-3 text-sm text-muted-foreground">{m.watchProviders.names.join(" · ")}</p><ExtLink href={m.watchProviders.link}>Ver opciones</ExtLink><p className="mt-3 text-xs text-muted-foreground">Disponibilidad: JustWatch vía TMDB.</p></>:<p className="text-sm text-muted-foreground">No hay opciones registradas acá todavía, che.</p>}</section>
        <div className="space-y-6 px-4">
          <Scores scores={m.scores} />
          <div className="flex flex-wrap gap-2">
            {m.links.letterboxd && <ExtLink href={m.links.letterboxd}>Letterboxd</ExtLink>}
            {m.links.imdb && <ExtLink href={m.links.imdb}>IMDb</ExtLink>}
            <ExtLink href={m.links.tmdb}>TMDB</ExtLink>
          </div>
        </div>
      </div>

      <MovieReviews id={m.routeId}/>
      <div className="mt-8 space-y-8">
        {m.sections.map((s) => (
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
  if (!scores.length) return null;
  return (
    <section aria-label="Puntajes" className="grid grid-cols-2 gap-2">
      {scores.map((s) => (
        <a
          key={s.source}
          href={s.url ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="py-3 transition-colors active:bg-accent"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {SCORE_STYLE[s.source]}
          </p>
          <p
            className={cn(
              "mt-1 font-display text-4xl leading-none",
              "text-foreground",
            )}
          >
            {s.value}
            {(s.source === "tmdb" || s.source === "imdb") && (
              <span className="text-base text-muted-foreground">/10</span>
            )}
          </p>
          {s.votes ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{s.votes.toLocaleString("es-AR")} votos</p>
          ) : null}
        </a>
      ))}
    </section>
  );
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

function CastRow({ cast, listId }: { cast: CreditPerson[]; listId: string | undefined }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 px-4 font-display text-2xl">Reparto</h2>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none">
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

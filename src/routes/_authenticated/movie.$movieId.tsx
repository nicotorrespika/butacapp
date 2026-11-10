import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ExternalLink, Loader2, Plus } from "lucide-react";
import { z } from "zod";
import { BackButton } from "@/components/BackButton";
import { FetchProblem } from "@/components/FetchProblem";
import { MediaRow, useCardProps } from "@/components/MediaRow";
import { Poster } from "@/components/Poster";
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
      { title: "Película — Butaca" },
      { name: "description", content: "Sinopsis, puntajes de la crítica y películas parecidas para sumar a tu lista." },
      { property: "og:title", content: "Película — Butaca" },
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
  if (q.isError || !q.data) return <FetchProblem reason="provider" onRetry={() => q.refetch()} />;
  if (!q.data.ok) return <FetchProblem reason={q.data.reason} onRetry={() => q.refetch()} />;

  const m = q.data.data;
  const added = adder.isAdded(m.result);
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
        <div className="absolute inset-x-0 top-0 h-72 overflow-hidden">
          {m.backdropUrl && <img src={m.backdropUrl} alt="" className="h-full w-full object-cover opacity-60" />}
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>
        <div className="relative px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <BackButton />
          <div className="mt-24 flex items-end gap-4">
            <Poster src={m.posterUrl} alt={m.title} media="movie" className="w-32 shrink-0 shadow-2xl" />
            <div className="min-w-0 pb-1 animate-rise">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {m.type === "tv" ? "Serie" : "Película"}
              </p>
              <h1 className="mt-1 font-display text-4xl leading-[0.95]">{m.title}</h1>
              {m.originalTitle && <p className="mt-1 text-xs italic text-muted-foreground">{m.originalTitle}</p>}
              <p className="mt-2 text-sm text-muted-foreground">{meta.join(" · ")}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-5 space-y-6 px-4">
        {m.directors.length > 0 && <PeopleLine people={m.directors} listId={list} />}

        {/* Main action */}
        <Button
          size="lg"
          variant={added ? "done" : "default"}
          className="w-full"
          disabled={added || adder.isBusy(m.result)}
          onClick={() => adder.add(m.result)}
        >
          {adder.isBusy(m.result) ? <Loader2 className="animate-spin" /> : added ? <Check /> : <Plus />}
          {added
            ? `En «${adder.targetList?.name ?? "tu lista"}»`
            : adder.targetList
              ? `Agregar a «${adder.targetList.name}»`
              : "Agregar a una lista"}
        </Button>

        {/* Critic scores */}
        <Scores scores={m.scores} />

        <div className="flex flex-wrap gap-2">
          {m.links.letterboxd && <ExtLink href={m.links.letterboxd}>Letterboxd</ExtLink>}
          {m.links.imdb && <ExtLink href={m.links.imdb}>IMDb</ExtLink>}
          <ExtLink href={m.links.tmdb}>TMDB</ExtLink>
        </div>

        {(m.overview || m.genres.length > 0) && (
          <section>
            {m.tagline && <p className="font-display text-xl italic text-primary">«{m.tagline}»</p>}
            {m.overview && <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">{m.overview}</p>}
            {m.genres.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {m.genres.map((g) => (
                  <li key={g} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {g}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {m.cast.length > 0 && <CastRow cast={m.cast} listId={list} />}

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
      {adder.sheet}
    </div>
  );
}

function PeopleLine({ people, listId }: { people: CreditPerson[]; listId: string | undefined }) {
  return (
    <p className="text-sm text-muted-foreground">
      {people[0]?.role === "Creación" ? "Creada por " : "Dirigida por "}
      {people.map((p, i) => (
        <span key={p.id}>
          {i > 0 && ", "}
          <Link
            to="/person/$personId"
            params={{ personId: String(p.id) }}
            search={{ list: listId }}
            className="font-semibold text-foreground underline decoration-primary/60 underline-offset-4"
          >
            {p.name}
          </Link>
        </span>
      ))}
    </p>
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
          className="rounded-2xl border border-border bg-secondary/50 p-3 transition-colors active:bg-accent"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {SCORE_STYLE[s.source]}
          </p>
          <p
            className={cn(
              "mt-1 font-display text-4xl leading-none",
              s.percent >= 75 ? "text-success" : s.percent >= 55 ? "text-primary" : "text-destructive",
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
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
        {cast.map((c) => (
          <Link
            key={c.id}
            to="/person/$personId"
            params={{ personId: String(c.id) }}
            search={{ list: listId }}
            className="w-24 shrink-0 text-center transition-transform active:scale-[0.97]"
          >
            <div className="mx-auto size-20 overflow-hidden rounded-full border border-border bg-secondary">
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

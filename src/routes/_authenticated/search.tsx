import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Search, SearchX, X } from "lucide-react";
import { z } from "zod";
import { ResultCard } from "@/components/ResultCard";
import { EmptyState, ErrorState, PosterGridSkeleton } from "@/components/States";
import { Button } from "@/components/ui/button";
import { resultKey, useAddToList } from "@/hooks/use-add-to-list";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  departmentLabel,
  hasMoviePage,
  MEDIA_LABEL,
  movieRouteId,
  type MediaType,
  type PersonResult,
  type SearchFilter,
  type SearchResult,
} from "@/lib/media";
import { searchMedia } from "@/lib/search.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: z.object({
    q: z.string().optional(),
    f: z.enum(["all", "movie", "music", "art"]).optional(),
    /** When set, "+" adds straight into this list (opened from a list's "Agregar" button). */
    list: z.string().uuid().optional(),
    top: z.boolean().optional(),
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Buscar — Butaca" },
      { name: "description", content: "Buscá películas, series, discos, canciones y obras de arte en un solo lugar." },
      { property: "og:title", content: "Buscar — Butaca" },
      { property: "og:description", content: "Un buscador para películas, música y arte." },
    ],
  }),
  component: SearchPage,
});

const CHIPS: { id: SearchFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "movie", label: "Películas" },
  { id: "music", label: "Música" },
  { id: "art", label: "Arte" },
];

const SUGGESTIONS = ["Tarkovsky 1979", "Radiohead OK Computer", "Wong Kar-wai", "Monet", "1994", "Björk", "Frida Kahlo"];

function SearchPage() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const [text, setText] = useState(params.q ?? "");
  const filter: SearchFilter = params.f ?? "all";
  const q = useDebouncedValue(text.trim(), 350);
  const search = useServerFn(searchMedia);
  const adder = useAddToList(params.list);
  const targetList = adder.targetList;

  // Movies with a TMDB/IMDb id open their page (synopsis, scores, similar titles).
  function openMovie(r: SearchResult) {
    if (!hasMoviePage(r.source, r.mediaType)) return;
    void navigate({
      to: "/movie/$movieId",
      params: { movieId: movieRouteId(r.externalId) },
      search: { list: params.list },
    });
  }
  const cardProps = (r: SearchResult) => ({
    result: r,
    onAdd: params.top ? async (r: SearchResult) => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const p = await supabase.from("profiles").select("top_five").eq("id",user.id).single();
      const top = topFive(p.data?.top_five);
      if(top.length>=5) return void toast.error("Tu Top 5 está completo. Quitá una película desde Perfil.");
      if(top.some(m=>m.externalId===r.externalId)) return void toast("Ya está en tu Top 5");
      const result=await supabase.from("profiles").update({top_five:JSON.parse(JSON.stringify([...top,r]))}).eq("id",user.id);
      if(result.error)toast.error("No se pudo guardar");else toast.success("Agregada a tu Top 5");
    } : adder.add,
    added: adder.isAdded(r),
    busy: adder.isBusy(r),
    targetName: targetList?.name,
    onOpen: hasMoviePage(r.source, r.mediaType) ? openMovie : undefined,
  });

  function clearTarget() {
    navigate({ search: (s) => ({ ...s, list: undefined }), replace: true });
  }

  const query = useQuery({
    queryKey: ["search", q, filter],
    queryFn: () => search({ data: { q, filter } }),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  // Keep the URL in sync so a search can be shared or survives reloads.
  function setFilter(f: SearchFilter) {
    navigate({ search: (s) => ({ ...s, f: f === "all" ? undefined : f }), replace: true });
  }
  const setQ = setText;
  useEffect(() => {
    if ((params.q ?? "") !== q) navigate({ search: (s) => ({ ...s, q: q || undefined }), replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const data = query.data;
  const total = data ? data.people.length + data.movie.length + data.music.length + data.art.length : 0;
  const sections: MediaType[] = filter === "all" ? ["movie", "music", "art"] : [filter];
  const typing = text.trim() !== q;

  return (
    <div>
      {/* Sticky search header */}
      <header className="sticky top-0 z-30 bg-background px-4 pb-3 pt-[max(env(safe-area-inset-top),2rem)]">
        {targetList ? (
          <div className="mb-3 flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Volver a la lista">
              <Link to="/lists/$listId" params={{ listId: targetList.id }}>
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Agregando a</p>
              <h1 className="truncate font-display text-3xl leading-tight">{targetList.name}</h1>
            </div>
            <Button variant="glass" size="sm" onClick={clearTarget}>
              Otra lista
            </Button>
          </div>
        ) : (
          <h1 className="mb-3 font-display text-4xl">Buscar</h1>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={text}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Título, autor, año…"
            aria-label="Buscar películas, música y arte"
            className="h-12 w-full rounded-sm border border-input bg-transparent pl-12 pr-12 text-base outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          {(query.isFetching || typing) && q.length >= 2 ? (
            <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-primary" />
          ) : (
            text && (
              <Button variant="ghost" size="icon"
                type="button"
                aria-label="Borrar búsqueda"
                onClick={() => setQ("")}
                className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground"
              >
                <X className="size-5" />
              </Button>
            )
          )}
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none" role="tablist">
          {CHIPS.map((c) => (
            <Button variant="ghost"
              key={c.id}
              type="button"
              role="tab"
              aria-selected={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "h-11 shrink-0 rounded-none border-b px-4 text-sm font-medium transition-colors",
                filter === c.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-2">
        {q.length < 2 ? (
          <div className="pt-6 animate-rise">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Probá con</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button variant="ghost"
                  key={s}
                  type="button"
                  onClick={() => setQ(s)}
                  className="h-11 rounded-sm px-3 font-display text-lg font-normal text-muted-foreground"
                >
                  {s}
                </Button>
              ))}
            </div>
            <p className="mt-8 max-w-sm text-sm text-muted-foreground">
              Escribí un título, un director, una banda o un pintor. Sumá un año para afinar: «Kubrick 1968».
            </p>
          </div>
        ) : query.isError ? (
          <ErrorState message="El buscador no respondió." onRetry={() => query.refetch()} />
        ) : !data ? (
          <PosterGridSkeleton />
        ) : total === 0 ? (
          <EmptyState icon={<SearchX />} title="Sin resultados">
            No encontramos nada para «{q}». Probá con otra palabra o quitá el año.
          </EmptyState>
        ) : (
          <div className={cn("space-y-8 transition-opacity", query.isFetching && "opacity-60")}>
            {data.warnings.map((w) => (
              <p key={w} className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
                {w}
              </p>
            ))}
            {data.people.length > 0 && (filter === "all" || filter === "movie") && (
              <section>
                <h2 className="mb-3 font-display text-2xl">Personas</h2>
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
                  {data.people.map((p) => (
                    <PersonChip key={p.id} person={p} listId={params.list} />
                  ))}
                </div>
              </section>
            )}
            {sections.map((m) => {
              const items = data[m];
              if (!items.length) return null;
              // "Todo" → horizontal carousels; filtered → full grid.
              return filter === "all" ? (
                <section key={m}>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="font-display text-2xl">{MEDIA_LABEL[m]}</h2>
                    <button
                      type="button"
                      onClick={() => setFilter(m)}
                      className="min-h-11 px-1 text-sm font-semibold text-primary"
                    >
                      Ver todo
                    </button>
                  </div>
                  <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
                    {items.slice(0, 12).map((r) => (
                      <ResultCard
                        key={resultKey(r)}
                        {...cardProps(r)}
                        className={cn("shrink-0 snap-start", m === "movie" ? "w-32" : "w-40")}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <section key={m} className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
                  {items.map((r) => (
                    <ResultCard key={resultKey(r)} {...cardProps(r)} />
                  ))}
                </section>
              );
            })}
            {(filter === "all" || filter === "movie") && data.movieProvider === "basic" && (
              <p className="pb-4 text-center text-[11px] text-muted-foreground">
                Películas en modo básico. Con una clave de TMDB los resultados son mucho más completos.
              </p>
            )}
          </div>
        )}
      </div>

      {adder.sheet}
    </div>
  );
}

/** Round photo + name; opens the person's full filmography. */
function PersonChip({ person, listId }: { person: PersonResult; listId: string | undefined }) {
  return (
    <Link
      to="/person/$personId"
      params={{ personId: String(person.id) }}
      search={{ list: listId }}
      className="flex w-28 shrink-0 flex-col items-center text-center animate-rise active:scale-[0.97] transition-transform"
    >
      <div className="size-24 overflow-hidden rounded-full border border-border bg-secondary">
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={person.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-3xl text-muted-foreground">
            {person.name.charAt(0)}
          </span>
        )}
      </div>
      <span className="mt-2 line-clamp-2 text-sm font-semibold leading-tight">{person.name}</span>
      <span className="text-[11px] uppercase tracking-wider text-primary">{departmentLabel(person.department)}</span>
    </Link>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, SearchX, X } from "lucide-react";
import { z } from "zod";
import { AddToListDrawer } from "@/components/AddToListDrawer";
import { ResultCard } from "@/components/ResultCard";
import { EmptyState, ErrorState, PosterGridSkeleton } from "@/components/States";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MEDIA_LABEL, type MediaType, type SearchFilter, type SearchResult } from "@/lib/media";
import { searchMedia } from "@/lib/search.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: z.object({ q: z.string().optional(), f: z.enum(["all", "movie", "music", "art"]).optional() }),
  head: () => ({
    meta: [
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
  const [adding, setAdding] = useState<SearchResult | null>(null);
  const search = useServerFn(searchMedia);

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
  function setQ(v: string) {
    setText(v);
    navigate({ search: (s) => ({ ...s, q: v || undefined }), replace: true });
  }

  const data = query.data;
  const total = data ? data.movie.length + data.music.length + data.art.length : 0;
  const sections: MediaType[] = filter === "all" ? ["movie", "music", "art"] : [filter];
  const typing = text.trim() !== q;

  return (
    <div>
      {/* Sticky search header */}
      <header className="sticky top-0 z-30 bg-background/85 px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-xl">
        <h1 className="mb-3 font-display text-4xl">Buscar</h1>
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
            className="h-12 w-full rounded-full border border-input bg-secondary pl-12 pr-12 text-base outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          {(query.isFetching || typing) && q.length >= 2 ? (
            <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-primary" />
          ) : (
            text && (
              <button
                type="button"
                aria-label="Borrar búsqueda"
                onClick={() => setQ("")}
                className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            )
          )}
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none" role="tablist">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "h-11 shrink-0 rounded-full border px-5 text-sm font-semibold transition-all duration-200 ease-cine",
                filter === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-muted-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-2">
        {q.length < 2 ? (
          <div className="pt-6 animate-rise">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Probá con</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQ(s)}
                  className="h-11 rounded-full border border-border bg-secondary/60 px-4 font-display text-lg italic text-foreground"
                >
                  {s}
                </button>
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
                        key={`${r.source}:${r.externalId}`}
                        result={r}
                        onAdd={setAdding}
                        className={cn("shrink-0 snap-start", m === "movie" ? "w-32" : "w-40")}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <section key={m} className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
                  {items.map((r) => (
                    <ResultCard key={`${r.source}:${r.externalId}`} result={r} onAdd={setAdding} />
                  ))}
                </section>
              );
            })}
            {(filter === "all" || filter === "movie") && data.movieProvider === "itunes" && (
              <p className="pb-4 text-center text-[11px] text-muted-foreground">
                Películas desde iTunes. Con una clave de TMDB los resultados son más completos.
              </p>
            )}
          </div>
        )}
      </div>

      <AddToListDrawer result={adding} onOpenChange={(o) => !o && setAdding(null)} />
    </div>
  );
}

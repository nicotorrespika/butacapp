import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BackButton } from "@/components/BackButton";
import { FetchProblem } from "@/components/FetchProblem";
import { useCardProps } from "@/components/MediaRow";
import { ResultCard } from "@/components/ResultCard";
import { PosterGridSkeleton, Skeleton } from "@/components/States";
import { resultKey, useAddToList } from "@/hooks/use-add-to-list";
import { departmentLabel } from "@/lib/media";
import { getPerson } from "@/lib/movies.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/person/$personId")({
  validateSearch: z.object({ list: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Filmografía — Butaca" },
      { name: "description", content: "Filmografía completa de directores y actores, lista para sumar a tus listas." },
      { property: "og:title", content: "Filmografía — Butaca" },
      { property: "og:description", content: "Todas sus películas y series en un solo lugar." },
    ],
  }),
  component: PersonPage,
});

type Tab = "directed" | "acted" | "other";
const TAB_LABEL: Record<Tab, string> = { directed: "Dirección", acted: "Actuación", other: "Guion y más" };

function PersonPage() {
  const { personId } = Route.useParams();
  const { list } = Route.useSearch();
  const fetchPerson = useServerFn(getPerson);
  const id = Number(personId);
  const q = useQuery({
    queryKey: ["person", id],
    queryFn: () => fetchPerson({ data: { id } }),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30 * 60_000,
  });
  const adder = useAddToList(list);
  const cardProps = useCardProps(adder, list);
  const [tab, setTab] = useState<Tab | null>(null);
  const [bioOpen, setBioOpen] = useState(false);

  if (!Number.isInteger(id) || id <= 0) return <FetchProblem reason="not_found" onRetry={() => undefined} />;
  if (q.isLoading)
    return (
      <div className="px-4 pt-4">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="mx-auto mt-6 size-32 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-9 w-2/3" />
        <div className="mt-8">
          <PosterGridSkeleton />
        </div>
      </div>
    );
  if (q.isError || !q.data) return <FetchProblem reason="provider" onRetry={() => q.refetch()} />;
  if (!q.data.ok) return <FetchProblem reason={q.data.reason} onRetry={() => q.refetch()} />;

  const p = q.data.data;
  const tabs = (["directed", "acted", "other"] as const).filter((t) => p[t].length > 0);
  // Default tab follows what they're known for (a director opens on "Dirección").
  const preferred: Tab = p.department === "Acting" ? "acted" : "directed";
  const current: Tab = tab ?? (tabs.includes(preferred) ? preferred : (tabs[0] ?? "directed"));
  const works = p[current];
  const life = [
    p.birthday ? new Date(p.birthday).getFullYear() : null,
    p.deathday ? new Date(p.deathday).getFullYear() : null,
  ];

  return (
    <div className="pb-6">
      <header className="px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <BackButton />
        <div className="mt-2 flex flex-col items-center text-center animate-rise">
          <div className="size-32 overflow-hidden rounded-full border-2 border-primary/40 bg-secondary shadow-glow">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-display text-5xl text-muted-foreground">
                {p.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
            {departmentLabel(p.department)}
          </p>
          <h1 className="mt-1 font-display text-5xl leading-[0.95]">{p.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {[life[0] && (life[1] ? `${life[0]}–${life[1]}` : `n. ${life[0]}`), p.placeOfBirth].filter(Boolean).join(" · ")}
          </p>
        </div>
        {p.biography && (
          <button
            type="button"
            onClick={() => setBioOpen((o) => !o)}
            className="mt-4 block w-full text-left text-sm leading-relaxed text-foreground/85"
            aria-expanded={bioOpen}
          >
            <span className={cn(!bioOpen && "line-clamp-3")}>{p.biography}</span>
            <span className="mt-1 block text-xs font-semibold text-primary">{bioOpen ? "Ver menos" : "Leer más"}</span>
          </button>
        )}
      </header>

      {/* Filmography tabs */}
      <div className="sticky top-0 z-20 mt-5 bg-background/85 px-4 py-2 backdrop-blur-xl">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={current === t}
              onClick={() => setTab(t)}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
                current === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              {TAB_LABEL[t]} <span className="opacity-70">{p[t].length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3">
        {works.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No hay títulos para mostrar.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
            {works.map((r) => (
              <li key={resultKey(r)}>
                <ResultCard {...cardProps(r)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {adder.sheet}
    </div>
  );
}

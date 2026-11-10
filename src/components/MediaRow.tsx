import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ResultCard } from "@/components/ResultCard";
import { resultKey, type useAddToList } from "@/hooks/use-add-to-list";
import { hasMoviePage, movieRouteId, type SearchResult } from "@/lib/media";
import { cn } from "@/lib/utils";

type Adder = ReturnType<typeof useAddToList>;

/** Props for a ResultCard that opens movie pages and adds via the shared adder. */
export function useCardProps(adder: Adder, listId: string | undefined) {
  const navigate = useNavigate();
  return (r: SearchResult) => ({
    result: r,
    onAdd: adder.add,
    added: adder.isAdded(r),
    busy: adder.isBusy(r),
    targetName: adder.targetList?.name,
    onOpen: hasMoviePage(r.source, r.mediaType)
      ? (x: SearchResult) =>
          void navigate({
            to: "/movie/$movieId",
            params: { movieId: movieRouteId(x.externalId) },
            search: { list: listId },
          })
      : undefined,
  });
}

/** Titled horizontal carousel of posters. */
export function MediaRow({
  title,
  action,
  items,
  cardProps,
}: {
  title: string;
  action?: ReactNode;
  items: SearchResult[];
  cardProps: ReturnType<typeof useCardProps>;
}) {
  if (!items.length) return null;
  return (
    <section className="animate-rise">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-4">
        <h2 className="font-display text-2xl leading-tight">{title}</h2>
        {action}
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
        {items.map((r) => (
          <ResultCard key={resultKey(r)} {...cardProps(r)} className={cn("w-32 shrink-0 snap-start")} />
        ))}
      </div>
    </section>
  );
}

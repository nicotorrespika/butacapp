import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateListDrawer } from "@/components/CreateListDrawer";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";
import { LIST_KIND_LABEL } from "@/lib/media";
import { myListsQuery, type ListSummary } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/lists/")({
  head: () => ({
    meta: [
      { title: "Mis listas — Butaca" },
      { name: "description", content: "Tus listas compartidas de películas, música y arte." },
      { property: "og:title", content: "Mis listas — Butaca" },
      { property: "og:description", content: "Tus listas compartidas de películas, música y arte." },
    ],
  }),
  component: MyLists,
});

function MyLists() {
  const lists = useQuery(myListsQuery);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex items-end justify-between gap-3 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Cartelera</p>
          <h1 className="font-display text-4xl">Mis listas</h1>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus /> Nueva
        </Button>
      </header>

      {lists.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : lists.isError ? (
        <ErrorState onRetry={() => lists.refetch()} />
      ) : !lists.data?.length ? (
        <EmptyState
          icon={<Library />}
          title="Todavía no hay funciones"
          action={
            <Button size="lg" onClick={() => setCreating(true)}>
              <Plus /> Crear mi primera lista
            </Button>
          }
        >
          Creá una lista, invitá a tu gente y empiecen a sumar lo que quieren ver, escuchar o visitar.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.data.map((l, i) => (
            <li key={l.id} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <ListCard list={l} />
            </li>
          ))}
        </ul>
      )}

      <CreateListDrawer
        open={creating}
        onOpenChange={setCreating}
        onCreated={(l) => {
          setCreating(false);
          navigate({ to: "/lists/$listId", params: { listId: l.id } });
        }}
      />
    </div>
  );
}

/** List card with a fanned collage of the latest covers. */
function ListCard({ list }: { list: ListSummary }) {
  return (
    <Link
      to="/lists/$listId"
      params={{ listId: list.id }}
      className="group relative block h-44 overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 ease-cine active:scale-[0.98]"
    >
      {/* Cover collage */}
      <div className="absolute inset-y-0 right-0 flex w-3/5 items-center justify-end pr-3">
        {list.covers.length === 0 ? (
          <div className="mr-4 flex h-28 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            <Library className="size-6 opacity-50" />
          </div>
        ) : (
          list.covers.slice(0, 3).map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              loading="lazy"
              className={cn(
                "h-32 w-[5.5rem] rounded-lg object-cover shadow-poster ring-1 ring-border",
                i > 0 && "-ml-12",
              )}
              style={{ transform: `rotate(${(i - 1) * 6}deg) translateY(${i === 1 ? -4 : 6}px)`, zIndex: 3 - i }}
            />
          ))
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent" />
      <div className="relative flex h-full max-w-[62%] flex-col p-4">
        <span className="w-fit rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          {LIST_KIND_LABEL[list.kind]}
        </span>
        <h2 className="mt-2 line-clamp-2 font-display text-2xl leading-tight">{list.name}</h2>
        {list.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{list.description}</p>}
        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>{list.itemCount} ítems</span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {list.memberCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

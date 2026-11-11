import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateListDrawer } from "@/components/CreateListDrawer";
import { EmptyState, ErrorState, Skeleton } from "@/components/States";
import { LIST_KIND_LABEL } from "@/lib/media";
import { myListsQuery, type ListSummary } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/lists/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Mis listas — BUTACAPP" },
      { name: "description", content: "Tus listas compartidas de películas, música y libros." },
      { property: "og:title", content: "Mis listas — BUTACAPP" },
      { property: "og:description", content: "Tus listas compartidas de películas, música y libros." },
    ],
  }),
  component: MyLists,
});

function MyLists() {
  const lists = useQuery(myListsQuery);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),2rem)] sm:px-8 sm:pt-12">
      <header className="mb-8 flex items-end justify-between gap-3 pb-4">
        <div>
          <p className="mb-3 text-[11px] font-medium text-muted-foreground">TU COLECCIÓN</p>
          <h1 className="font-display text-4xl leading-tight">Mis listas</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus /> Nueva
        </Button>
      </header>

      {lists.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-sm" />
          ))}
        </div>
      ) : lists.isError ? (
        <ErrorState onRetry={() => lists.refetch()} />
      ) : !lists.data?.length ? (
        <EmptyState
          icon={<Library />}
          title="Nada guardado todavía"
          action={
            <Button size="lg" onClick={() => setCreating(true)}>
              <Plus /> Crear mi primera lista
            </Button>
          }
        >
          Una lista. Algo por descubrir.
        </EmptyState>
      ) : (
        <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {lists.data.map((l) => (
            <li key={l.id}>
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

/** Unframed list entry: covers and text never overlap. */
function ListCard({ list }: { list: ListSummary }) {
  return (
    <Link
      to="/lists/$listId"
      params={{ listId: list.id }}
      className="group block min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-44 gap-1 overflow-hidden rounded-sm bg-card sm:h-48">
        {list.covers.length === 0 ? (
          <div className="flex w-full items-center justify-center text-muted-foreground">
            <Library strokeWidth={1} className="size-8 opacity-50" />
          </div>
        ) : (
          list.covers.slice(0, 3).map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              loading="lazy"
              className="h-full min-w-0 flex-1 basis-0 object-cover"
            />
          ))
        )}
      </div>
      <div className="pt-4">
        <span className="text-[10px] font-medium text-muted-foreground">
          {LIST_KIND_LABEL[list.kind]}
        </span>
        <h2 className="mt-1 line-clamp-2 break-words font-display text-2xl leading-tight transition-colors group-hover:text-primary">{list.name}</h2>
        {list.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{list.description}</p>}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{list.itemCount} ítems</span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {list.memberCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

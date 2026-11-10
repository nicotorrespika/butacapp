import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, MessageCircle, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InviteDrawer } from "@/components/InviteDrawer";
import { ItemDrawer } from "@/components/ItemDrawer";
import { Poster } from "@/components/Poster";
import { EmptyState, ErrorState, PosterGridSkeleton, Skeleton } from "@/components/States";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { DONE_LABEL, LIST_KIND_LABEL, type MediaType } from "@/lib/media";
import { averageScore } from "@/lib/ratings";
import {
  commentsQuery,
  itemsQuery,
  keys,
  listQuery,
  ratingsQuery,
  useListRealtime,
  type ItemRow,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/lists/$listId")({
  head: () => ({
    meta: [
      { title: "Lista — Butaca" },
      { name: "description", content: "Lista compartida: marcá, puntuá y comentá en grupo." },
      { property: "og:title", content: "Lista compartida — Butaca" },
      { property: "og:description", content: "Marcá, puntuá y comentá en grupo." },
    ],
  }),
  component: ListPage,
});

type StatusFilter = "all" | "todo" | "done";
type SortKey = "recent" | "rating" | "title";

function ListPage() {
  const { listId } = Route.useParams();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detail = useQuery(listQuery(listId));
  const items = useQuery(itemsQuery(listId));
  const ratings = useQuery(ratingsQuery(listId));
  const comments = useQuery(commentsQuery(listId));
  useListRealtime(listId);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [adder, setAdder] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  // Per-item aggregates: average score and comment count.
  const stats = useMemo(() => {
    const m: Record<string, { avg: number | null; votes: number; comments: number }> = {};
    for (const i of items.data ?? []) {
      const rs = (ratings.data ?? []).filter((r) => r.item_id === i.id);
      m[i.id] = {
        avg: averageScore(rs.map((r) => r.score)),
        votes: rs.length,
        comments: (comments.data ?? []).filter((c) => c.item_id === i.id).length,
      };
    }
    return m;
  }, [items.data, ratings.data, comments.data]);

  const visible = useMemo(() => {
    let list = [...(items.data ?? [])];
    if (status !== "all") list = list.filter((i) => (status === "done" ? i.done : !i.done));
    if (adder !== "all") list = list.filter((i) => i.added_by === adder);
    if (sort === "rating") list.sort((a, b) => (stats[b.id]?.avg ?? -1) - (stats[a.id]?.avg ?? -1));
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title, "es"));
    return list;
  }, [items.data, status, adder, sort, stats]);

  if (detail.isError) {
    return detail.error.message === "NOT_FOUND" ? (
      <EmptyState
        icon={<Search />}
        title="Lista no encontrada"
        action={
          <Button asChild variant="outline">
            <Link to="/lists">Volver a mis listas</Link>
          </Button>
        }
      >
        Puede que la hayan borrado o que ya no seas parte.
      </EmptyState>
    ) : (
      <ErrorState onRetry={() => detail.refetch()} />
    );
  }

  const d = detail.data;
  const isOwner = d?.list.owner_id === userId;
  const openItem = (items.data ?? []).find((i) => i.id === openId) ?? null;
  const doneCount = (items.data ?? []).filter((i) => i.done).length;
  const total = items.data?.length ?? 0;
  const heroCover = items.data?.find((i) => i.image_url)?.image_url;

  async function deleteList() {
    if (!d || !confirm(`¿Borrar «${d.list.name}» para todos? No se puede deshacer.`)) return;
    const { error } = await supabase.from("lists").delete().eq("id", d.list.id);
    if (error) return void toast.error("No se pudo borrar", { description: error.message });
    qc.invalidateQueries({ queryKey: keys.myLists });
    navigate({ to: "/lists", replace: true });
  }

  async function leaveList() {
    if (!d || !confirm(`¿Salir de «${d.list.name}»?`)) return;
    const { error } = await supabase.from("list_members").delete().eq("list_id", d.list.id).eq("user_id", userId);
    if (error) return void toast.error("No se pudo salir", { description: error.message });
    qc.invalidateQueries({ queryKey: keys.myLists });
    navigate({ to: "/lists", replace: true });
  }

  return (
    <div>
      {/* Hero with blurred backdrop of the latest cover */}
      <header className="relative overflow-hidden px-4 pb-5 pt-[max(env(safe-area-inset-top),0.75rem)]">
        {heroCover && (
          <img
            src={heroCover}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="icon" aria-label="Volver">
              <Link to="/lists">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            {d && (
              <Button variant="glass" size="sm" onClick={() => setInviting(true)}>
                <UserPlus /> Invitar
              </Button>
            )}
          </div>

          {!d ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : (
            <div className="mt-3 animate-rise">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                {LIST_KIND_LABEL[d.list.kind]}
              </span>
              <h1 className="mt-1 font-display text-5xl leading-[0.95]">{d.list.name}</h1>
              {d.list.description && <p className="mt-2 text-sm text-muted-foreground">{d.list.description}</p>}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setInviting(true)}
                  className="flex min-h-11 items-center -space-x-2"
                  aria-label="Ver miembros"
                >
                  {d.members.slice(0, 5).map((m) => (
                    <UserAvatar key={m.user_id} name={m.profile?.display_name} url={m.profile?.avatar_url} />
                  ))}
                </button>
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{total} {total ? "completados" : ""}
                </span>
              </div>
              {total > 0 && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-amber transition-all duration-700 ease-cine"
                    style={{ width: `${(doneCount / total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Filters + sort */}
      <div className="sticky top-0 z-20 space-y-2 bg-background/85 px-4 py-2 backdrop-blur-xl">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
          {(
            [
              ["all", "Todos"],
              ["todo", "Pendientes"],
              ["done", "Completados"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatus(id)}
              aria-pressed={status === id}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
                status === id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Ordenar"
            className="h-11 shrink-0 rounded-full border border-border bg-secondary px-4 text-sm font-semibold text-foreground outline-none"
          >
            <option value="recent">Recientes</option>
            <option value="rating">Mejor nota</option>
            <option value="title">A–Z</option>
          </select>
          {d && d.members.length > 1 && (
            <select
              value={adder}
              onChange={(e) => setAdder(e.target.value)}
              aria-label="Agregado por"
              className="h-11 shrink-0 rounded-full border border-border bg-secondary px-4 text-sm font-semibold text-foreground outline-none"
            >
              <option value="all">De todos</option>
              {d.members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  De {m.profile?.display_name || "alguien"}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Items grid */}
      <div className="px-4 pt-3">
        {items.isLoading ? (
          <PosterGridSkeleton />
        ) : items.isError ? (
          <ErrorState onRetry={() => items.refetch()} />
        ) : total === 0 ? (
          <EmptyState
            icon={<Search />}
            title="La sala está vacía"
            action={
              <Button asChild size="lg">
                <Link to="/search">
                  <Search /> Buscar algo para sumar
                </Link>
              </Button>
            }
          >
            Buscá una película, un disco o una obra y tocá «+» para agregarla acá.
          </EmptyState>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nada con estos filtros.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((i) => (
              <li key={i.id} className="animate-rise">
                <ItemTile
                  item={i}
                  stat={stats[i.id]}
                  adderName={d?.profiles[i.added_by]?.display_name}
                  onOpen={() => setOpenId(i.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {d && (
          <div className="mt-12 flex justify-center">
            {isOwner ? (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={deleteList}>
                <Trash2 /> Borrar lista
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={leaveList}>
                Salir de la lista
              </Button>
            )}
          </div>
        )}
      </div>

      {d && (
        <>
          <ItemDrawer
            item={openItem}
            onOpenChange={(o) => !o && setOpenId(null)}
            ratings={ratings.data ?? []}
            comments={comments.data ?? []}
            profiles={d.profiles}
            userId={userId}
            isOwner={isOwner}
          />
          <InviteDrawer open={inviting} onOpenChange={setInviting} detail={d} userId={userId} />
        </>
      )}
    </div>
  );
}

function ItemTile({
  item,
  stat,
  adderName,
  onOpen,
}: {
  item: ItemRow;
  stat?: { avg: number | null; votes: number; comments: number } | undefined;
  adderName?: string | undefined;
  onOpen: () => void;
}) {
  const media = item.media_type as MediaType;
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left active:scale-[0.98] transition-transform">
      <div className="relative">
        <Poster
          src={item.image_url}
          alt={item.title}
          media={media}
          aspect="aspect-[2/3]"
          className={cn(item.done && "opacity-55 saturate-50")}
        />
        {item.done && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-success px-2 py-1 text-[10px] font-bold uppercase text-background">
            <Check className="size-3" strokeWidth={3} /> {DONE_LABEL[media].done}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-lg bg-poster-fade px-2 pb-2 pt-6 text-xs">
          <span className="font-semibold text-primary">{stat?.avg ? `★ ${stat.avg}` : ""}</span>
          {!!stat?.comments && (
            <span className="flex items-center gap-1 text-foreground">
              <MessageCircle className="size-3.5" /> {stat.comments}
            </span>
          )}
        </div>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{item.title}</h3>
      <p className="truncate text-xs text-muted-foreground">
        {[item.creator, item.year].filter(Boolean).join(" · ")}
      </p>
      {adderName && <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">por {adderName}</p>}
    </button>
  );
}

import {ShareButton} from "@/components/ShareButton";
import {useScreenState} from "@/hooks/use-screen-state";
import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Layers, LayoutGrid, List as ListIcon, ListChecks, Loader2, Plus, Rows3, Search, Sparkles, Trash2, UserPlus } from "lucide-react";
import { BulkAddDrawer } from "@/components/BulkAddDrawer";
import { ListItemsView, type ListView } from "@/components/ListItemsView";
import { nextPendingId, sortItems, type ListSort } from "@/lib/bulk-import";
import { bettyOrder } from "@/lib/bulk-import.functions";
import { useEffect } from "react";
import { filterForListKind } from "@/lib/add-item";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/AppDialog";
import { InviteDrawer } from "@/components/InviteDrawer";
import { ItemDrawer } from "@/components/ItemDrawer";
import { SocialComments } from "@/components/SocialComments";
import { CultureBetty } from "@/components/CultureBetty";
import { ListPicks } from "@/components/ListPicks";
import { ListRecommendations } from "@/components/ListRecommendations";
import { EmptyState, ErrorState, PosterGridSkeleton, Skeleton } from "@/components/States";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { LIST_KIND_LABEL } from "@/lib/media";
import { averageScore, ratingScore } from "@/lib/ratings";
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
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/lists/$listId")({staticData:{sitemap:false},
  validateSearch:z.object({item:z.string().optional()}),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Lista — MOMENTO BUTACA" },
      { name: "description", content: "Lista compartida: marcá, puntuá y comentá en grupo." },
      { property: "og:title", content: "Lista compartida — MOMENTO BUTACA" },
      { property: "og:description", content: "Marcá, puntuá y comentá en grupo." },
    ],
  }),
  component: ListPage,
});

type StatusFilter = "all" | "todo" | "done";

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

  const [status, setStatus] = useScreenState<StatusFilter>(`list:${listId}:status`,"all");
  const [sort, setSort] = useScreenState<ListSort>(`list:${listId}:sort2`,"custom");
  const [view, setViewState] = useState<ListView>("list");
  const [hideDone, setHideDone] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bettyOpen, setBettyOpen] = useState(false);
  const [criterion, setCriterion] = useState("");
  const [bettyBusy, setBettyBusy] = useState(false);
  const [proposal, setProposal] = useState<{ order: string[]; explanation: string } | null>(null);
  const [recsOpen, setRecsOpen] = useState(false);
  useEffect(() => { if (!userId) return; const v = localStorage.getItem(`butaca:listview:${userId}`); if (v === "list" || v === "grid" || v === "posters") setViewState(v); }, [userId]);
  const setView = (v: ListView) => { setViewState(v); if (userId) localStorage.setItem(`butaca:listview:${userId}`, v); };
  const [adder, setAdder] = useScreenState<string>(`list:${listId}:adder`,"all");
  const {item:openId}=Route.useSearch();
  const setOpenId=(item:string|null)=>navigate({to:"/lists/$listId",params:{listId},search:{item:item ?? undefined},replace:true});
  const [inviting, setInviting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Per-item aggregates: average score and comment count.
  const stats = useMemo(() => {
    const m: Record<string, { avg: number | null; votes: number; comments: number }> = {};
    for (const i of items.data ?? []) {
      const rs = (ratings.data ?? []).filter((r) => r.item_id === i.id);
      m[i.id] = {
        avg: averageScore(rs.map(ratingScore)),
        votes: rs.length,
        comments: (comments.data ?? []).filter((c) => c.item_id === i.id).length,
      };
    }
    return m;
  }, [items.data, ratings.data, comments.data]);

  const visible = useMemo(() => {
    let list = [...(items.data ?? [])];
    if (status !== "all") list = list.filter((i) => (status === "done" ? i.done : !i.done));
    if (hideDone) list = list.filter((i) => !i.done);
    if (adder !== "all") list = list.filter((i) => i.added_by === adder);
    return sortItems(list, sort, (id) => stats[id]?.avg ?? null);
  }, [items.data, status, adder, sort, stats, hideDone]);
  const myScore = (id: string) => { const r = (ratings.data ?? []).find((x) => x.item_id === id && x.user_id === userId); return r ? ratingScore(r) : null; };

  async function saveOrder(ids: string[]) {
    qc.setQueryData<ItemRow[]>(keys.items(listId), (old) => old?.map((i) => ({ ...i, position: ids.indexOf(i.id) + 1 || i.position })));
    const res = await Promise.all(ids.map((id, n) => supabase.from("list_items").update({ position: n + 1 }).eq("id", id)));
    if (res.some((r) => r.error)) toast.error("No se pudo guardar el orden");
  }
  async function toggleDone(item: ItemRow) {
    const next = !item.done;
    qc.setQueryData<ItemRow[]>(keys.items(listId), (old) => old?.map((i) => (i.id === item.id ? { ...i, done: next } : i)));
    const { error } = await supabase.from("list_items").update({ done: next, done_by: next ? userId : null, done_at: next ? new Date().toISOString() : null }).eq("id", item.id);
    if (error) { toast.error("No se pudo marcar"); qc.invalidateQueries({ queryKey: keys.items(listId) }); }
  }
  async function removeSelected() {
    const ids = [...selected];
    const { error } = await supabase.from("list_items").delete().in("id", ids);
    if (error) return void toast.error("No se pudieron quitar", { description: error.message });
    toast(`Quitaste ${ids.length} ${ids.length === 1 ? "obra" : "obras"}`);
    setSelected(new Set()); setSelecting(false);
    qc.invalidateQueries({ queryKey: keys.items(listId) });
  }
  async function askBettyOrder() {
    setBettyBusy(true); setProposal(null);
    try { setProposal(await bettyOrder({ data: { listId, criterion } })); }
    catch { toast.error("Bettiada: no pude ordenarlas. Probá de nuevo."); }
    setBettyBusy(false);
  }

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
  const isMember = d?.members.some(m=>m.user_id===userId) ?? false;
  const openItem = (items.data ?? []).find((i) => i.id === openId) ?? null;
  const doneCount = (items.data ?? []).filter((i) => i.done).length;
  const total = items.data?.length ?? 0;
  // Opens search pointed at this list, pre-filtered to its type.
  const searchToAdd = d
    ? { list: d.list.id, f: filterForListKind(d.list.kind) === "all" ? undefined : filterForListKind(d.list.kind) }
    : {};

  async function deleteList() {
    if (!d) return;
    const { error } = await supabase.from("lists").delete().eq("id", d.list.id);
    if (error) return void toast.error("No se pudo borrar", { description: error.message });
    qc.invalidateQueries({ queryKey: keys.myLists });
    navigate({ to: "/lists", replace: true });
  }

  async function leaveList() {
    if (!d) return;
    const { error } = await supabase.from("list_members").delete().eq("list_id", d.list.id).eq("user_id", userId);
    if (error) return void toast.error("No se pudo salir", { description: error.message });
    qc.invalidateQueries({ queryKey: keys.myLists });
    navigate({ to: "/lists", replace: true });
  }

  return (
    <div>
      <header className="relative px-4 pb-5 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="relative">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" aria-label="Volver">
              <Link to="/lists">
                <ArrowLeft className="size-5" />
                Atrás
              </Link>
            </Button>
            {d && isMember && (
              <div className="flex items-center gap-2">
                <Button variant="glass" size="sm" onClick={() => setInviting(true)} aria-label="Invitar">
                  <UserPlus /> <span className="hidden sm:inline">Invitar</span>
                </Button>
                <Button variant="glass" size="sm" onClick={() => setBulkOpen(true)}>
                  <Layers /> <span className="hidden sm:inline">Agregar</span> Varias
                </Button>
                <Button asChild size="sm">
                  <Link to="/search" search={searchToAdd}>
                    <Plus /> Agregar
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {!d ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : (
            <div className="mt-3 animate-rise">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {LIST_KIND_LABEL[d.list.kind]}
              </span>
              <h1 title={d.list.name} className="mt-3 truncate font-heading text-4xl font-semibold not-italic leading-tight">{d.list.name}</h1>
              <ShareButton content={{kind:"list",id:listId,title:d.list.name,description:d.list.description,image:items.data?.[0]?.image_url,private:d.list.visibility!=="public",ownerId:d.list.owner_id,category:"Lista"}}/>
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
                  {total} {total === 1 ? "obra" : "obras"} · {doneCount} {d.list.kind === "books" ? "leídas" : d.list.kind === "music" ? "escuchadas" : "vistas"}
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
      <div className="sticky top-0 z-20 mt-6 space-y-2 bg-background px-4 py-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
          {(
            [
              ["all", "Todos"],
              ["todo", "Pendientes"],
              ["done", "Completados"],
            ] as const
          ).map(([id, label]) => (
            <Button variant="ghost"
              key={id}
              type="button"
              onClick={() => setStatus(id)}
              aria-pressed={status === id}
              className={cn(
                "h-11 shrink-0 rounded-none border-b px-4 text-sm font-medium transition-colors",
                status === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
              )}
            >
              {label}
            </Button>
          ))}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as ListSort); setEditing(false); }}
            aria-label="Ordenar por"
            className="h-11 shrink-0 rounded-sm border border-input bg-card px-3 text-sm font-medium text-muted-foreground outline-none"
          >
            <option value="custom">Mi orden</option>
            <option value="year">Año de estreno</option>
            <option value="title">A–Z</option>
            <option value="rating">Nota</option>
            <option value="added">Fecha de agregado</option>
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

      <div className="flex flex-wrap items-center gap-1 px-4 pt-1">
        <div role="group" aria-label="Vista" className="flex rounded-sm border border-border">
          {([["list", ListIcon, "Lista"], ["grid", LayoutGrid, "Grilla compacta"], ["posters", Rows3, "Pósters grandes"]] as const).map(([v, Icon, l]) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={l} title={l} className={cn("flex size-11 items-center justify-center", view === v ? "text-primary" : "text-muted-foreground")}><Icon className="size-4" /></button>
          ))}
        </div>
        <label className="ml-1 flex min-h-11 items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="size-4 accent-primary" />Ocultar vistas</label>
        {isMember && total > 0 && (
          <span className="ml-auto flex flex-wrap gap-1">
            {sort === "custom" && <Button size="sm" variant={editing ? "default" : "ghost"} onClick={() => { setEditing((e) => !e); setSelecting(false); }}>{editing ? "Listo" : "Reordenar"}</Button>}
            <Button size="sm" variant="ghost" onClick={() => setBettyOpen(true)}><Sparkles /> Que las ordene Betty</Button>
            <Button size="sm" variant={selecting ? "default" : "ghost"} onClick={() => { setSelecting((x) => !x); setSelected(new Set()); setEditing(false); }}><ListChecks /> {selecting ? "Cancelar" : "Seleccionar"}</Button>
          </span>
        )}
      </div>
      {selecting && selected.size > 0 && (
        <div className="sticky top-14 z-20 mx-4 mt-2 flex items-center justify-between rounded-sm border border-border bg-card px-3 py-2 text-sm">
          <span>{selected.size} seleccionadas</span>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void removeSelected()}><Trash2 /> Quitar seleccionadas</Button>
        </div>
      )}

      {/* Items */}
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
                <Link to="/search" search={searchToAdd}>
                  <Plus /> Agregar a esta lista
                </Link>
              </Button>
            }
          >
            Buscá una película, un disco o una obra y tocá «+» para agregarla acá.
          </EmptyState>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nada con estos filtros.</p>
        ) : (
          <ListItemsView
            items={visible}
            view={view}
            stats={stats}
            myScore={myScore}
            nextId={sort === "custom" ? nextPendingId(visible) : null}
            editing={editing && sort === "custom"}
            selecting={selecting}
            selected={selected}
            onToggleSelect={(id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
            onOpen={(id) => void setOpenId(id)}
            onToggleDone={(i) => void toggleDone(i)}
            onReorder={(ids) => void saveOrder(ids)}
            mixed={d?.list.kind === "mixed"}
          />
        )}

        {d && (
          <section className="mt-10 border-t border-border pt-2">
            <button type="button" onClick={() => setRecsOpen((o) => !o)} aria-expanded={recsOpen} className="flex min-h-12 w-full items-center justify-between text-left">
              <span className="font-display text-xl uppercase">Podrían ir en tu lista…</span>
              <ChevronDown className={cn("size-5 transition-transform", recsOpen && "rotate-180")} />
            </button>
            {recsOpen && (
              <div className="-mx-4">
                {isMember && <ListPicks list={d.list} />}
                {(d.list.kind === "movies" || d.list.kind === "mixed") && <ListRecommendations listId={listId} />}
                {(d.list.kind === "books" || d.list.kind === "music") && <CultureBetty type={d.list.kind === "books" ? "book" : "music"} listId={listId} />}
              </div>
            )}
          </section>
        )}
        {d && (
          <div className="mt-12 flex justify-center">
            {isOwner ? (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> Borrar lista
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirmLeave(true)}>
                Salir de la lista
              </Button>
            )}
          </div>
        )}
      </div>

      {d && (
        <>
          <ItemDrawer
            key={openItem?.id ?? "closed"}
            item={openItem}
            onOpenChange={(o) => !o && setOpenId(null)}
            ratings={ratings.data ?? []}
            comments={comments.data ?? []}
            profiles={d.profiles}
            userId={userId}
            isOwner={isOwner}
          />
          {isMember && <InviteDrawer open={inviting} onOpenChange={setInviting} detail={d} userId={userId} />}
          {isMember && <BulkAddDrawer open={bulkOpen} onOpenChange={setBulkOpen} listId={listId} kind={d.list.kind} userId={userId} existing={items.data ?? []} />}
          <Dialog open={bettyOpen} onOpenChange={(o) => { setBettyOpen(o); if (!o) setProposal(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display uppercase">Que las ordene Betty</DialogTitle>
                <DialogDescription>Decile cómo: «en orden cronológico de la historia», «para ver la saga por primera vez». Es una sugerencia y puede equivocarse.</DialogDescription>
              </DialogHeader>
              <Textarea value={criterion} onChange={(e) => setCriterion(e.target.value)} placeholder="En orden cronológico de la historia" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && criterion.trim().length >= 3) { e.preventDefault(); void askBettyOrder(); } }} />
              <Button disabled={bettyBusy || criterion.trim().length < 3} onClick={() => void askBettyOrder()}>{bettyBusy ? <><Loader2 className="animate-spin" /> Betty está pensando…</> : "Pedir orden"}</Button>
              {proposal && (
                <div className="space-y-3">
                  <p className="text-sm italic text-muted-foreground">{proposal.explanation}</p>
                  <ol className="max-h-60 space-y-1 overflow-y-auto text-sm">
                    {proposal.order.map((id, n) => <li key={id} className="flex gap-2"><span className="w-6 text-right font-mono text-muted-foreground">{n + 1}</span><span className="truncate font-heading italic text-primary">{items.data?.find((i) => i.id === id)?.title}</span></li>)}
                  </ol>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={async () => { await saveOrder(proposal.order); setSort("custom"); setBettyOpen(false); setProposal(null); toast("Orden de Betty aplicado. Si algo no va, tocá «Reordenar»."); }}>Aceptar</Button>
                    <Button variant="outline" className="flex-1" onClick={async () => { await saveOrder(proposal.order); setSort("custom"); setEditing(true); setBettyOpen(false); setProposal(null); }}>Aceptar y corregir</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title={`¿Borrar «${d.list.name}» para todos?`} description="No se puede deshacer." confirmLabel="Borrar lista" destructive onConfirm={deleteList} />
          <ConfirmDialog open={confirmLeave} onOpenChange={setConfirmLeave} title={`¿Salir de «${d.list.name}»?`} confirmLabel="Salir" onConfirm={leaveList} />
          <section className="mt-8 px-4"><h2 className="mb-4 font-display text-2xl">En esta lista</h2><SocialComments listId={listId} canComment={isMember}/></section>
        </>
      )}
    </div>
  );
}

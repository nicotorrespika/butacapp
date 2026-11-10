import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Poster } from "@/components/Poster";
import { CreateListForm } from "@/components/CreateListDrawer";
import { Skeleton } from "@/components/States";
import { useAuth } from "@/hooks/use-auth";
import { LIST_KIND_LABEL, listAccepts, type ListKind, type SearchResult } from "@/lib/media";
import { keys, myListsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Bottom sheet to drop a search result into one of my lists (or a new one). */
export function AddToListDrawer({
  result,
  onOpenChange,
}: {
  result: SearchResult | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lists = useQuery(myListsQuery);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const open = !!result;
  const compatible = (lists.data ?? []).filter((l) => result && listAccepts(l.kind, result.mediaType));

  function close(o: boolean) {
    if (!o) {
      setCreating(false);
      setAddedTo(new Set());
    }
    onOpenChange(o);
  }

  async function add(listId: string, listName: string) {
    if (!result || !user) return;
    setBusyId(listId);
    const { error } = await supabase.from("list_items").insert({
      list_id: listId,
      media_type: result.mediaType,
      source: result.source,
      external_id: result.externalId,
      title: result.title,
      creator: result.creator,
      year: result.year,
      image_url: result.imageUrl,
      kind_label: result.kindLabel,
      external_url: result.externalUrl,
      added_by: user.id,
    });
    setBusyId(null);
    if (error) {
      // 23505 = unique violation → already in that list.
      if (error.code === "23505") {
        setAddedTo((s) => new Set(s).add(listId));
        toast("Ya estaba en esa lista");
      } else toast.error("No se pudo agregar", { description: error.message });
      return;
    }
    setAddedTo((s) => new Set(s).add(listId));
    qc.invalidateQueries({ queryKey: keys.myLists });
    qc.invalidateQueries({ queryKey: keys.items(listId) });
    toast.success(`Agregado a «${listName}»`);
  }

  const defaultKind: ListKind =
    result?.mediaType === "movie" ? "movies" : result?.mediaType === "music" ? "music" : result ? "art" : "mixed";

  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-xl border-border bg-card">
        {result && (
          <>
            <DrawerHeader className="flex items-center gap-4 text-left">
              <Poster src={result.imageUrl} alt={result.title} media={result.mediaType} className="w-14 shrink-0" />
              <div className="min-w-0">
                <DrawerTitle className="line-clamp-2 font-display text-2xl font-normal leading-tight">
                  {result.title}
                </DrawerTitle>
                <DrawerDescription className="truncate">
                  {[result.creator, result.year].filter(Boolean).join(" · ")}
                </DrawerDescription>
              </div>
            </DrawerHeader>

            <div className="overflow-y-auto px-4 pb-8">
              {creating ? (
                <CreateListForm
                  defaultKind={defaultKind}
                  submitLabel="Crear y agregar"
                  onCreated={(l) => {
                    setCreating(false);
                    void add(l.id, l.name);
                  }}
                />
              ) : (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Agregar a…
                  </p>
                  {lists.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14" />
                      <Skeleton className="h-14" />
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {compatible.map((l) => {
                        const done = addedTo.has(l.id);
                        return (
                          <li key={l.id}>
                            <button
                              type="button"
                              disabled={busyId === l.id || done}
                              onClick={() => add(l.id, l.name)}
                              className={cn(
                                "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left transition-colors",
                                done ? "border-success/40 bg-success/10" : "border-border bg-secondary active:bg-accent",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold">{l.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {LIST_KIND_LABEL[l.kind]} · {l.itemCount} ítems
                                </div>
                              </div>
                              {busyId === l.id ? (
                                <Loader2 className="size-5 animate-spin text-primary" />
                              ) : done ? (
                                <Check className="size-5 text-success" />
                              ) : (
                                <Plus className="size-5 text-primary" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                      {compatible.length === 0 && (
                        <li className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                          Todavía no tenés listas para este tipo.
                        </li>
                      )}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 text-sm font-semibold text-primary"
                  >
                    <Plus className="size-4" /> Nueva lista
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

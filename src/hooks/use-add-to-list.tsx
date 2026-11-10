import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddToListDrawer } from "@/components/AddToListDrawer";
import { useAuth } from "@/hooks/use-auth";
import { addResultToList } from "@/lib/add-item";
import { listAccepts, type SearchResult } from "@/lib/media";
import { keys, listQuery } from "@/lib/queries";

export const resultKey = (r: SearchResult) => `${r.source}:${r.externalId}`;

/**
 * "+" behaviour shared by search, movie and person pages.
 * With a target list (opened from a list's "Agregar"), "+" adds straight into it;
 * otherwise it opens the sheet to pick a list.
 */
export function useAddToList(listId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const target = useQuery({ ...listQuery(listId ?? ""), enabled: !!listId });
  const targetList = listId ? target.data?.list : undefined;
  const [picking, setPicking] = useState<SearchResult | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function add(r: SearchResult) {
    if (!targetList || !user || !listAccepts(targetList.kind, r.mediaType)) return setPicking(r);
    const k = resultKey(r);
    setBusy(k);
    const res = await addResultToList(r, targetList.id, user.id);
    setBusy(null);
    if (!res.ok && !res.duplicate) return void toast.error("No se pudo agregar", { description: res.message });
    setAdded((s) => new Set(s).add(k));
    qc.invalidateQueries({ queryKey: keys.items(targetList.id) });
    qc.invalidateQueries({ queryKey: keys.myLists });
    if (res.ok) toast.success(`Agregado a «${targetList.name}»`);
    else toast("Ya estaba en esa lista");
  }

  return {
    targetList,
    add,
    isAdded: (r: SearchResult) => added.has(resultKey(r)),
    isBusy: (r: SearchResult) => busy === resultKey(r),
    /** Render once on the page: the list picker sheet. */
    sheet: <AddToListDrawer result={picking} onOpenChange={(o) => !o && setPicking(null)} />,
  };
}

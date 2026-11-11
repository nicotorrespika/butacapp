import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Ear, Eye, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { SearchResult } from "@/lib/media";
import { movieRouteId } from "@/lib/media";
import { cultureRouteId } from "@/lib/culture";
import { getMovie } from "@/lib/movies.functions";
import { getCultureDetail } from "@/lib/culture.functions";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Poster } from "@/components/Poster";
import { cn } from "@/lib/utils";

type Entry = { favorite: boolean; done: boolean } | null;
const isMovie = (r: SearchResult) => r.mediaType === "movie" || r.mediaType === "tv";

/** Personal favorite/consumed state for one work, loaded only when quick actions are shown. */
function useQuickEntry(result: SearchResult, enabled: boolean) {
  const { user } = useAuth(); const qc = useQueryClient();
  const movie = isMovie(result);
  const key = ["quick-entry", user?.id, result.source, result.externalId];
  const q = useQuery({ queryKey: key, enabled: enabled && !!user, staleTime: 60_000, queryFn: async (): Promise<Entry> => {
    if (movie) { const r = await supabase.from("movie_entries").select("favorite,watched").eq("user_id", user!.id).eq("source", result.source).eq("external_id", result.externalId).maybeSingle(); return r.data ? { favorite: r.data.favorite, done: r.data.watched } : null; }
    const r = await supabase.from("cultural_entries").select("favorite,consumed").eq("user_id", user!.id).eq("source", result.source).eq("external_id", result.externalId).maybeSingle(); return r.data ? { favorite: r.data.favorite, done: r.data.consumed } : null;
  } });
  async function toggle(field: "favorite" | "done") {
    if (!user) return; const cur = q.data ?? { favorite: false, done: false }; const next = { ...cur, [field]: !cur[field] };
    qc.setQueryData(key, next);
    // Update only the changed field on existing entries so ratings and reviews are never overwritten.
    const r = movie
      ? await supabase.from("movie_entries").upsert({ user_id: user.id, source: result.source, external_id: result.externalId, title: result.title, year: result.year, image_url: result.imageUrl, ...(field === "favorite" ? { favorite: next.favorite } : { watched: next.done }) }, { onConflict: "user_id,source,external_id" })
      : await supabase.from("cultural_entries").upsert({ user_id: user.id, source: result.source, external_id: result.externalId, media_type: result.mediaType as "book" | "music", title: result.title, creator: result.creator, year: result.year, image_url: result.imageUrl, ...(field === "favorite" ? { favorite: next.favorite } : { consumed: next.done }) }, { onConflict: "user_id,source,external_id" });
    if (r.error) { qc.setQueryData(key, cur); return void toast.error("No se pudo guardar. Probá otra vez."); }
    qc.invalidateQueries({ queryKey: ["social"] }); qc.invalidateQueries({ queryKey: ["culture"] });
    toast.success(field === "favorite" ? (next.favorite ? "A favoritos, de una" : "Sacada de favoritos") : next.done ? "Anotado" : "Desmarcado");
  }
  return { entry: q.data ?? null, toggle };
}
const doneLabel = (r: SearchResult) => r.mediaType === "music" ? "Escuchado" : r.mediaType === "book" ? "Leído" : "Visto";

function ActionIcons({ result, entry, toggle, onSave, large = false }: { result: SearchResult; entry: Entry; toggle: (f: "favorite" | "done") => void; onSave: () => void; large?: boolean }) {
  const Done = result.mediaType === "music" ? Ear : Eye;
  const cls = large ? "h-auto min-h-16 flex-1 flex-col gap-1 text-xs [&_svg]:size-5" : "size-11 rounded-full bg-background/70 [&_svg]:size-5";
  return <div className={cn("flex", large ? "gap-1 border-y border-border py-1" : "gap-1.5")}>
    <Button type="button" variant="ghost" size={large ? "default" : "icon"} className={cls} aria-pressed={!!entry?.favorite} aria-label="Favorito" onClick={e => { e.stopPropagation(); toggle("favorite"); }}><Heart className={entry?.favorite ? "fill-primary text-primary" : ""} />{large && "Favorito"}</Button>
    <Button type="button" variant="ghost" size={large ? "default" : "icon"} className={cls} aria-label="Guardar en una lista" onClick={e => { e.stopPropagation(); onSave(); }}><Clock />{large && "Guardar"}</Button>
    <Button type="button" variant="ghost" size={large ? "default" : "icon"} className={cls} aria-pressed={!!entry?.done} aria-label={doneLabel(result)} onClick={e => { e.stopPropagation(); toggle("done"); }}><Done className={entry?.done ? "text-primary" : ""} />{large && doneLabel(result)}</Button>
  </div>;
}

/** Desktop hover overlay: darkens the cover and shows the three shortcuts. */
export function HoverActions({ result, onSave }: { result: SearchResult; onSave: () => void }) {
  const [on, setOn] = useState(false);
  const { entry, toggle } = useQuickEntry(result, on);
  return <div onMouseEnter={() => setOn(true)} className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-background/0 opacity-0 transition duration-200 [@media(hover:hover)]:flex group-hover/cover:pointer-events-auto group-hover/cover:bg-background/60 group-hover/cover:opacity-100 group-focus-within/cover:pointer-events-auto group-focus-within/cover:opacity-100">
    <ActionIcons result={result} entry={entry} toggle={toggle} onSave={onSave} />
  </div>;
}

/** Touch quick view: bigger cover, short synopsis and the three shortcuts without leaving the screen. */
export function QuickView({ result, open, onOpenChange, onSave, onOpenFull }: { result: SearchResult; open: boolean; onOpenChange: (o: boolean) => void; onSave: () => void; onOpenFull: () => void }) {
  const { entry, toggle } = useQuickEntry(result, open);
  const movieFn = useServerFn(getMovie); const cultureFn = useServerFn(getCultureDetail);
  const syn = useQuery({ queryKey: ["quick-synopsis", result.source, result.externalId], enabled: open, staleTime: 3600_000, queryFn: async () => {
    if (isMovie(result)) { const r = await movieFn({ data: { id: movieRouteId(result.externalId) } }); return r.ok ? r.data.overview ?? null : null; }
    const r = await cultureFn({ data: { id: cultureRouteId(result.source, result.externalId) } }); return r.ok ? r.detail.description : null;
  } });
  return <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent className="max-h-[90vh] px-4 pb-6">
      <div className="mx-auto mt-4 w-full max-w-md space-y-4 overflow-y-auto">
        <div className="flex gap-4">
          <div className="w-32 shrink-0"><Poster src={result.imageUrl} alt={result.title} media={result.mediaType} /></div>
          <div className="min-w-0">
            <DrawerTitle className="font-display text-2xl italic text-primary">{result.title}</DrawerTitle>
            <p className="cinema-meta mt-1 text-muted-foreground">{[result.creator, result.year].filter(Boolean).join(" · ")}</p>
            <DrawerDescription className="mt-3 line-clamp-6 text-sm leading-6 text-muted-foreground">{syn.isLoading ? "Buscando la sinopsis…" : syn.data ?? "Sin sinopsis por ahora."}</DrawerDescription>
          </div>
        </div>
        <ActionIcons large result={result} entry={entry} toggle={toggle} onSave={() => { onOpenChange(false); onSave(); }} />
        <Button type="button" variant="outline" className="w-full" onClick={() => { onOpenChange(false); onOpenFull(); }}>Ver ficha completa</Button>
      </div>
    </DrawerContent>
  </Drawer>;
}

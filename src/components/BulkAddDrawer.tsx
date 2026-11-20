import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Poster } from "@/components/Poster";
import { bulkCandidates, findBulkSources } from "@/lib/bulk-import.functions";
import { BULK_LIMIT, splitExisting, type BulkCandidate, type BulkMode } from "@/lib/bulk-import";
import type { ListKind } from "@/lib/media";
import { keys, type ItemRow } from "@/lib/queries";
import { cn } from "@/lib/utils";

const MODES: { id: BulkMode; label: string; placeholder: string; kinds: ListKind[] }[] = [
  { id: "director", label: "Director/a", placeholder: "Kubrick", kinds: ["movies", "mixed"] },
  { id: "title", label: "Palabra del título", placeholder: "avengers", kinds: ["movies", "mixed"] },
  { id: "collection", label: "Saga", placeholder: "Godzilla", kinds: ["movies", "mixed"] },
  { id: "actor", label: "Actor/actriz", placeholder: "Ricardo Darín", kinds: ["movies", "mixed"] },
  { id: "author", label: "Autor/a", placeholder: "Paul Auster", kinds: ["books", "mixed"] },
  { id: "artist", label: "Artista", placeholder: "Spinetta", kinds: ["music", "mixed"] },
];
const GENRES: [number, string][] = [[28, "Acción"], [16, "Animación"], [35, "Comedia"], [80, "Crimen"], [18, "Drama"], [14, "Fantasía"], [27, "Terror"], [878, "Ciencia ficción"], [53, "Suspenso"], [10749, "Romance"]];
type Source = { id: number; name: string; image: string | null; detail: string };

export function BulkAddDrawer({ open, onOpenChange, listId, kind, userId, existing }: {
  open: boolean; onOpenChange: (o: boolean) => void; listId: string; kind: ListKind; userId: string; existing: ItemRow[];
}) {
  const qc = useQueryClient();
  const modes = MODES.filter((m) => m.kinds.includes(kind));
  const [mode, setMode] = useState<BulkMode>(modes[0]?.id ?? "director");
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<number | undefined>();
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [sources, setSources] = useState<Source[] | null>(null);
  const [items, setItems] = useState<BulkCandidate[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const isMovie = mode === "director" || mode === "actor" || mode === "title" || mode === "collection";
  const k = (i: BulkCandidate) => `${i.source}:${i.externalId}`;
  const shown = useMemo(() => (items ?? []).filter((i) => showAll || !i.hiddenReason), [items, showAll]);
  const selected = shown.filter((i) => picked.has(k(i)));

  function reset() { setSources(null); setItems(null); setPicked(new Set()); }
  function close(o: boolean) { if (!o) { reset(); setQ(""); } onOpenChange(o); }

  async function load(id?: number) {
    setBusy(true); setSources(null);
    try {
      const rows = await bulkCandidates({ data: { mode, id, q: q.trim(), genre: isMovie ? genre : undefined, fromYear: Number(fromYear) || undefined, toYear: Number(toYear) || undefined } });
      setItems(rows);
      setPicked(new Set(rows.filter((r) => !r.hiddenReason).map(k)));
      if (!rows.length) toast("No encontré nada con eso. Probá otra palabra.");
    } catch { toast.error("Se nos trabó la búsqueda. Probá de nuevo."); }
    setBusy(false);
  }

  async function search() {
    if (!q.trim()) return;
    reset();
    if (mode === "director" || mode === "actor" || mode === "collection") {
      setBusy(true);
      try {
        const r = await findBulkSources({ data: { kind: mode === "collection" ? "collection" : "person", q: q.trim(), department: mode === "director" ? "Directing" : mode === "actor" ? "Acting" : undefined } });
        if (r.length === 1) { setBusy(false); return void load(r[0]!.id); }
        setSources(r);
        if (!r.length) toast("No apareció nadie con ese nombre.");
      } catch { toast.error("Se nos trabó la búsqueda. Probá de nuevo."); }
      setBusy(false);
    } else void load();
  }

  async function confirm() {
    const { fresh, duplicates } = splitExisting(selected, existing);
    if (!fresh.length) return void toast(`${duplicates} ya estaban en tu lista`);
    setBusy(true);
    const { data, error } = await supabase.from("list_items").insert(fresh.map((r) => ({
      list_id: listId, media_type: r.mediaType, source: r.source, external_id: r.externalId, title: r.title, creator: r.creator,
      year: r.year, image_url: r.imageUrl, kind_label: r.kindLabel, external_url: r.externalUrl, added_by: userId,
    }))).select("id");
    setBusy(false);
    if (error) return void toast.error("No se pudieron agregar", { description: error.message });
    qc.invalidateQueries({ queryKey: keys.items(listId) });
    const ids = (data ?? []).map((d) => d.id);
    toast(`Listo: sumaste ${ids.length} ${ids.length === 1 ? "obra" : "obras"}${duplicates ? ` · ${duplicates} ya estaban en tu lista` : ""}`, {
      duration: 7000,
      action: { label: "Deshacer", onClick: async () => { await supabase.from("list_items").delete().in("id", ids); qc.invalidateQueries({ queryKey: keys.items(listId) }); } },
    });
    close(false);
  }

  const current = modes.find((m) => m.id === mode);
  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-2xl uppercase">Agregar varias</DrawerTitle>
          <DrawerDescription>Traé una filmografía, una saga o una discografía entera y elegí qué queda.</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
            {modes.map((m) => (
              <Button key={m.id} type="button" size="sm" variant={mode === m.id ? "default" : "outline"} className="shrink-0" onClick={() => { setMode(m.id); reset(); }}>{m.label}</Button>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void search(); }}>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Ej.: ${current?.placeholder ?? ""}`} aria-label="Criterio" className="h-11" />
            <Button type="submit" className="h-11" disabled={busy || !q.trim()} aria-label="Buscar">{busy ? <Loader2 className="animate-spin" /> : <Search />}</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {isMovie && (
              <select value={genre ?? ""} onChange={(e) => setGenre(e.target.value ? Number(e.target.value) : undefined)} aria-label="Género" className="h-10 rounded-sm border border-input bg-card px-2 text-sm">
                <option value="">Cualquier género</option>
                {GENRES.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
              </select>
            )}
            <Input value={fromYear} onChange={(e) => setFromYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Desde año" inputMode="numeric" className="h-10 w-28" aria-label="Desde año" />
            <Input value={toYear} onChange={(e) => setToYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Hasta año" inputMode="numeric" className="h-10 w-28" aria-label="Hasta año" />
          </div>

          {sources && sources.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">¿Cuál de estos?</p>
              <ul className="divide-y divide-border rounded-sm border border-border">
                {sources.map((s) => (
                  <li key={s.id}><button type="button" onClick={() => void load(s.id)} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left hover:bg-card">
                    {s.image ? <img src={s.image} alt="" className="size-10 rounded-sm object-cover" /> : <span className="size-10 rounded-sm bg-secondary" />}
                    <span className="min-w-0"><span className="block truncate font-medium">{s.name}</span><span className="block truncate text-xs text-muted-foreground">{s.detail}</span></span>
                  </button></li>
                ))}
              </ul>
            </div>
          )}

          {items && items.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono uppercase tracking-widest text-muted-foreground">{shown.length} encontradas{items.length >= BULK_LIMIT ? ` · tope ${BULK_LIMIT}` : ""}</span>
                <span className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setPicked(new Set(shown.map(k)))}>Seleccionar todo</Button>
                  <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Quitar todo</Button>
                </span>
              </div>
              <label className="mb-2 flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="size-4 accent-primary" />
                Mostrar todo (cortos, making of, documentales, sin estrenar)
              </label>
              <ul className="divide-y divide-border">
                {shown.map((i) => {
                  const on = picked.has(k(i));
                  const dup = existing.some((e) => e.source === i.source && e.external_id === i.externalId);
                  return (
                    <li key={k(i)}>
                      <button type="button" aria-pressed={on} onClick={() => setPicked((s) => { const n = new Set(s); if (on) n.delete(k(i)); else n.add(k(i)); return n; })} className="flex min-h-14 w-full items-center gap-3 py-1.5 text-left">
                        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-sm border", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                        <div className="w-9 shrink-0"><Poster src={i.imageUrl} alt="" media={i.mediaType} aspect="aspect-[2/3]" /></div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-heading text-base italic text-primary">{i.title}</span>
                          <span className="block truncate font-mono text-[11px] uppercase text-muted-foreground">{[i.year, i.hiddenReason, dup && "Ya está en la lista"].filter(Boolean).join(" · ")}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        {items && items.length > 0 && (
          <div className="border-t border-border p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <Button className="h-12 w-full" disabled={busy || !selected.length} onClick={() => void confirm()}>
              {busy ? <Loader2 className="animate-spin" /> : `Agregar ${selected.length} ${isMovie ? (selected.length === 1 ? "película" : "películas") : selected.length === 1 ? "obra" : "obras"}`}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

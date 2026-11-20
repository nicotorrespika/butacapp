import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Disc3, Film, GripVertical, MessageCircle } from "lucide-react";
import { Poster } from "@/components/Poster";
import { DONE_LABEL, type MediaType } from "@/lib/media";
import type { ItemRow } from "@/lib/queries";
import { cn } from "@/lib/utils";

export type ListView = "list" | "grid" | "posters";
type Stat = { avg: number | null; votes: number; comments: number };
const ICON: Record<string, typeof Film> = { movie: Film, music: Disc3, book: BookOpen, art: Film };

export function ListItemsView({ items, view, stats, myScore, nextId, editing, selecting, selected, onToggleSelect, onOpen, onToggleDone, onReorder, mixed }: {
  items: ItemRow[]; view: ListView; stats: Record<string, Stat>; myScore: (id: string) => number | null; nextId: string | null;
  editing: boolean; selecting: boolean; selected: Set<string>; onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void; onToggleDone: (item: ItemRow) => void; onReorder: (ids: string[]) => void; mixed: boolean;
}) {
  const [order, setOrder] = useState(items);
  const drag = useRef<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => { if (!drag.current) setOrder(items); }, [items]);

  const orderRef = useRef(order); orderRef.current = order;
  const reorderRef = useRef(onReorder); reorderRef.current = onReorder;
  function start(id: string) {
    drag.current = id; setOrder((o) => [...o]);
    const mv = (e: PointerEvent) => { e.preventDefault(); move(e); };
    const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); if (!drag.current) return; drag.current = null; setOrder((o) => [...o]); reorderRef.current(orderRef.current.map((i) => i.id)); };
    window.addEventListener("pointermove", mv, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  }
  function move(e: { clientY: number }) {
    if (!drag.current || !listRef.current) return;
    const rows = [...listRef.current.querySelectorAll<HTMLElement>("[data-row]")];
    const target = rows.find((r) => { const b = r.getBoundingClientRect(); return e.clientY >= b.top && e.clientY <= b.bottom; });
    const tid = target?.dataset["row"];
    if (!tid || tid === drag.current) return;
    setOrder((o) => { const from = o.findIndex((i) => i.id === drag.current); const to = o.findIndex((i) => i.id === tid); const n = [...o]; const [m] = n.splice(from, 1); n.splice(to, 0, m!); return n; });
  }
  function nudge(id: string, d: number) {
    const from = order.findIndex((i) => i.id === id); const to = from + d; if (to < 0 || to >= order.length) return;
    const n = [...order]; const [m] = n.splice(from, 1); n.splice(to, 0, m!); setOrder(n); onReorder(n.map((i) => i.id));
  }
  const rows = editing ? order : items;
  const click = (id: string) => (selecting ? onToggleSelect(id) : onOpen(id));

  if (view !== "list" && !editing) {
    return (
      <ul className={cn("grid gap-x-3 gap-y-4", view === "grid" ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5")}>
        {rows.map((i) => {
          const media = i.media_type as MediaType;
          return (
            <li key={i.id}>
              <button type="button" onClick={() => click(i.id)} className="relative block w-full text-left transition-transform active:scale-[0.98]">
                <Poster src={i.image_url} alt={i.title} media={media} aspect="aspect-[2/3]" className={cn(i.done && "opacity-50 saturate-50")} />
                {i.done && <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-success text-background"><Check className="size-3" strokeWidth={3} /></span>}
                {selecting && <span className={cn("absolute right-1 top-1 flex size-5 items-center justify-center rounded-sm border", selected.has(i.id) ? "border-primary bg-primary text-primary-foreground" : "border-foreground/60 bg-background/60")}>{selected.has(i.id) && <Check className="size-3" />}</span>}
                {nextId === i.id && <span className="absolute inset-x-0 bottom-0 bg-primary py-0.5 text-center font-mono text-[9px] uppercase tracking-widest text-primary-foreground">Siguiente</span>}
                {view === "posters" && <><h3 className="mt-2 line-clamp-2 font-heading text-base italic leading-snug text-primary">{i.title}</h3><p className="truncate font-mono text-[10px] uppercase text-muted-foreground">{[i.year, i.creator].filter(Boolean).join(" · ")}</p></>}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul ref={listRef} className="divide-y divide-border">
      {rows.map((i, n) => {
        const media = i.media_type as MediaType;
        const Icon = ICON[media] ?? Film;
        const score = myScore(i.id);
        const label = DONE_LABEL[media];
        return (
          <li key={i.id} data-row={i.id} className={cn("flex min-h-[64px] items-center gap-3 py-2", drag.current === i.id && "bg-card")}>
            {editing && (
              <>
                <span className="w-5 text-right font-display text-lg text-muted-foreground">{n + 1}</span>
                <button type="button" aria-label={`Arrastrar ${i.title}`} className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground"
                  onPointerDown={(e) => { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); start(i.id); }}
                  onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); nudge(i.id, -1); } if (e.key === "ArrowDown") { e.preventDefault(); nudge(i.id, 1); } }}>
                  <GripVertical className="size-5" />
                </button>
              </>
            )}
            {selecting && !editing && (
              <button type="button" aria-pressed={selected.has(i.id)} aria-label={`Seleccionar ${i.title}`} onClick={() => onToggleSelect(i.id)} className="flex size-11 shrink-0 items-center justify-center">
                <span className={cn("flex size-5 items-center justify-center rounded-sm border", selected.has(i.id) ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{selected.has(i.id) && <Check className="size-3.5" strokeWidth={3} />}</span>
              </button>
            )}
            <button type="button" onClick={() => !editing && click(i.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="w-11 shrink-0"><Poster src={i.image_url} alt="" media={media} aspect="aspect-[2/3]" className={cn(i.done && "opacity-50 saturate-50")} /></div>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cn("truncate font-heading text-lg italic leading-tight text-primary", i.done && "opacity-60")}>{i.title}</span>
                  {nextId === i.id && <span className="shrink-0 rounded-sm border border-primary px-1.5 font-mono text-[9px] uppercase tracking-widest text-primary">Siguiente</span>}
                </span>
                <span className="flex items-center gap-1.5 truncate font-mono text-[11px] uppercase text-muted-foreground">
                  {mixed && <Icon className="size-3 shrink-0" aria-label={media} />}
                  {[i.year, i.creator].filter(Boolean).join(" · ")}
                  {score != null && <span className="text-primary">★ {score}</span>}
                  {!!stats[i.id]?.comments && <span className="flex items-center gap-0.5"><MessageCircle className="size-3" />{stats[i.id]!.comments}</span>}
                </span>
              </span>
            </button>
            {!editing && !selecting && (
              <button type="button" onClick={() => onToggleDone(i)} aria-pressed={i.done} aria-label={i.done ? `${label.done}: quitar` : `Marcar ${label.done.toLowerCase()}`} className="flex size-11 shrink-0 items-center justify-center">
                <span className={cn("flex size-6 items-center justify-center rounded-full border", i.done ? "border-success bg-success text-background" : "border-input text-transparent")}><Check className="size-3.5" strokeWidth={3} /></span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

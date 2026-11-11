import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUp, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TOP_KIND_COPY, type TopKind } from "@/lib/copy";
import { movieRouteId } from "@/lib/media";
import { cultureRouteId } from "@/lib/culture";
import { Button } from "./ui/button";
import { Poster } from "./Poster";

interface TopEntry {
  id: string;
  kind: TopKind;
  position: number;
  source: string;
  external_id: string;
  title: string;
  creator: string | null;
  image_url: string | null;
  external_url: string | null;
}

function entryLink(e: TopEntry): { to: string; params?: Record<string, string> | undefined; external?: string | undefined } {
  if (e.kind === "movie") return { to: "/movie/$movieId", params: { movieId: movieRouteId(e.external_id) } };
  if (e.kind === "album" || e.kind === "song") return { to: "/culture/$cultureId", params: { cultureId: cultureRouteId(e.source, e.external_id) } };
  return { to: "", external: e.external_url ?? undefined };
}

/** Top 5 de una categoría/tipo (películas, artistas, discos, canciones, autores, libros). */
export function TopFiveSection({ userId, kind, own }: { userId: string; kind: TopKind; own: boolean }) {
  const qc = useQueryClient();
  const copy = TOP_KIND_COPY[kind];
  const q = useQuery({
    queryKey: ["top-five", userId, kind],
    queryFn: async () => {
      const r = await supabase.from("top_five_entries").select("*").eq("user_id", userId).eq("kind", kind).order("position");
      if (r.error) throw r.error;
      return r.data as TopEntry[];
    },
  });
  const entries = q.data ?? [];

  async function save(next: TopEntry[]) {
    const rows = next.map((e, i) => ({ id: e.id, position: i + 1 }));
    // Delete removed, then re-position the rest.
    const keep = new Set(next.map((e) => e.id));
    const removed = entries.filter((e) => !keep.has(e.id));
    for (const e of removed) await supabase.from("top_five_entries").delete().eq("id", e.id);
    for (const r of rows) await supabase.from("top_five_entries").update({ position: r.position }).eq("id", r.id);
    void qc.invalidateQueries({ queryKey: ["top-five", userId, kind] });
    toast.success("Top 5 actualizado");
  }

  const media = kind === "movie" ? "movie" : kind === "author" || kind === "book" ? "book" : "music";
  const round = kind === "artist" || kind === "author";

  return (
    <section>
      <h2 className="mb-6 cinema-heading text-3xl">{copy.title}</h2>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !entries.length ? (
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {entries.map((e, i) => {
            const link = entryLink(e);
            const figure = round ? (
              <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border border-border bg-secondary font-display text-3xl text-muted-foreground">
                {e.image_url ? <img src={e.image_url} alt={e.title} loading="lazy" className="h-full w-full object-cover" /> : e.title.charAt(0)}
              </span>
            ) : (
              <Poster src={e.image_url} alt={e.title} media={media} />
            );
            return (
              <div className="relative pt-8" key={e.id}>
                <span aria-hidden="true" className="absolute -top-3 left-0 font-heading text-7xl font-bold text-primary/30">{i + 1}</span>
                {link.external ? (
                  <a href={link.external} target="_blank" rel="noreferrer">{figure}</a>
                ) : (
                  <Link to={link.to} params={link.params ?? {}}>{figure}</Link>
                )}
                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight">{e.title}</p>
                {own && (
                  <div className="mt-1 flex flex-col">
                    <Button variant="ghost" className="px-0 text-[10px]" disabled={i === 0} onClick={() => { const next = [...entries]; const cur = next[i]; const prev = next[i - 1]; if (!cur || !prev) return; next[i - 1] = cur; next[i] = prev; void save(next); }}>
                      <ArrowUp />Subir
                    </Button>
                    <Button variant="ghost" className="px-0 text-[10px]" onClick={() => void save(entries.filter((x) => x.id !== e.id))}>
                      <X />Quitar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {own && entries.length < 5 && (
        <Button asChild variant="outline" className="mt-4">
          <Link to="/search" search={{ top: kind }}><Plus />{entries.length ? copy.addCta : copy.pickCta}</Link>
        </Button>
      )}
    </section>
  );
}

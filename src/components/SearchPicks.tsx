import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { searchMedia } from "@/lib/search.functions";
import { ResultCard } from "@/components/ResultCard";
import { useAddToList } from "@/hooks/use-add-to-list";
import { cultureRouteId } from "@/lib/culture";
import { movieRouteId, type SearchResult } from "@/lib/media";
import { tasteKey } from "@/lib/tastes";

type Cat = "movie" | "book" | "music";
/** Starter queries so the section is never empty before the first search. */
const DEFAULTS: Record<Cat, string[]> = {
  movie: ["Nueve reinas", "Zama", "Relatos salvajes"],
  book: ["Julio Cortázar", "Mariana Enríquez", "Samanta Schweblin"],
  music: ["Luis Alberto Spinetta", "Charly García", "Mercedes Sosa"],
};
const VERB: Record<Cat, string> = { movie: "buscaste", book: "buscaste", music: "buscaste" };

/** Live picks from the user's latest searches in this category, with starter picks by default. */
export function SearchPicks({ category }: { category: Cat }) {
  const { user } = useAuth();
  const search = useServerFn(searchMedia);
  const add = useAddToList(undefined);
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["tastes", "search-picks", user?.id, category],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const s = await supabase.from("taste_signals").select("signal_key,category,source,external_id,title,excluded")
        .eq("user_id", user?.id ?? "").order("occurred_at", { ascending: false }).limit(200);
      const signals = s.data ?? [];
      const excluded = new Set(signals.filter(x => x.excluded).map(x => tasteKey(x.source, x.external_id)));
      const searched = signals.filter(x => x.signal_key.startsWith("search:") && (x.category === category || x.category === "all"))
        .map(x => x.title).filter((t, i, a) => t && a.indexOf(t) === i).slice(0, 3);
      const personal = searched.length > 0;
      const queries = personal ? searched : DEFAULTS[category];
      const lists = await Promise.all(queries.map(t => search({ data: { q: t, filter: category } }).then(r => r[category]).catch(() => [] as SearchResult[])));
      const seen = new Set<string>(); const out: SearchResult[] = [];
      for (let i = 0; out.length < 8 && i < 12; i++) for (const l of lists) {
        const r = l[i]; if (!r || out.length >= 8) continue;
        const k = tasteKey(r.source, r.externalId);
        if (seen.has(k) || excluded.has(k)) continue;
        seen.add(k); out.push(r);
      }
      return { personal, queries, items: out };
    },
  });
  if (!user || !q.data?.items.length) return null;
  const open = (r: SearchResult) => r.mediaType === "movie"
    ? navigate({ to: "/movie/$movieId", params: { movieId: movieRouteId(r.externalId) } })
    : navigate({ to: "/culture/$cultureId", params: { cultureId: cultureRouteId(r.source, r.externalId) } });
  return (
    <section className="px-4 py-6">
      <h2 className="cinema-heading text-3xl">{q.data.personal ? `Porque ${VERB[category]} ${q.data.queries[0]}` : "Para arrancar"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{q.data.personal ? "Se va afinando con cada búsqueda." : "Buscá algo y esto se arma a tu medida."}</p>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
        {q.data.items.map(r => <ResultCard key={tasteKey(r.source, r.externalId)} result={r} onAdd={add.add} busy={add.isBusy(r)} added={add.isAdded(r)} onOpen={open} />)}
      </div>
    </section>
  );
}

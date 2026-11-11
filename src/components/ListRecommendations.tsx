import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Loader2, Glasses } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultCard } from "@/components/ResultCard";
import { useCardProps } from "@/components/MediaRow";
import { useAddToList } from "@/hooks/use-add-to-list";
import { getRecommendations } from "@/lib/recommendations.functions";
import type { RecommendedMovie } from "@/lib/recommendation-types";

export function ListRecommendations({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("Viendo las pelis que tengo en esta lista, recomendame algo que vaya por este lado.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [movies, setMovies] = useState<RecommendedMovie[]>([]);
  const recommend = useServerFn(getRecommendations);
  const adder = useAddToList(listId);
  const props = useCardProps(adder, listId);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const result = await recommend({ data: { listId, description } });
      if (result.ok) setMovies(result.movies); else setError(result.message);
    } catch { setError("Uy, me mandé una bettiada. Probá de nuevo."); }
    finally { setBusy(false); }
  }
  return <section className="mt-8 px-4">
    <Button variant="outline" onClick={() => setOpen(!open)} aria-expanded={open}><Glasses strokeWidth={1.5} /> Betty · Sugerir películas</Button>
    {open && <div className="mt-4 space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">Soy Betty. Miro las pelis, notas y reseñas de esta lista y te busco algo por ese lado.</p>
      <form onSubmit={submit} className="space-y-3">
        <textarea aria-label="Contale a Betty qué querés ver en esta lista" placeholder="Contale a Betty qué querés ver…" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-sm border border-input bg-card px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-ring" />
        <Button type="submit" disabled={busy || !description.trim()}>{busy ? <Loader2 className="animate-spin" /> : <Glasses />} {busy ? "Betty está revolviendo la videoteca…" : error ? "Probar de nuevo" : "¿Indeciso? Describile a Betty qué te gustaría ver"}</Button>
      </form>
      <p className="text-xs text-muted-foreground">Betty es una IA y a veces se equivoca.</p>
      {error && <p role="alert" className="text-sm text-muted-foreground">{error}</p>}
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">{movies.map((m) => <article key={`${m.title}-${m.year}`}>
        {m.result ? <ResultCard {...props(m.result)} /> : <><h3 className="font-display text-xl">{m.title}</h3><p className="mt-1 text-xs text-muted-foreground">{m.year}</p><Button asChild variant="link" className="px-0"><Link to="/search" search={{ q: `${m.title} ${m.year ?? ""}`, f: "movie", list: listId }}>Buscar película</Link></Button></>}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.reason}</p>
      </article>)}</div>
    </div>}
    {adder.sheet}
  </section>;
}
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TOP_KIND_COPY, type TopKind } from "@/lib/copy";
import { movieRouteId } from "@/lib/media";
import { cultureRouteId } from "@/lib/culture";
import { Button } from "./ui/button";
import { Poster } from "./Poster";
import { useServerFn } from '@tanstack/react-start';
import { getTopPortraits } from '@/lib/portraits.functions';
import { TopPortrait } from './TopPortrait';

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
  const portraitCall = useServerFn(getTopPortraits);
  const portraits = useQuery({ queryKey: ['top-five', 'portraits', userId, kind, entries.map(e => e.id)], enabled: (kind === 'artist' || kind === 'author') && entries.length > 0, staleTime: 30 * 86400000, queryFn: () => portraitCall({ data: { userId, kind: kind === 'author' ? 'author' : 'artist' } }) });

  const media = kind === "movie" ? "movie" : kind === "author" || kind === "book" ? "book" : "music";
  const round = kind === "artist" || kind === "author";

  return (
    <section>
      <h2 className="mb-6 cinema-heading text-3xl">{copy.title}</h2>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
        {!entries.length && <p className="mb-3 text-sm text-muted-foreground">{copy.empty}</p>}
        <div className="grid grid-cols-5 gap-2">
          {entries.map((e, i) => {
            const link = entryLink(e);
            const figure = round ? (
              <TopPortrait name={e.title} url={portraits.data?.find(p => p.id === e.id)?.url ?? e.image_url} />
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
              </div>
            );
          })}
          {own && entries.length < 5 && (
            <div className="flex items-center justify-center pt-8">
              <Button asChild variant="ghost" size="icon" className="size-11 text-muted-foreground opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100">
                <Link to="/search" search={{ top: kind }} aria-label={entries.length ? copy.addCta : copy.pickCta} title={entries.length ? copy.addCta : copy.pickCta}><Plus className="size-6" /></Link>
              </Button>
            </div>
          )}
        </div>
        </>
      )}
    </section>
  );
}

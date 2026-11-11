import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { getBookMentions } from "@/lib/culture.functions";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ResultCard } from "@/components/ResultCard";
import { useAddToList } from "@/hooks/use-add-to-list";
import { cultureRouteId } from "@/lib/culture";
import { movieRouteId } from "@/lib/media";
import type { SearchResult } from "@/lib/media";

/** Collapsible lists of films and music named inside a book. */
export function BookMentions({ id, title }: { id: string; title: string }) {
  const call = useServerFn(getBookMentions);
  const q = useQuery({ queryKey: ["book-mentions", id], staleTime: 86400000, queryFn: () => call({ data: { id } }) });
  const add = useAddToList();
  const navigate = useNavigate();
  if (!q.data?.ok || (!q.data.movies.length && !q.data.music.length)) return null;
  const open = (r: SearchResult) => r.mediaType === "movie" ? navigate({ to: "/movie/$movieId", params: { movieId: movieRouteId(r.externalId) } }) : navigate({ to: "/culture/$cultureId", params: { cultureId: cultureRouteId(r.source, r.externalId) } });
  const list = (items: { result: SearchResult; context: string }[]) => <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">{items.map(i => <div key={i.result.externalId}><ResultCard result={i.result} onAdd={add.add} busy={add.isBusy(i.result)} added={add.isAdded(i.result)} onOpen={open} /><p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{i.context}</p></div>)}</div>;
  return <section>
    <Accordion type="multiple">
      {!!q.data.movies.length && <AccordionItem value="movies"><AccordionTrigger className="min-h-11 py-3 font-display text-xl">Películas que se nombran en {title} ({q.data.movies.length})</AccordionTrigger><AccordionContent>{list(q.data.movies)}</AccordionContent></AccordionItem>}
      {!!q.data.music.length && <AccordionItem value="music"><AccordionTrigger className="min-h-11 py-3 font-display text-xl">Música que se nombra en {title} ({q.data.music.length})</AccordionTrigger><AccordionContent>{list(q.data.music)}</AccordionContent></AccordionItem>}
    </Accordion>
    <p className="cinema-meta mt-2 text-muted-foreground">Lista armada por Betty y verificada en catálogos. Puede fallar.</p>
    {add.sheet}
  </section>;
}

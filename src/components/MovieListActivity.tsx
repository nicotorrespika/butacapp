import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemDrawer } from "@/components/ItemDrawer";
import { ErrorState } from "@/components/States";
import { useAuth } from "@/hooks/use-auth";
import { useAddToList } from "@/hooks/use-add-to-list";
import { commentsQuery, itemsQuery, listQuery, myListsQuery, ratingsQuery, useListRealtime } from "@/lib/queries";
import type { MovieDetail } from "@/lib/movie-types";

export function MovieListActivity({ movie, listId }: { movie: MovieDetail; listId: string | undefined }) {
  const lists = useQuery(myListsQuery);
  const [chosen, setChosen] = useState("");
  const selected = listId ?? chosen;
  const eligible = lists.data?.filter((l) => l.kind === "movies" || l.kind === "mixed") ?? [];
  return (
    <section className="px-4" aria-label="Actividad en la lista">
      <h2 className="mb-4 font-display text-2xl">En tu lista</h2>
      {!listId && eligible.length > 0 && <select aria-label="Lista para esta película" value={chosen} onChange={(e) => setChosen(e.target.value)} className="mb-4 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground"><option value="">Elegí una lista</option>{eligible.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}
      <ListActivity key={selected} movie={movie} listId={selected || undefined} />
    </section>
  );
}

function ListActivity({ movie, listId }: { movie: MovieDetail; listId: string | undefined }) {
  const { user } = useAuth();
  const adder = useAddToList(listId);
  const id = listId ?? "";
  const detail = useQuery({ ...listQuery(id), enabled: !!listId });
  const items = useQuery({ ...itemsQuery(id), enabled: !!listId });
  const ratings = useQuery({ ...ratingsQuery(id), enabled: !!listId });
  const comments = useQuery({ ...commentsQuery(id), enabled: !!listId });
  useListRealtime(id);
  const imdbId = movie.links.imdb?.match(/title\/(tt\d+)/)?.[1];
  const item = items.data?.find((i) => (i.source === movie.result.source && i.external_id === movie.result.externalId) || (i.source === "imdb" && !!imdbId && i.external_id === imdbId));
  if (listId && (detail.isError || items.isError || ratings.isError || comments.isError)) return <ErrorState onRetry={() => { void detail.refetch(); void items.refetch(); void ratings.refetch(); void comments.refetch(); }} />;
  if (listId && (items.isLoading || detail.isLoading || ratings.isLoading || comments.isLoading)) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  return <>
    {item && detail.data && user ? <>
      <p className="text-sm text-muted-foreground">{detail.data.list.name}</p>
      <ItemDrawer inline key={item.id} item={item} onOpenChange={() => {}} ratings={ratings.data ?? []} comments={comments.data ?? []} profiles={detail.data.profiles} userId={user.id} isOwner={detail.data.list.owner_id === user.id} />
    </> : <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-3" disabled={adder.isBusy(movie.result)} onClick={() => adder.add(movie.result)}>{adder.isBusy(movie.result) ? <Loader2 className="animate-spin" /> : <Plus />}{adder.targetList ? `Agregar a «${adder.targetList.name}»` : "Agregar a una lista"}</Button>}
    {adder.sheet}
  </>;
}
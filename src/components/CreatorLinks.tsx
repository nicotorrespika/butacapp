import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMovie } from "@/lib/movies.functions";
import { movieRouteId, type MediaType } from "@/lib/media";

/** Creator names share the same destinations in cards and quick views. */
export function CreatorLinks({ creator, media, externalId, directors = [], listId, onOpen }: {
  creator: string | null;
  media: MediaType;
  externalId: string;
  directors?: { id: number; name: string }[] | undefined;
  listId?: string | undefined;
  onOpen?: () => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const movie = useServerFn(getMovie);
  const [busy, setBusy] = useState(false);
  const names = directors.length ? directors.map(d => d.name) : (creator ?? "").split(" · ").map(n => n.trim()).filter(Boolean);
  const cls = "inline-flex min-h-11 max-w-full items-center whitespace-normal text-left text-inherit underline decoration-primary/40 underline-offset-4 hover:text-primary";

  async function openDirector(name: string) {
    setBusy(true);
    try {
      const id = movieRouteId(externalId);
      const detail = await qc.fetchQuery({ queryKey: ["movie", id], queryFn: () => movie({ data: { id } }), staleTime: 30 * 60_000 });
      const director = detail.ok ? detail.data.directors.find(d => d.name.toLocaleLowerCase() === name.toLocaleLowerCase()) : undefined;
      if (!director) { toast.error("No encontramos la ficha de este director. Probá desde la película."); return; }
      onOpen?.();
      await navigate({ to: "/person/$personId", params: { personId: String(director.id) }, search: { list: listId } });
    } catch { toast.error("No se pudo abrir la ficha. Probá de nuevo."); }
    finally { setBusy(false); }
  }

  return <>{names.map((name, index) => {
    const director = directors.find(d => d.name === name);
    return <span key={name}>{index > 0 && " · "}{media === "book" || media === "music" ?
      <Link to="/creator/$type/$name" params={{ type: media, name }} className={cls} onClick={onOpen}>{name}</Link> :
      media === "movie" ? director ?
        <Link to="/person/$personId" params={{ personId: String(director.id) }} search={{ list: listId }} className={cls} onClick={onOpen}>{name}</Link> :
        <Button variant="ghost" disabled={busy} onClick={() => void openDirector(name)} className={`${cls} h-auto rounded-none p-0 font-inherit text-inherit hover:bg-transparent`}>{name}</Button> : name}</span>;
  })}</>;
}
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getCreator, getSimilarCreators } from "@/lib/culture.functions";
import { cultureRouteId } from "@/lib/culture";
import { BackButton } from "@/components/BackButton";
import { ErrorState } from "@/components/States";
import { ResultCard } from "@/components/ResultCard";
import { useAddToList } from "@/hooks/use-add-to-list";

export const Route = createFileRoute("/_authenticated/creator/$type/$name")({
  head: ({ params }) => ({ meta: [
    { title: `${params.name} — MOMENTO BUTACA` },
    { name: "description", content: `Obra completa de ${params.name}: discos o libros, con fichas y listas.` },
    { property: "og:title", content: `${params.name} — MOMENTO BUTACA` },
    { property: "og:description", content: `Toda la obra de ${params.name}.` },
    { property: "og:type", content: "profile" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CreatorPage,
});

function CreatorPage() {
  const { type, name } = Route.useParams();
  const kind = type === "book" ? "book" : "music";
  const call = useServerFn(getCreator);
  const navigate = useNavigate();
  const add = useAddToList(undefined);
  const [photoOk, setPhotoOk] = useState(true);
  const relCall = useServerFn(getSimilarCreators);
  const rel = useQuery({ queryKey: ["creator-similar", kind, name], staleTime: 86400000, queryFn: () => relCall({ data: { type: kind, name } }) });
  const q = useQuery({ queryKey: ["creator", kind, name], staleTime: 86400000, queryFn: () => call({ data: { type: kind, name } }) });
  if (q.isError || q.data?.ok === false) return <div className="px-4 py-5"><BackButton /><ErrorState onRetry={() => q.refetch()} /></div>;
  if (!q.data) return <div className="px-4 py-5"><BackButton /><p className="py-12 text-muted-foreground">Buscando la obra de {name}…</p></div>;
  const c = q.data.creator;
  return <div className="space-y-8 px-4 py-5">
    <BackButton />
    <header className="flex items-start gap-5">
      {c.photo && photoOk && <img src={c.photo} alt={c.name} onError={() => setPhotoOk(false)} className="w-28 shrink-0 border border-border object-cover aspect-square" />}
      <div className="min-w-0">
        <p className="cinema-meta text-muted-foreground">{kind === "book" ? "AUTOR/A" : "ARTISTA"}</p>
        <h1 className="mt-2 break-words font-display text-4xl text-primary">{c.name}</h1>
        {c.years && <p className="mt-2 cinema-meta">{c.years}</p>}
      </div>
    </header>
    {c.bio && <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground line-clamp-[12]">{c.bio}</p>}
    <section>
      <h2 className="cinema-heading mb-5 text-2xl">{kind === "book" ? "BIBLIOGRAFÍA" : "DISCOGRAFÍA"}</h2>
      {!c.works.length ? <p className="text-sm text-muted-foreground">No encontramos obra verificada, che.</p> :
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">{c.works.map(w => <ResultCard key={w.externalId} result={w} onAdd={add.add} busy={add.isBusy(w)} added={add.isAdded(w)} onOpen={r => navigate({ to: "/culture/$cultureId", params: { cultureId: cultureRouteId(r.source, r.externalId) } })} />)}</div>}
    </section>
    {rel.isLoading && <p className="cinema-meta text-muted-foreground">Betty está pensando a quién más te puede gustar…</p>}
    {rel.data?.ok && <CreatorRow title={kind === "book" ? "AUTORES SIMILARES" : "ARTISTAS SIMILARES"} type={kind} items={rel.data.similar} />}
    {rel.data?.ok && <CreatorRow title={kind === "book" ? "¿Y SI MEJOR LEEMOS ALGO LATINO?" : "¿Y SI MEJOR ESCUCHAMOS ALGO LATINO?"} type={kind} items={rel.data.latin} />}
    {add.sheet}
  </div>;
}

function CreatorRow({ title, type, items }: { title: string; type: "book" | "music"; items: { name: string; reason: string; imageUrl: string | null }[] }) {
  if (!items.length) return null;
  return <section>
    <h2 className="cinema-heading mb-5 text-2xl">{title}</h2>
    <div className="flex snap-x gap-4 overflow-x-auto pb-3 scrollbar-none">{items.map(i => <Link key={i.name} to="/creator/$type/$name" params={{ type, name: i.name }} className="w-32 shrink-0 snap-start">
      <div className="aspect-square overflow-hidden border border-border bg-secondary">{i.imageUrl ? <img src={i.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-display text-3xl">{i.name.charAt(0)}</span>}</div>
      <p className="mt-2 text-sm font-semibold leading-tight">{i.name}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.reason}</p>
    </Link>)}</div>
  </section>;
}

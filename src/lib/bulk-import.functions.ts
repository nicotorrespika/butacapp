/** Bulk import candidates (director/actor/title/saga/author/artist) and Betty ordering. Auth required; keys stay server-side. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hiddenReason, prepareCandidates, type BulkCandidate, type RawTmdbMovie } from "@/lib/bulk-import";

const IMG = "https://image.tmdb.org/t/p/w185";

async function tmdb<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const { tmdbFetcher } = await import("@/server/search-providers");
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new Error("Falta la clave de TMDB");
  return tmdbFetcher(key)<T>(path, params);
}

const toCandidate = (m: RawTmdbMovie, creator: string | null): BulkCandidate => ({
  source: "tmdb", externalId: `movie:${m.id}`, mediaType: "movie", title: m.title ?? "Sin título", creator,
  year: m.release_date ? Number(m.release_date.slice(0, 4)) : null, imageUrl: m.poster_path ? `${IMG}${m.poster_path}` : null,
  kindLabel: "Película", externalUrl: `https://www.themoviedb.org/movie/${m.id}`, hiddenReason: hiddenReason(m), genreIds: m.genre_ids ?? [],
});

export const findBulkSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ kind: z.enum(["person", "collection"]), q: z.string().trim().min(1).max(80), department: z.enum(["Directing", "Acting"]).optional() }).parse(i))
  .handler(async ({ data }) => {
    if (data.kind === "collection") {
      const r = await tmdb<{ results: { id: number; name: string; poster_path: string | null }[] }>("/search/collection", { query: data.q });
      return r.results.slice(0, 10).map((c) => ({ id: c.id, name: c.name, image: c.poster_path ? `${IMG}${c.poster_path}` : null, detail: "Saga" }));
    }
    const r = await tmdb<{ results: { id: number; name: string; profile_path: string | null; known_for_department?: string; known_for?: { title?: string; name?: string }[] }[] }>("/search/person", { query: data.q });
    const rows = r.results.slice(0, 10);
    rows.sort((a, b) => Number(b.known_for_department === data.department) - Number(a.known_for_department === data.department));
    return rows.map((p) => ({ id: p.id, name: p.name, image: p.profile_path ? `${IMG}${p.profile_path}` : null, detail: (p.known_for ?? []).slice(0, 2).map((k) => k.title ?? k.name).join(" · ") || (p.known_for_department ?? "") }));
  });

export const bulkCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    mode: z.enum(["director", "actor", "title", "collection", "author", "artist"]),
    id: z.number().int().optional(), q: z.string().trim().max(80).optional(),
    genre: z.number().int().optional(), fromYear: z.number().int().optional(), toYear: z.number().int().optional(),
  }).parse(i))
  .handler(async ({ data }): Promise<BulkCandidate[]> => {
    const f = { genre: data.genre, fromYear: data.fromYear, toYear: data.toYear };
    let items: BulkCandidate[] = [];
    if ((data.mode === "director" || data.mode === "actor") && data.id) {
      const r = await tmdb<{ cast: RawTmdbMovie[]; crew: (RawTmdbMovie & { job?: string })[] }>(`/person/${data.id}/movie_credits`);
      const person = await tmdb<{ name: string }>(`/person/${data.id}`);
      const src = data.mode === "director" ? r.crew.filter((c) => c.job === "Director") : r.cast;
      items = src.map((m) => toCandidate(m, data.mode === "director" ? person.name : null));
    } else if (data.mode === "collection" && data.id) {
      const r = await tmdb<{ parts: RawTmdbMovie[] }>(`/collection/${data.id}`);
      items = r.parts.map((m) => toCandidate(m, null));
    } else if (data.mode === "title" && data.q) {
      const pages = await Promise.all([1, 2, 3].map((page) => tmdb<{ results: RawTmdbMovie[] }>("/search/movie", { query: data.q!, page }).catch(() => ({ results: [] }))));
      const needle = data.q.toLowerCase();
      items = pages.flatMap((p) => p.results).filter((m) => (m.title ?? "").toLowerCase().includes(needle)).map((m) => toCandidate(m, null));
    } else if ((data.mode === "author" || data.mode === "artist") && data.q) {
      const { creatorWorks } = await import("@/server/culture-providers");
      const r = await creatorWorks(data.mode === "author" ? "book" : "music", data.q);
      items = r.works.map((w) => ({ ...w, hiddenReason: data.mode === "artist" && /single|ep/i.test(w.kindLabel) ? "Single / EP" : null }));
      return prepareCandidates(items, { fromYear: f.fromYear, toYear: f.toYear });
    }
    items.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    return prepareCandidates(items, f);
  });

/** Betty proposes an order for the list's works. Members only. */
export const bettyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ listId: z.string().uuid(), criterion: z.string().trim().min(3).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    const member = await context.supabase.rpc("is_list_member", { _list_id: data.listId, _user_id: context.userId });
    if (!member.data) throw new Error("Forbidden");
    const rows = await context.supabase.from("list_items").select("id,title,year,creator,media_type").eq("list_id", data.listId).limit(150);
    const items = rows.data ?? [];
    if (items.length < 2) return { order: items.map((i) => i.id), explanation: "Con una sola obra no hay mucho para ordenar, che." };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Betty no está disponible");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { Output, streamText } = await import("ai");
    const { createLovableAiGatewayRunIdFetch } = await import("@/server/ai/run-id");
    const run = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: run.fetch });
    const numbered = items.map((i, n) => `${n + 1}. ${i.title}${i.year ? ` (${i.year})` : ""}${i.creator ? ` — ${i.creator}` : ""}`).join("\n");
    const res = streamText({
      model: provider.responses("openai/gpt-6.1-sol"),
      instructions: "Sos Betty, amiga cinéfila argentina con humor seco y voseo. Ordená las obras según el criterio pedido. Devolvé TODOS los números exactamente una vez y una explicación de una o dos oraciones, sin spoilers.",
      prompt: `Criterio: ${data.criterion}\n\nObras:\n${numbered}`,
      output: Output.object({ schema: z.object({ order: z.array(z.number().int()), explanation: z.string() }) }),
      maxRetries: 0,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    const out = await res.output;
    const seen = new Set<number>();
    const order = out.order.filter((n) => n >= 1 && n <= items.length && !seen.has(n) && (seen.add(n), true)).map((n) => items[n - 1]!.id);
    for (const i of items) if (!order.includes(i.id)) order.push(i.id);
    return { order, explanation: out.explanation };
  });

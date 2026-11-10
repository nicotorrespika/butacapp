import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recommendMovies, recommendationError } from "@/server/recommendations";
import type { RecommendationResponse } from "./recommendation-types";

export const getRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ listId: z.string().uuid(), description: z.string().trim().min(1).max(2000) }).parse(input))
  .handler(async ({ data, context }): Promise<RecommendationResponse> => {
    const db = context.supabase;
    const membership = await db.from("list_members").select("list_id").eq("list_id", data.listId).eq("user_id", context.userId).maybeSingle();
    if (membership.error || !membership.data) return { ok: false, message: "Solo los miembros de esta lista pueden pedir sugerencias." };
    const [list, items, ratings] = await Promise.all([
      db.from("lists").select("name,description").eq("id", data.listId).single(),
      db.from("list_items").select("id,title,year,done").eq("list_id", data.listId).eq("media_type", "movie").limit(80),
      db.from("ratings").select("item_id,score_10,review").eq("list_id", data.listId).limit(80),
    ]);
    if (list.error || items.error || ratings.error) return { ok: false, message: "No pudimos leer los gustos de esta lista." };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, message: "Lovable AI todavía no está configurado." };
    try {
      const contextItems = items.data.map((item) => ({ title: item.title, year: item.year, done: item.done, ratings: ratings.data.filter((r) => r.item_id === item.id).map((r) => ({ score_10: r.score_10, review: r.review })) }));
      return { ok: true, movies: await recommendMovies(key, data.description, { ...list.data, items: contextItems }, process.env["TMDB_API_KEY"]) };
    } catch (e) { return { ok: false, message: recommendationError(e) }; }
  });
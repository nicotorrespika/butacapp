import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { searchTopKind } from "@/server/top-five-providers";

const kinds = ["movie", "artist", "album", "song", "author", "book"] as const;

/** Búsqueda para armar el Top 5: solo devuelve resultados del tipo pedido. */
export const searchTopEntries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ kind: z.enum(kinds), q: z.string().trim().min(2).max(200) }).parse(input))
  .handler(async ({ data }) => searchTopKind(data.kind, data.q, process.env["TMDB_API_KEY"]));

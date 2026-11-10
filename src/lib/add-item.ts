import { supabase } from "@/integrations/supabase/client";
import type { ListKind, SearchFilter, SearchResult } from "@/lib/media";

export type AddOutcome = { ok: true } | { ok: false; duplicate: boolean; message: string };

/** Insert a search result into a list. Duplicates (same item twice) are reported, not thrown. */
export async function addResultToList(result: SearchResult, listId: string, userId: string): Promise<AddOutcome> {
  const { error } = await supabase.from("list_items").insert({
    list_id: listId,
    media_type: result.mediaType,
    source: result.source,
    external_id: result.externalId,
    title: result.title,
    creator: result.creator,
    year: result.year,
    image_url: result.imageUrl,
    kind_label: result.kindLabel,
    external_url: result.externalUrl,
    added_by: userId,
  });
  if (!error) return { ok: true };
  // 23505 = unique violation → already in that list.
  return { ok: false, duplicate: error.code === "23505", message: error.message };
}

/** Search chip that best matches a list type ("mixed" searches everything). */
export function filterForListKind(kind: ListKind): SearchFilter {
  if (kind === "movies") return "movie";
  if (kind === "music") return "music";
  if (kind === "books") return "book";
  if (kind === "art") return "art";
  return "all";
}

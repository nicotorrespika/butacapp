import { z } from "zod";
import { cultureRouteId } from "./culture";
import { movieRouteId, type SearchResult } from "./media";

export const shareKinds = ["movie", "culture", "event", "list", "profile", "review", "activity", "feed", "betty"] as const;
export const shareRefSchema = z.object({ kind: z.enum(shareKinds), id: z.string().min(1).max(200) });
export type ShareRef = z.infer<typeof shareRefSchema>;
export type ShareContent = ShareRef & { title: string; image?: string | null; year?: number | null; category?: string; description?: string | null; private?: boolean; ownerId?: string; visibility?: string; target?: string };
export const APP_ORIGIN = "https://butacapp.lovable.app";
export function sharePath(ref: ShareRef) { return `/compartir/${ref.kind}/${encodeURIComponent(ref.id)}`; }
export function shareUrl(ref: ShareRef, inviter?: string) { return `${APP_ORIGIN}${sharePath(ref)}${inviter ? `?de=${encodeURIComponent(inviter)}` : ""}`; }
export function whatsappUrl(content: ShareContent, inviter?: string) {
  const noun = content.kind === "movie" ? "esta peli" : content.kind === "event" ? "este plan" : "esto";
  return `https://wa.me/?text=${encodeURIComponent(`Mirá ${noun} en BUTACAPP: ${content.title} ${shareUrl(content, inviter)}`)}`;
}
export function shareResult(r: SearchResult): ShareContent {
  return { kind: r.mediaType === "movie" ? "movie" : "culture", id: r.mediaType === "movie" ? movieRouteId(r.externalId) : cultureRouteId(r.source, r.externalId), title: r.title, image: r.imageUrl, year: r.year, category: r.kindLabel };
}
export function parseSharedCard(value: unknown): ShareContent | null {
  const parsed = shareRefSchema.extend({ title: z.string().min(1).max(300), image: z.string().url().nullable().optional(), year: z.number().nullable().optional(), category: z.string().max(60).optional() }).safeParse(value);
  return parsed.success ? parsed.data : null;
}
export function internalShareTarget(ref: ShareRef) {
  const id = encodeURIComponent(ref.id);
  return ({ movie: `/movie/${id}`, culture: `/culture/${id}`, event: `/event/${id}`, list: `/lists/${id}`, profile: `/people/${id}`, betty: `/recibido/${id}` } as Partial<Record<ShareRef["kind"], string>>)[ref.kind] ?? sharePath(ref);
}
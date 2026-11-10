import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Check, ExternalLink, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Poster } from "@/components/Poster";
import { StarRating } from "@/components/StarRating";
import { UserAvatar } from "@/components/UserAvatar";
import { DONE_LABEL, type MediaType } from "@/lib/media";
import { averageScore } from "@/lib/ratings";
import { keys, type CommentRow, type ItemRow, type ProfileRow, type RatingRow } from "@/lib/queries";

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });

interface ItemDrawerProps {
  item: ItemRow | null;
  onOpenChange: (o: boolean) => void;
  ratings: RatingRow[];
  comments: CommentRow[];
  profiles: Record<string, ProfileRow>;
  userId: string;
  isOwner: boolean;
}

/** Full detail of one title: done toggle, my rating + group average, comments thread. */
export function ItemDrawer({ item, onOpenChange, ratings, comments, profiles, userId, isOwner }: ItemDrawerProps) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  if (!item) return <Drawer open={false} onOpenChange={onOpenChange} />;

  const media = item.media_type as MediaType;
  const labels = DONE_LABEL[media];
  const itemRatings = ratings.filter((r) => r.item_id === item.id);
  const mine = itemRatings.find((r) => r.user_id === userId)?.score ?? null;
  const avg = averageScore(itemRatings.map((r) => r.score));
  const thread = comments.filter((c) => c.item_id === item.id);
  const name = (id: string | null) => (id ? profiles[id]?.display_name || "Alguien" : "Alguien");

  const invalidate = (k: readonly unknown[]) => qc.invalidateQueries({ queryKey: k });

  async function toggleDone() {
    if (!item) return;
    const next = !item.done;
    // Optimistic update so the toggle feels instant.
    qc.setQueryData<ItemRow[]>(keys.items(item.list_id), (old) =>
      old?.map((i) => (i.id === item.id ? { ...i, done: next } : i)),
    );
    const { error } = await supabase
      .from("list_items")
      .update({ done: next, done_by: next ? userId : null, done_at: next ? new Date().toISOString() : null })
      .eq("id", item.id);
    if (error) toast.error("No se pudo actualizar", { description: error.message });
    invalidate(keys.items(item.list_id));
  }

  async function rate(score: number | null) {
    if (!item) return;
    const listKey = keys.ratings(item.list_id);
    qc.setQueryData<RatingRow[]>(listKey, (old = []) => {
      const rest = old.filter((r) => !(r.item_id === item.id && r.user_id === userId));
      return score
        ? [...rest, { item_id: item.id, list_id: item.list_id, user_id: userId, score, updated_at: new Date().toISOString() }]
        : rest;
    });
    const { error } = score
      ? await supabase
          .from("ratings")
          .upsert({ item_id: item.id, list_id: item.list_id, user_id: userId, score }, { onConflict: "item_id,user_id" })
      : await supabase.from("ratings").delete().eq("item_id", item.id).eq("user_id", userId);
    if (error) toast.error("No se pudo guardar la nota", { description: error.message });
    invalidate(listKey);
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !body.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("comments")
      .insert({ item_id: item.id, list_id: item.list_id, user_id: userId, body: body.trim() });
    setSending(false);
    if (error) return toast.error("No se pudo comentar", { description: error.message });
    setBody("");
    invalidate(keys.comments(item.list_id));
  }

  async function deleteComment(id: string) {
    if (!item) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) return toast.error("No se pudo borrar", { description: error.message });
    invalidate(keys.comments(item.list_id));
  }

  async function removeItem() {
    if (!item || !confirm(`¿Quitar «${item.title}» de la lista?`)) return;
    const { error } = await supabase.from("list_items").delete().eq("id", item.id);
    if (error) return toast.error("No se pudo quitar", { description: error.message });
    onOpenChange(false);
    invalidate(keys.items(item.list_id));
    invalidate(keys.myLists);
  }

  const canRemove = isOwner || item.added_by === userId;

  return (
    <Drawer open onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[94dvh] max-w-xl border-border bg-card">
        <div className="overflow-y-auto px-4 pb-8">
          {/* Header: poster + meta */}
          <div className="flex gap-4 pt-4">
            <Poster src={item.image_url} alt={item.title} media={media} className="w-28 shrink-0" />
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{item.kind_label}</p>
              <DrawerTitle className="mt-1 font-display text-3xl font-normal leading-[1.05]">{item.title}</DrawerTitle>
              <DrawerDescription className="mt-1.5 text-sm">
                {[item.creator, item.year].filter(Boolean).join(" · ") || "—"}
              </DrawerDescription>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <UserAvatar name={name(item.added_by)} url={profiles[item.added_by]?.avatar_url} className="size-6 text-xs" />
                <span>
                  Lo sumó <span className="text-foreground">{name(item.added_by)}</span> {ago(item.created_at)}
                </span>
              </p>
            </div>
          </div>

          {/* Done toggle */}
          <Button
            variant={item.done ? "done" : "default"}
            size="lg"
            className="mt-5 w-full"
            onClick={toggleDone}
            aria-pressed={item.done}
          >
            <Check />
            {item.done ? `${labels.done}${item.done_by ? ` · ${name(item.done_by)}` : ""}` : labels.todo}
          </Button>

          {/* Ratings */}
          <section className="mt-6 rounded-2xl border border-border bg-secondary/50 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tu nota</p>
                <div className="-ml-2.5">
                  <StarRating value={mine} onChange={rate} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grupo</p>
                <p className="font-display text-4xl leading-none text-primary">{avg ?? "–"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {itemRatings.length} voto{itemRatings.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {itemRatings.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {itemRatings.map((r) => (
                  <li key={r.user_id} className="flex items-center gap-1.5 rounded-full bg-background/60 py-1 pl-1 pr-2.5 text-xs">
                    <UserAvatar name={name(r.user_id)} url={profiles[r.user_id]?.avatar_url} className="size-6 text-xs ring-0" />
                    {name(r.user_id)} <span className="font-semibold text-primary">{r.score}★</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Comments */}
          <section className="mt-6">
            <h3 className="font-display text-2xl">Comentarios</h3>
            {thread.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nadie comentó todavía. Rompé el hielo.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {thread.map((c) => (
                  <li key={c.id} className="flex gap-3 animate-rise">
                    <UserAvatar name={name(c.user_id)} url={profiles[c.user_id]?.avatar_url} />
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold">{name(c.user_id)}</span>
                        <span className="text-[11px] text-muted-foreground">{ago(c.created_at)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{c.body}</p>
                    </div>
                    {(c.user_id === userId || isOwner) && (
                      <button
                        type="button"
                        aria-label="Borrar comentario"
                        onClick={() => deleteComment(c.id)}
                        className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={sendComment} className="mt-4 flex items-end gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                rows={1}
                placeholder="Escribí un comentario…"
                className="min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label="Enviar">
                {sending ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
            </form>
          </section>

          <div className="mt-8 flex flex-wrap gap-2">
            {item.external_url && (
              <Button asChild variant="outline" size="sm">
                <a href={item.external_url} target="_blank" rel="noreferrer">
                  <ExternalLink /> Ver ficha
                </a>
              </Button>
            )}
            {canRemove && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={removeItem}>
                <Trash2 /> Quitar de la lista
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

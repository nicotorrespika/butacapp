/**
 * Data access for lists, items, ratings and comments.
 * Reads go straight to the database through the browser client; row-level
 * security guarantees each user only sees lists they belong to.
 */
import { useEffect } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ListKind } from "@/lib/media";

export type ListRow = Tables<"lists">;
export type ItemRow = Tables<"list_items">;
export type RatingRow = Tables<"ratings">;
export type CommentRow = Tables<"comments">;
export type ProfileRow = Tables<"profiles">;
export type MemberRow = Tables<"list_members">;

export interface ListSummary extends ListRow {
  kind: ListKind;
  itemCount: number;
  memberCount: number;
  covers: string[];
}

export const keys = {
  myLists: ["lists", "mine"] as const,
  list: (id: string) => ["list", id] as const,
  items: (id: string) => ["list", id, "items"] as const,
  ratings: (id: string) => ["list", id, "ratings"] as const,
  comments: (id: string) => ["list", id, "comments"] as const,
  profile: (id: string) => ["profile", id] as const,
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ---------- My lists ---------- */

export const myListsQuery = queryOptions({
  queryKey: keys.myLists,
  queryFn: async (): Promise<ListSummary[]> => {
    const rows = unwrap(
      await supabase
        .from("lists")
        .select("*, members:list_members(count), items:list_items(count)")
        .order("updated_at", { ascending: false }),
    ) as (ListRow & { members: { count: number }[]; items: { count: number }[] })[];

    // Latest covers for each list (one small query, grouped client-side).
    const ids = rows.map((r) => r.id);
    const covers: Record<string, string[]> = {};
    if (ids.length) {
      const imgs = unwrap(
        await supabase
          .from("list_items")
          .select("list_id, image_url")
          .in("list_id", ids)
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(200),
      );
      for (const i of imgs) {
        const arr = (covers[i.list_id] ??= []);
        if (arr.length < 4 && i.image_url) arr.push(i.image_url);
      }
    }

    return rows.map((r) => ({
      ...r,
      kind: r.kind as ListKind,
      memberCount: r.members[0]?.count ?? 0,
      itemCount: r.items[0]?.count ?? 0,
      covers: covers[r.id] ?? [],
    }));
  },
});

/* ---------- One list + members ---------- */

export interface ListDetail {
  list: ListRow & { kind: ListKind };
  members: (MemberRow & { profile: ProfileRow | null })[];
  profiles: Record<string, ProfileRow>;
}

export const listQuery = (id: string) =>
  queryOptions({
    queryKey: keys.list(id),
    queryFn: async (): Promise<ListDetail> => {
      const { data: list, error } = await supabase.from("lists").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!list) throw new Error("NOT_FOUND");
      const members = unwrap(
        await supabase.from("list_members").select("*").eq("list_id", id).order("joined_at"),
      );
      const profiles = unwrap(
        await supabase.from("profiles").select("*").in("id", members.map((m) => m.user_id)),
      );
      const map = Object.fromEntries(profiles.map((p) => [p.id, p]));
      return {
        list: { ...list, kind: list.kind as ListKind },
        members: members.map((m) => ({ ...m, profile: map[m.user_id] ?? null })),
        profiles: map,
      };
    },
  });

export const itemsQuery = (id: string) =>
  queryOptions({
    queryKey: keys.items(id),
    queryFn: async () =>
      unwrap(
        await supabase.from("list_items").select("*").eq("list_id", id).order("created_at", { ascending: false }),
      ),
  });

export const ratingsQuery = (id: string) =>
  queryOptions({
    queryKey: keys.ratings(id),
    queryFn: async () => unwrap(await supabase.from("ratings").select("*").eq("list_id", id)),
  });

export const commentsQuery = (id: string) =>
  queryOptions({
    queryKey: keys.comments(id),
    queryFn: async () =>
      unwrap(
        await supabase.from("comments").select("*").eq("list_id", id).order("created_at", { ascending: true }),
      ),
  });

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: keys.profile(userId ?? "none"),
    enabled: !!userId,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Live updates: whenever a collaborator adds, marks, rates or comments,
 * refetch the affected query so everyone sees it instantly.
 */
export function useListRealtime(listId: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!listId) return;
    const filter = `list_id=eq.${listId}`;
    const channel = supabase
      .channel(`list-${listId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "list_items", filter }, () =>
        qc.invalidateQueries({ queryKey: keys.items(listId) }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "ratings", filter }, () =>
        qc.invalidateQueries({ queryKey: keys.ratings(listId) }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter }, () =>
        qc.invalidateQueries({ queryKey: keys.comments(listId) }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "list_members", filter }, () =>
        qc.invalidateQueries({ queryKey: keys.list(listId) }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, qc]);
}

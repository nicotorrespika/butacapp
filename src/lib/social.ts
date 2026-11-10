import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { SearchResult } from "./media";

export type SocialProfile = Tables<"profiles">;
export type Activity = Tables<"activity">;
export function topFive(value: unknown): SearchResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is SearchResult => !!v && typeof v === "object" && typeof v.title === "string" && typeof v.externalId === "string").slice(0, 5);
}
export const profileQuery = (id: string) => queryOptions({ queryKey: ["social", "profile", id], queryFn: async () => {
  const r = await supabase.from("profiles").select("*").eq("id", id).single(); if (r.error) throw r.error; return r.data;
}});
export const friendsQuery = (id: string) => queryOptions({ queryKey: ["social", "friends", id], queryFn: async () => {
  const r = await supabase.from("friendships").select("*").or(`sender_id.eq.${id},receiver_id.eq.${id}`).order("created_at", { ascending: false }); if (r.error) throw r.error;
  const ids = r.data.map(f => f.sender_id === id ? f.receiver_id : f.sender_id);
  const p = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [], error: null }; if(p.error) throw p.error;
  return r.data.map(f => ({ ...f, profile: p.data?.find(p => p.id === (f.sender_id === id ? f.receiver_id : f.sender_id)) }));
}});
export const watchedQuery = (id: string) => queryOptions({ queryKey: ["social", "watched", id], queryFn: async () => {
  const r = await supabase.from("watched_movies").select("*").eq("user_id", id).order("watched_at", { ascending: false }); if(r.error) throw r.error; return r.data;
}});
export const profileListsQuery = (id: string) => queryOptions({ queryKey: ["social", "lists", id], queryFn: async () => {
  const r = await supabase.from("lists").select("*").eq("owner_id", id).order("updated_at", { ascending: false }); if(r.error) throw r.error; return r.data;
}});
export function viewingStats(rows: { score_10: number | null; genres: string[] }[]) {
  const scores = rows.flatMap(r => r.score_10 === null ? [] : [r.score_10]);
  const genres = new Map<string, number>(); rows.forEach(r => r.genres.forEach(g => genres.set(g,(genres.get(g) ?? 0)+1)));
  return { watched: rows.length, average: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10 : null, genres: [...genres].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([g])=>g) };
}
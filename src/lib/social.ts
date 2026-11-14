import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { SearchResult } from "./media";
import { myListsQuery } from './queries';

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
  const r = await supabase.rpc("follow_people", { uid: id }); if (r.error) throw r.error;
  return r.data.map(p => ({id:p.id,sender_id:id,receiver_id:p.id,status:"accepted",following:p.following,follower:p.follower,profile:p}));
}});
export const watchedQuery = (id: string) => queryOptions({ queryKey: ["social", "watched", id], queryFn: async () => {
  const r = await supabase.from("movie_entries").select("*").eq("user_id", id).order("updated_at", { ascending: false }); if(r.error) throw r.error; return r.data;
}});
export const profileListsQuery = (id: string) => queryOptions({ queryKey: ["social", "lists", id], queryFn: async () => {
  const {data:{user}}=await supabase.auth.getUser();
  if(user?.id===id)return myListsQuery.queryFn();
  const r = await supabase.from("lists").select("*, items:list_items(image_url,created_at)").eq("owner_id", id).order("updated_at", { ascending: false }); if(r.error) throw r.error; return r.data.map(l=>({...l,covers:l.items.sort((a,b)=>a.created_at.localeCompare(b.created_at)).flatMap(i=>i.image_url?[i.image_url]:[]).slice(0,4)}));
}});
export function viewingStats(rows: { score_10: number | null; genres: string[] }[]) {
  const scores = rows.flatMap(r => r.score_10 === null ? [] : [r.score_10]);
  const genres = new Map<string, number>(); rows.forEach(r => r.genres.forEach(g => genres.set(g,(genres.get(g) ?? 0)+1)));
  return { watched: rows.length, average: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10 : null, genres: [...genres].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([g])=>g) };
}
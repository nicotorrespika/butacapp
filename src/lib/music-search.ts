import type { SearchResult } from "./media";
export type MusicKind = "all" | "artist" | "album" | "song";
export function musicKind(r: SearchResult): Exclude<MusicKind, "all"> {
  return r.externalId.startsWith("artist:") ? "artist" : r.externalId.startsWith("album:") ? "album" : "song";
}
export function musicText(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
export function rankMusic(items: SearchResult[], query: string) {
  const q = musicText(query); const words = q.split(" ").filter(Boolean);
  const score = (r: SearchResult) => {
    const title = musicText(r.title), artist = musicText(r.creator ?? "");
    return (title === q ? 100 : 0) + (artist === q ? 80 : 0) + words.filter(w => `${title} ${artist}`.includes(w)).length * 10;
  };
  return [...items].sort((a,b) => score(b)-score(a));
}
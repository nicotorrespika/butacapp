import { describe, expect, it } from "vitest";
import { musicKind, musicText, rankMusic } from "./music-search";
import type { SearchResult } from "./media";
const result = (title: string, id: string): SearchResult => ({source:"deezer",externalId:id,mediaType:"music",title,creator:"Bryan Adams",year:null,imageUrl:null,kindLabel:"Canción",externalUrl:null});
describe("music search",()=>{
  it("normalizes case and accents",()=>expect(musicText("MÚSICA")).toBe("musica"));
  it("prioritizes exact Summer of 69 title",()=>expect(rankMusic([result("Summer concert","song:2"),result("Summer of '69","song:1")],"Summer of 69")[0]?.externalId).toBe("song:1"));
  it("separates artist album and song results",()=>expect(["artist:1","album:2","song:3"].map(id=>musicKind(result("Bryan Adams",id)))).toEqual(["artist","album","song"]));
});
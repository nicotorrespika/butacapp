import { describe, expect, it } from "vitest";
import { sharePath, shareResult, shareUrl, whatsappUrl, parseSharedCard } from "./sharing";
describe("sharing", () => {
  it("uses a stable public movie link rather than the protected page", () => {
    expect(shareUrl({ kind: "movie", id: "movie-7345" })).toBe("https://butacapp.lovable.app/compartir/movie/movie-7345");
  });
  it("WhatsApp includes the title and content link", () => {
    const url = new URL(whatsappUrl({ kind: "movie", id: "movie-7345", title: "Medianoche en París" }));
    expect(url.searchParams.get("text")).toBe("Mirá esta peli en MOMENTO BUTACA: Medianoche en París https://butacapp.lovable.app/compartir/movie/movie-7345");
  });
  it("keeps book identifiers inside one URL segment", () => {
    const ref = shareResult({ source:"openlibrary", externalId:"/works/OL123W",mediaType:"book",title:"Libro",creator:null,year:null,imageUrl:null,kindLabel:"Libro",externalUrl:null });
    expect(decodeURIComponent(sharePath(ref).split("/").at(-1) ?? "")).toBe("openlibrary~%2Fworks%2FOL123W");
  });
  it("validates received cards without accepting executable image URLs", () => {
    expect(parseSharedCard({kind:"movie",id:"movie-7345",title:"Medianoche",image:"javascript:alert(1)"})).toBeNull();
  });
});
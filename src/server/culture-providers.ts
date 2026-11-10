import type { SearchResult } from "@/lib/media";
import type { CultureDetail, CultureType } from "@/lib/culture";
import { getJson, searchMusic } from "./search-providers";
import { parseQuery } from "@/lib/search-query";
interface BookHit { key: string; title: string; author_name?: string[]; first_publish_year?: number; cover_i?: number; }
export async function searchBooks(query: string): Promise<SearchResult[]> {
  const data = await getJson<{ docs: BookHit[] }>(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=24&fields=key,title,author_name,first_publish_year,cover_i`);
  return data.docs.map(b => ({ source: "openlibrary", externalId: b.key, mediaType: "book", title: b.title, creator: b.author_name?.join(" · ") ?? null, year: b.first_publish_year ?? null, imageUrl: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null, kindLabel: "Libro", externalUrl: `https://openlibrary.org${b.key}` }));
}
export async function searchCulture(type: CultureType, query: string) { return type === "book" ? searchBooks(query) : searchMusic(parseQuery(query)); }
const text = (v: unknown): string | null => typeof v === "string" ? v : v && typeof v === "object" && "value" in v && typeof v.value === "string" ? v.value : null;
export async function cultureDetail(source: string, id: string): Promise<CultureDetail> {
  if (source === "openlibrary" && /^\/works\/OL\d+W$/.test(id)) {
    const b = await getJson<{title:string;description?:unknown;subjects?:string[];covers?:number[];authors?:{author:{key:string}}[]}>(`https://openlibrary.org${id}.json`);
    const [authors, editions] = await Promise.all([Promise.all((b.authors ?? []).slice(0,5).map(async a => { try { return (await getJson<{name:string}>(`https://openlibrary.org${a.author.key}.json`)).name; } catch { return null; } })), getJson<{entries:{publish_date?:string;number_of_pages?:number;publishers?:string[];key:string}[]}>(`https://openlibrary.org${id}/editions.json?limit=20`).catch(()=>({entries:[]}))]);
    const edition = editions.entries.find(e => !!e.number_of_pages) ?? editions.entries[0];
    return {result:{source,externalId:id,mediaType:"book",title:b.title,creator:authors.filter(Boolean).join(" · ") || null,year:null,imageUrl:b.covers?.[0]?`https://covers.openlibrary.org/b/id/${b.covers[0]}-L.jpg`:null,kindLabel:"Libro",externalUrl:`https://openlibrary.org${id}`},description:text(b.description),genres:(b.subjects ?? []).slice(0,8),pages:edition?.number_of_pages ?? null,publisher:edition?.publishers?.join(" · ") ?? null,tracks:[],links:[{label:"Open Library · ediciones y acceso",url:`https://openlibrary.org${edition?.key ?? id}`} ]};
  }
  if (source === "itunes" && /^(album|song):\d+$/.test(id)) {
    const data = await getJson<{results:{wrapperType?:string;collectionId?:number;collectionName?:string;trackName?:string;artistName?:string;releaseDate?:string;artworkUrl100?:string;primaryGenreName?:string;collectionViewUrl?:string;trackViewUrl?:string;trackTimeMillis?:number;previewUrl?:string}[]}>(`https://itunes.apple.com/lookup?id=${id.split(":")[1]}&entity=song&country=AR`);
    const b=data.results[0]; if(!b)throw new Error("No disponible");
    return {result:{source,externalId:id,mediaType:"music",title:(id.startsWith("song")?b.trackName:b.collectionName) ?? b.collectionName ?? b.trackName ?? "Sin título",creator:b.artistName ?? null,year:b.releaseDate?Number(b.releaseDate.slice(0,4)):null,imageUrl:b.artworkUrl100?.replace(/\/\d+x\d+bb\./,"/600x600bb.") ?? null,kindLabel:id.startsWith("album")?"Álbum":"Canción",externalUrl:b.collectionViewUrl ?? b.trackViewUrl ?? null},description:null,genres:b.primaryGenreName?[b.primaryGenreName]:[],pages:null,publisher:null,tracks:data.results.filter(t=>t.wrapperType==="track").map(t=>({title:t.trackName ?? "Sin título",duration:t.trackTimeMillis?Math.round(t.trackTimeMillis/1000):null,preview:t.previewUrl ?? null})),links:b.collectionViewUrl?[{label:"Apple Music",url:b.collectionViewUrl}]:[]};
  }
  throw new Error("Ficha no disponible");
}
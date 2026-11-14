import { normalizeTitle } from "@/lib/culture";
import type { SearchResult } from "@/lib/media";
import type { CultureDetail, CultureType } from "@/lib/culture";
import { getJson, searchMusic } from "./search-providers";
import { parseQuery } from "@/lib/search-query";
import { deezerDetail, musicBrainzDetail, searchDeezer,artistCatalog,artistSpotify } from "./music-providers";
import type {ArtistAlbum} from '@/lib/artist-discography';
interface BookHit { key: string; title: string; author_name?: string[]; first_publish_year?: number; cover_i?: number; }
export async function searchBooks(query: string): Promise<SearchResult[]> {
  const data = await getJson<{ docs: BookHit[] }>(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=24&fields=key,title,author_name,first_publish_year,cover_i`);
  return data.docs.map(b => ({ source: "openlibrary", externalId: b.key, mediaType: "book", title: b.title, creator: b.author_name?.join(" · ") ?? null, year: b.first_publish_year ?? null, imageUrl: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null, kindLabel: "Libro", externalUrl: `https://openlibrary.org${b.key}` }));
}
export async function searchCulture(type: CultureType, query: string) { return type === "book" ? searchBooks(query) : searchMusic(parseQuery(query)); }
const text = (v: unknown): string | null => typeof v === "string" ? v : v && typeof v === "object" && "value" in v && typeof v.value === "string" ? v.value : null;
export async function cultureDetail(source: string, id: string): Promise<CultureDetail> {
  if (source === "deezer") return deezerDetail(id);
  if (source === "musicbrainz") return musicBrainzDetail(id);
  if (source === "openlibrary" && /^\/works\/OL\d+W$/.test(id)) {
    const b = await getJson<{title:string;description?:unknown;subjects?:string[];covers?:number[];authors?:{author:{key:string}}[]}>(`https://openlibrary.org${id}.json`);
    const [authors, editions] = await Promise.all([Promise.all((b.authors ?? []).slice(0,5).map(async a => { try { return (await getJson<{name:string}>(`https://openlibrary.org${a.author.key}.json`)).name; } catch { return null; } })), getJson<{entries:{publish_date?:string;number_of_pages?:number;publishers?:string[];key:string}[]}>(`https://openlibrary.org${id}/editions.json?limit=20`).catch(()=>({entries:[]}))]);
    const edition = editions.entries.find(e => !!e.number_of_pages) ?? editions.entries[0];
    const author = authors.filter(Boolean)[0] ?? "";
    const [olr, gb] = await Promise.all([
      getJson<{summary?:{average?:number|null;count?:number}}>(`https://openlibrary.org${id}/ratings.json`).catch(()=>null),
      getJson<{items?:{volumeInfo?:{title?:string;authors?:string[];averageRating?:number;ratingsCount?:number};accessInfo?:{viewability?:string;embeddable?:boolean;webReaderLink?:string}}[]}>(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`intitle:${b.title} inauthor:${author}`)}&maxResults=5`).catch(()=>null),
    ]);
    // Only exact title/author matches count; previews are publisher-authorized Google Books samples.
    const gbMatch = (gb?.items ?? []).filter(i => normalizeTitle(i.volumeInfo?.title ?? "") === normalizeTitle(b.title) && (i.volumeInfo?.authors ?? []).some(a => normalizeTitle(a) === normalizeTitle(author)));
    const readable = gbMatch.find(i => i.accessInfo?.embeddable && (i.accessInfo.viewability === "PARTIAL" || i.accessInfo.viewability === "ALL_PAGES") && i.accessInfo.webReaderLink);
    const rated = gbMatch.find(i => i.volumeInfo?.averageRating && i.volumeInfo.ratingsCount);
    const ratings: {source:string;value:number;count:number}[] = [];
    if (olr?.summary?.average && olr.summary.count) ratings.push({source:"Open Library",value:Math.round(olr.summary.average*20)/10,count:olr.summary.count});
    if (rated?.volumeInfo?.averageRating && rated.volumeInfo.ratingsCount) ratings.push({source:"Google Books",value:Math.round(rated.volumeInfo.averageRating*20)/10,count:rated.volumeInfo.ratingsCount});
    const preview = readable?.accessInfo?.webReaderLink ? {label: readable.accessInfo.viewability === "ALL_PAGES" ? "Leer gratis (Google Books)" : "Leer las primeras páginas (Google Books)", url: readable.accessInfo.webReaderLink} : null;
    return {preview,ratings,result:{source,externalId:id,mediaType:"book",title:b.title,creator:authors.filter(Boolean).join(" · ") || null,year:null,imageUrl:b.covers?.[0]?`https://covers.openlibrary.org/b/id/${b.covers[0]}-L.jpg`:null,kindLabel:"Libro",externalUrl:`https://openlibrary.org${id}`},description:text(b.description),genres:(b.subjects ?? []).slice(0,8),pages:edition?.number_of_pages ?? null,publisher:edition?.publishers?.join(" · ") ?? null,tracks:[],links:[{label:"Open Library · ediciones y acceso",url:`https://openlibrary.org${edition?.key ?? id}`} ]};
  }
  if (source === "itunes" && /^(album|song):\d+$/.test(id)) {
    const data = await getJson<{results:{wrapperType?:string;collectionId?:number;collectionName?:string;trackName?:string;artistName?:string;releaseDate?:string;artworkUrl100?:string;primaryGenreName?:string;collectionViewUrl?:string;trackViewUrl?:string;trackTimeMillis?:number;previewUrl?:string}[]}>(`https://itunes.apple.com/lookup?id=${id.split(":")[1]}&entity=song&country=AR`);
    const b=data.results[0]; if(!b)throw new Error("No disponible");
    return {result:{source,externalId:id,mediaType:"music",title:(id.startsWith("song")?b.trackName:b.collectionName) ?? b.collectionName ?? b.trackName ?? "Sin título",creator:b.artistName ?? null,year:b.releaseDate?Number(b.releaseDate.slice(0,4)):null,imageUrl:b.artworkUrl100?.replace(/\/\d+x\d+bb\./,"/600x600bb.") ?? null,kindLabel:id.startsWith("album")?"Álbum":"Canción",externalUrl:b.collectionViewUrl ?? b.trackViewUrl ?? null},description:null,genres:b.primaryGenreName?[b.primaryGenreName]:[],pages:null,publisher:null,tracks:data.results.filter(t=>t.wrapperType==="track").map(t=>({title:t.trackName ?? "Sin título",duration:t.trackTimeMillis?Math.round(t.trackTimeMillis/1000):null,preview:t.previewUrl ?? null})),links:b.collectionViewUrl?[{label:"Apple Music",url:b.collectionViewUrl}]:[]};
  }
  throw new Error("Ficha no disponible");
}
export type CreatorData = { name: string; type: CultureType; bio: string | null; photo: string | null; years: string | null; works: ArtistAlbum[];spotifyUrl?:string|null;topTracks?:(SearchResult & {duration:number|null;preview:string|null})[] };
/** Body of work for an author (Open Library) or artist (iTunes albums), filtered to exact creator matches. */
export async function creatorWorks(type: CultureType, name: string): Promise<CreatorData> {
  const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(name);
  if (type === "book") {
    const [books, authors] = await Promise.all([
      getJson<{ docs: BookHit[] }>(`https://openlibrary.org/search.json?author=${encodeURIComponent(name)}&sort=editions&limit=40&fields=key,title,author_name,first_publish_year,cover_i`),
      getJson<{ docs: { key: string; name: string; birth_date?: string; death_date?: string }[] }>(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(name)}&limit=5`).catch(() => ({ docs: [] })),
    ]);
    const a = authors.docs.find(x => norm(x.name) === target) ?? authors.docs[0];
    let bio: string | null = null;
    if (a) { try { const d = await getJson<{ bio?: string | { value: string } }>(`https://openlibrary.org/authors/${a.key}.json`); bio = typeof d.bio === "string" ? d.bio : d.bio?.value ?? null; } catch { /* bio optional */ } }
    const seen = new Set<string>();
    const works = books.docs.filter(b => b.author_name?.some(n => norm(n) === target || norm(n).includes(target)) && !seen.has(norm(b.title)) && (seen.add(norm(b.title)), true)).map(b => ({ source: "openlibrary", externalId: b.key, mediaType: "book" as const, title: b.title, creator: b.author_name?.join(" · ") ?? null, year: b.first_publish_year ?? null, imageUrl: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null, kindLabel: "Libro", externalUrl: `https://openlibrary.org${b.key}` })).sort((x, y) => (x.year ?? 9999) - (y.year ?? 9999));
    return { name: a?.name ?? name, type, bio: bio?.slice(0, 1200) ?? null, photo: a ? `https://covers.openlibrary.org/a/olid/${a.key}-M.jpg?default=false` : null, years: a?.birth_date ? `${a.birth_date}${a.death_date ? ` – ${a.death_date}` : ""}` : null, works };
  }
  const [catalog,spotifyUrl]=await Promise.all([artistCatalog(name).catch(()=>null),artistSpotify(name)]);
  if(catalog)return {...catalog,type,bio:null,years:null,spotifyUrl};
  const deezerWorks = (await searchDeezer(name)).filter(r => r.externalId.startsWith("album:") && norm(r.creator ?? "") === target);
  if (deezerWorks.length) return { name, type, bio: null, photo: deezerWorks[0]?.imageUrl ?? null, years: null, works: deezerWorks,spotifyUrl };
  const url = `https://itunes.apple.com/search?country=US&media=music&entity=album&attribute=artistTerm&limit=60&term=${encodeURIComponent(name)}`;
  const r = await getJson<{ results: { collectionId?: number; collectionName?: string; artistName?: string; releaseDate?: string; artworkUrl100?: string; collectionViewUrl?: string }[] }>(url);
  const seen = new Set<string>();
  const works = r.results.filter(x => norm(x.artistName ?? "") === target && x.collectionName && !seen.has(norm(x.collectionName.replace(/\(.*?\)|- single|- ep/gi, ""))) && (seen.add(norm(x.collectionName.replace(/\(.*?\)|- single|- ep/gi, ""))), true)).map(x => ({ source: "itunes", externalId: `album:${x.collectionId}`, mediaType: "music" as const, title: x.collectionName ?? "Sin título", creator: x.artistName ?? null, year: x.releaseDate ? Number(x.releaseDate.slice(0, 4)) : null, imageUrl: x.artworkUrl100?.replace(/\/\d+x\d+bb\./, "/600x600bb.") ?? null, kindLabel: "Álbum", externalUrl: x.collectionViewUrl ?? null })).sort((x, y) => (x.year ?? 9999) - (y.year ?? 9999));
  return { name: works[0]?.creator ?? name, type, bio: null, photo: works[works.length - 1]?.imageUrl ?? null, years: null, works,spotifyUrl };
}

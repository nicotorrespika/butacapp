import type { SearchResult } from "@/lib/media";
import type { CultureDetail } from "@/lib/culture";
import { rankMusic } from "@/lib/music-search";
type DeezerItem = {id:number;name?:string;title?:string;link?:string;picture_medium?:string;cover_medium?:string;cover_big?:string;release_date?:string;duration?:number;preview?:string;artist?:{id:number;name:string;picture_medium?:string};album?:{id:number;title:string;cover_medium?:string};genres?:{data:{name:string}[]};label?:string;tracks?:{data:DeezerItem[]}};
async function deezer<T>(path: string): Promise<T> {
  const r = await fetch(`https://api.deezer.com/${path}`,{signal:AbortSignal.timeout(6500)});
  if(!r.ok) throw new Error(`Deezer ${r.status}`);
  const data=await r.json() as T & {error?:unknown};
  if(data.error) throw new Error("Deezer no disponible");
  return data;
}
function map(d:DeezerItem,kind:"artist"|"album"|"song"):SearchResult {
  return {source:"deezer",externalId:`${kind}:${d.id}`,mediaType:"music",title:d.title??d.name??"Sin título",creator:kind==="artist"?d.name??null:d.artist?.name??null,year:d.release_date?Number(d.release_date.slice(0,4)):null,imageUrl:d.picture_medium??d.cover_medium??d.album?.cover_medium??null,kindLabel:kind==="artist"?"Artista":kind==="album"?"Álbum":"Canción",externalUrl:d.link??`https://www.deezer.com/${kind==="song"?"track":kind}/${d.id}`};
}
export async function searchDeezer(query:string):Promise<SearchResult[]> {
  const pools=await Promise.all((["artist","album","track"] as const).map(async type=>{
    try { const r=await deezer<{data:DeezerItem[]}>(`search/${type}?q=${encodeURIComponent(query)}&limit=18`);return (r.data??[]).map(x=>map(x,type==="track"?"song":type)); }
    catch(e){console.warn(`[music] Deezer ${type} unavailable`, e instanceof Error?e.message:"provider");return [];}
  }));
  return rankMusic(pools.flat(),query);
}
// Serialize MusicBrainz requests within each Worker; no parallel requests to this provider.
let mbQueue:Promise<unknown>=Promise.resolve(); let mbLast=0;
export function musicBrainz<T>(path:string):Promise<T> {
  const job=mbQueue.catch(()=>{}).then(async()=>{
    const delay=Math.max(0,1000-(Date.now()-mbLast));if(delay)await new Promise(r=>setTimeout(r,delay));mbLast=Date.now();
    const r=await fetch(`https://musicbrainz.org/ws/2/${path}`,{headers:{"User-Agent":"BUTACAPP/1.0 (https://butacapp.lovable.app)",Accept:"application/json"},signal:AbortSignal.timeout(6500)});
    if(!r.ok)throw new Error(`MusicBrainz ${r.status}`);return await r.json() as T;
  }); mbQueue=job;return job;
}
export async function searchMusicBrainz(query:string):Promise<SearchResult[]> {
  const r=await musicBrainz<{recordings:{id:string;title:string;"artist-credit"?:{name:string}[];releases?:{id:string;date?:string;title:string}[]}[]}>(`recording?query=${encodeURIComponent(query)}&fmt=json&limit=18`);
  return (r.recordings??[]).map(x=>({source:"musicbrainz",externalId:`song:${x.id}`,mediaType:"music",title:x.title,creator:x["artist-credit"]?.map(a=>a.name).join(" · ")??null,year:x.releases?.[0]?.date?Number(x.releases[0].date.slice(0,4)):null,imageUrl:x.releases?.[0]?`https://coverartarchive.org/release/${x.releases[0].id}/front-250`:null,kindLabel:"Canción",externalUrl:`https://musicbrainz.org/recording/${x.id}`}));
}
export async function deezerDetail(id:string):Promise<CultureDetail> {
  const [kind,num]=id.split(":");if(!/^(artist|album|song)$/.test(kind??"")||!/^\d+$/.test(num??""))throw new Error("Invalid music ID");
  const d=await deezer<DeezerItem>(`${kind==="song"?"track":kind}/${num}`);
  let tracks=d.tracks?.data??[];if(kind==="song")tracks=[d];
  return {result:map(d,kind as "artist"|"album"|"song"),description:null,genres:d.genres?.data.map(g=>g.name)??[],pages:null,publisher:d.label??null,tracks:tracks.map(t=>({title:t.title??"Sin título",duration:t.duration??null,preview:t.preview??null})),links:[{label:"Deezer",url:d.link??`https://www.deezer.com/${kind==="song"?"track":kind}/${num}`}]};
}
export async function musicBrainzDetail(id:string):Promise<CultureDetail> {
  const [kind,num]=id.split(":");if(kind!=="song"||!num||!/^[a-f0-9-]{36}$/.test(num))throw new Error("Invalid music ID");
  const d=await musicBrainz<{title:string;"artist-credit"?:{name:string}[];releases?:{id:string;date?:string}[];genres?:{name:string}[]}>(`recording/${num}?inc=artists+releases+genres&fmt=json`);
  return {result:{source:"musicbrainz",externalId:id,mediaType:"music",title:d.title,creator:d["artist-credit"]?.map(a=>a.name).join(" · ")??null,year:d.releases?.[0]?.date?Number(d.releases[0].date.slice(0,4)):null,imageUrl:d.releases?.[0]?`https://coverartarchive.org/release/${d.releases[0].id}/front-250`:null,kindLabel:"Canción",externalUrl:`https://musicbrainz.org/recording/${num}`},description:null,genres:d.genres?.map(g=>g.name)??[],pages:null,publisher:null,tracks:[],links:[{label:"MusicBrainz",url:`https://musicbrainz.org/recording/${num}`}]};
}
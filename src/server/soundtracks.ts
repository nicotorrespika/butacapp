import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "@/integrations/supabase/types";
import {getJson,tmdbFetcher} from "./search-providers";
import {cultureDetail,searchCulture} from "./culture-providers";
import {normalizeTitle} from "@/lib/culture";
import type {SearchResult} from "@/lib/media";
type DB=SupabaseClient<Database>;
export async function collectSoundtrack(db:DB,id:string,key:string){
  const ref=/^movie-(\d+)$/.exec(id);if(!ref)return;
  const m=await tmdbFetcher(key)<{title:string;original_title:string;release_date?:string;poster_path?:string;imdb_id?:string}>(`/movie/${ref[1]}`);
  const year=Number(m.release_date?.slice(0,4))||null;
  const query=`releasegroup:"${m.original_title.replace(/["\\]/g,"")}" AND secondarytype:soundtrack`;
  const found=await getJson<{"release-groups":{id:string;title:string;"secondary-types"?:string[];"artist-credit"?:{name:string}[]}[]}>(`https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(query)}&fmt=json&limit=8`,{headers:{"User-Agent":"BUTACAPP/1.0 (https://butacapp.lovable.app)"}}).catch(()=>({"release-groups":[]}));
  const groups=found["release-groups"].filter(g=>g["secondary-types"]?.includes("Soundtrack")&&normalizeTitle(g.title).includes(normalizeTitle(m.original_title)));
  if(!groups.length){
    const candidates=await searchCulture("music",`${m.original_title} soundtrack`);
    const official=candidates.find(r=>r.externalId.startsWith("album:")&&normalizeTitle(r.title).startsWith(normalizeTitle(m.original_title))&&/motion picture|original.*soundtrack|banda sonora/i.test(r.title));
    if(official?.externalUrl)groups.push({id:"",title:official.title,"secondary-types":["Soundtrack"]});
  }
  const stored:SearchResult[]=[];
  for(const g of groups.slice(0,3)){
    const candidates=await searchCulture("music",`${g.title} soundtrack`);const album=candidates.find(r=>r.externalId.startsWith("album:")&&normalizeTitle(r.title).includes(normalizeTitle(m.original_title))&&(!year||!r.year||Math.abs(r.year-year)<=2));
    const resolved=album ?? candidates.find(r=>r.externalId.startsWith("album:")&&normalizeTitle(r.title)===normalizeTitle(g.title));
    if(!resolved)continue;
    const sourceUrl=g.id?`https://musicbrainz.org/release-group/${g.id}`:resolved.externalUrl;stored.push(resolved);
    const tracks=await getJson<{results:{trackId?:number;trackName?:string;artistName?:string;artworkUrl100?:string;releaseDate?:string}[]}>(`https://itunes.apple.com/lookup?id=${resolved.externalId.split(":")[1]}&entity=song&country=AR`);
    const songs:SearchResult[]=tracks.results.flatMap(t=>t.trackId&&t.trackName?[{source:"itunes",externalId:`song:${t.trackId}`,mediaType:"music",title:t.trackName,creator:t.artistName ?? null,year:resolved.year,imageUrl:t.artworkUrl100?.replace("100x100","600x600") ?? resolved.imageUrl,kindLabel:"Canción",externalUrl:null}]:[]);
    const rows=[resolved,...songs].map(r=>({movie_id:id,movie_title:m.title,movie_poster:m.poster_path?`https://image.tmdb.org/t/p/w342${m.poster_path}`:null,source:r.source,external_id:r.externalId,title:r.title,artist:r.creator,year:r.year,image_url:r.imageUrl,kind:r.externalId.startsWith("album:")?"album":"song",source_url:sourceUrl,confidence:"verified"}));
    const save=await db.from("movie_soundtracks").upsert(rows,{onConflict:"movie_id,source,external_id",ignoreDuplicates:true});if(save.error)throw save.error;
  }
  await db.from("soundtrack_updates").upsert({movie_id:id,updated_at:new Date().toISOString()});
}
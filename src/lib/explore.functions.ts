import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { cachedCatalog } from "@/server/catalog-cache";
import { getJson, mapTmdb, tmdbFetcher, type TmdbItem } from "@/server/search-providers";
import { searchBooks, searchCulture } from "@/server/culture-providers";
import type { SearchResult } from "./media";
import { musicGenre } from "@/server/music-providers";
export const exploreGenre=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({type:z.enum(["movie","music","book"]),genre:z.string().trim().min(1).max(150)}).parse(input)).handler(async({data,context})=>{
  const key=process.env["TMDB_API_KEY"];
  return cachedCatalog(context.supabase,`explore:v1:${data.type}:${data.genre.toLowerCase()}`,async():Promise<SearchResult[]>=>{
    if(data.type==="movie"){
      if(!key)throw new Error("Cine no disponible");const tmdb=tmdbFetcher(key);
      const genres=await tmdb<{genres:{id:number;name:string}[]}>("/genre/movie/list");
      const genre=genres.genres.find(g=>g.name.toLowerCase()===data.genre.toLowerCase());
      const r=await tmdb<{results:TmdbItem[]}>("/discover/movie",{with_genres:genre?.id,with_origin_country:data.genre.toLowerCase().includes("argentin")?"AR":undefined,sort_by:"popularity.desc","vote_count.gte":20});
      return r.results.map(x=>mapTmdb(x,"movie"));
    }
    if(data.type==="book"&&/autores argentinos/i.test(data.genre)){
      const r=await getJson<{docs:{author_key?:string[];author_name?:string[];title:string}[]}>("https://openlibrary.org/search.json?subject=argentine_fiction&limit=40&fields=author_key,author_name,title");
      const seen=new Set<string>();
      return r.docs.flatMap(b=>(b.author_key??[]).flatMap((id,i)=>{const name=b.author_name?.[i];if(!name||seen.has(id))return [];seen.add(id);return [{source:"openlibrary",externalId:`author:${id}`,mediaType:"book" as const,title:name,creator:b.title,year:null,imageUrl:`https://covers.openlibrary.org/a/olid/${id}-M.jpg`,kindLabel:"Autor",externalUrl:`https://openlibrary.org/authors/${id}`}];}));
    }
    if(data.type==="book") return searchBooks(/novelas argentinas/i.test(data.genre)?"subject:argentine_fiction":`subject:${data.genre}`);
    return musicGenre(data.genre);
  },3);
});
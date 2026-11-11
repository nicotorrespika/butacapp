import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { cachedCatalog } from "@/server/catalog-cache";
import { getJson, mapTmdb, tmdbFetcher, type TmdbItem } from "@/server/search-providers";
import { searchBooks, searchCulture } from "@/server/culture-providers";
import type { SearchResult } from "./media";
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
      const r=await getJson<{docs:{key:string;name:string;top_work?:string}[]}>("https://openlibrary.org/search/authors.json?q=Argentina&limit=24");
      return r.docs.map(a=>({source:"openlibrary",externalId:`author:${a.key}`,mediaType:"book",title:a.name,creator:a.top_work??null,year:null,imageUrl:`https://covers.openlibrary.org/a/olid/${a.key}-M.jpg`,kindLabel:"Autor",externalUrl:`https://openlibrary.org/authors/${a.key}`}));
    }
    if(data.type==="book") return searchBooks(/novelas argentinas/i.test(data.genre)?"subject:argentine_fiction":`subject:${data.genre}`);
    return (await searchCulture("music",data.genre)).filter(r=>!r.externalId.startsWith("artist:"));
  },3);
});
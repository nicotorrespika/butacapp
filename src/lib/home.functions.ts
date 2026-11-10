import { createServerFn } from "@tanstack/react-start";
import { tmdbFetcher, TMDB_IMG, type TmdbItem } from "@/server/search-providers";
export const getHomePosters=createServerFn({method:"GET"}).handler(async()=>{
 const key=process.env["TMDB_API_KEY"];if(!key)return [];
 try{const tmdb=tmdbFetcher(key);const pages=await Promise.all([tmdb<{results:TmdbItem[]}>("/movie/popular"),tmdb<{results:TmdbItem[]}>("/movie/top_rated")]);return [...new Set(pages.flatMap(p=>p.results.flatMap(m=>m.poster_path?[`${TMDB_IMG}${m.poster_path}`]:[])))];}catch{return [];}
});
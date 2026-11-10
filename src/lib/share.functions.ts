import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { shareRefSchema } from "./sharing";
import { parseCultureId } from "./culture";
import type { Database } from "@/integrations/supabase/types";

export const getPublicShare = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => shareRefSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      if (data.kind === "movie") {
        const key = process.env["TMDB_API_KEY"];
        if (!key) return null;
        const { tmdbFetcher } = await import("@/server/search-providers");
        const tmdb = tmdbFetcher(key);
        let match: string[] | null = /^(movie|tv)-(\d+)$/.exec(data.id);
        if (!match && /^tt\d{5,10}$/.test(data.id)) {
          const found = await tmdb<{ movie_results: {id:number}[]; tv_results: {id:number}[] }>(`/find/${data.id}`, { external_source:"imdb_id" });
          const hit = found.movie_results[0] ?? found.tv_results[0];
          if (hit) match = ["", found.movie_results[0] ? "movie" : "tv", String(hit.id)];
        }
        if (!match) return null;
        const m = await tmdb<{title?:string;name?:string;release_date?:string;first_air_date?:string;overview?:string;poster_path?:string}>(`/${match[1]}/${match[2]}`);
        return { title:m.title ?? m.name ?? "Película", description:m.overview?.slice(0,280) ?? "", image:m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null, year:Number((m.release_date ?? m.first_air_date ?? "").slice(0,4)) || null, category:match[1] === "tv" ? "Serie" : "Película" };
      }
      if (data.kind === "culture") {
        const { cultureDetail } = await import("@/server/culture-providers");
        const id = parseCultureId(data.id);
        const d = await cultureDetail(id.source,id.externalId);
        return {title:d.result.title,description:d.description?.slice(0,280) ?? d.result.creator ?? "",image:d.result.imageUrl,year:d.result.year,category:d.result.kindLabel};
      }
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
      const url = process.env["SUPABASE_URL"];
      if (!key || !url) return null;
      const client = createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey",key); return fetch(input,{...init,headers});
      }}});
      const r = await client.rpc("public_share_summary",{k:data.kind,cid:data.id});
      if (r.error) return null;
      const parsed = z.object({title:z.string(),description:z.string().nullable(),image:z.string().nullable(),year:z.number().nullable(),category:z.string()}).safeParse(r.data);
      return parsed.success ? parsed.data : null;
    } catch { return null; }
  });
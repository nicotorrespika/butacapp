import { z } from "zod";
export const reviewSchema=z.object({source:z.string(),url:z.string(),summary:z.string(),score:z.string().nullable()});
export const researchSchema=z.object({reviews:z.array(reviewSchema)});
export type MovieReview=z.infer<typeof reviewSchema>;
export const reviewDomains=["imdb.com","rottentomatoes.com","metacritic.com","pagina12.com.ar","otroscines.com","micropsiacine.com","lacion.com.ar","lanacion.com.ar","clarin.com","cinesargentinos.com.ar","escribiendocine.com","hacerselacritica.com","conlosojosabiertos.com"];
export function validReviewUrl(url:string){try{const u=new URL(url);return u.protocol==="https:"&&reviewDomains.some(d=>u.hostname===d||u.hostname.endsWith(`.${d}`));}catch{return false;}}
export function verifiedReviews(value:unknown,urls:string[]):MovieReview[]{const parsed=researchSchema.safeParse(value);if(!parsed.success)return [];const allowed=new Set(urls);const seen=new Set<string>();return parsed.data.reviews.filter(r=>allowed.has(r.url)&&validReviewUrl(r.url)&&!seen.has(r.url)&&(seen.add(r.url),true)).map(r=>({...r,summary:r.summary.slice(0,280)})).slice(0,8);}
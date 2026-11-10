import type { SearchResult } from "./media";
export type BettyMovie={result:SearchResult;reason:string};
export type BettyResponse={ok:true;movies:BettyMovie[];historyId:string;threadId:string}|{ok:false;message:string;retryable:boolean};
export const catalogId=(id:string)=>id.replace(":","-");
export function verifiedUnique(movies:BettyMovie[],excluded:string[]=[]){const seen=new Set(excluded.map(catalogId));return movies.filter(m=>{const id=catalogId(m.result.externalId);if(seen.has(id))return false;seen.add(id);return true;}).slice(0,8);}
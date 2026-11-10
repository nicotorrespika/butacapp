import type { SearchResult } from "./media";
export type BettyMovie={result:SearchResult;reason:string};
export type BettyResponse={ok:true;movies:BettyMovie[];historyId:string;threadId:string}|{ok:false;message:string;retryable:boolean};
export function verifiedUnique(movies:BettyMovie[],excluded:string[]=[]){const seen=new Set(excluded);return movies.filter(m=>{if(seen.has(m.result.externalId))return false;seen.add(m.result.externalId);return true;}).slice(0,8);}
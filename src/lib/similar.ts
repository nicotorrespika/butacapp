import type {SearchResult} from "./media";
export const LATIN_COUNTRIES=["AR","MX","CL","UY","CO","PE","BR","VE","BO","EC","PY","CU","CR","PA","GT","HN","SV","NI","DO","HT","PR"];
export const countryLabels:Record<string,string>={AR:"Argentina",MX:"México",CL:"Chile",UY:"Uruguay",CO:"Colombia",PE:"Perú",BR:"Brasil",VE:"Venezuela",BO:"Bolivia",EC:"Ecuador",PY:"Paraguay",CU:"Cuba",CR:"Costa Rica",PA:"Panamá",GT:"Guatemala",HN:"Honduras",SV:"El Salvador",NI:"Nicaragua",DO:"República Dominicana",HT:"Haití",PR:"Puerto Rico",GB:"Reino Unido",US:"Estados Unidos",FR:"Francia",DE:"Alemania",ES:"España"};
export type SimilarItem={result:SearchResult;country:string|null;estimated:boolean;reason:string};
export type SimilarData={similar:SimilarItem[];latin:SimilarItem[];origin:string|null;originEstimated:boolean};
export function isLatin(country:string|null){return !!country&&LATIN_COUNTRIES.includes(country);}
export function regionalOrder(items:SimilarItem[],original:string|null){
  const seen=new Set<string>();return items.filter(i=>isLatin(i.country)&&i.country!==original&&!seen.has(`${i.result.source}:${i.result.externalId}`)&&(seen.add(`${i.result.source}:${i.result.externalId}`),true)).sort((a,b)=>(a.country==="AR"?0:1)-(b.country==="AR"?0:1));
}
export type MovieSignals={genres?:{id:number;name:string}[];keywords?:{keywords?:{id:number;name:string}[];results?:{id:number;name:string}[]}};
export function movieKeywords(movie:MovieSignals){return movie.keywords?.keywords ?? movie.keywords?.results ?? [];}
/** Format is a hard constraint for animation; location alone never establishes similarity. */
export function movieAffinity(anchor:MovieSignals,candidate:MovieSignals){
  const sharedGenres=(candidate.genres ?? []).filter(g=>anchor.genres?.some(a=>a.id===g.id));
  const sharedThemes=movieKeywords(candidate).filter(k=>movieKeywords(anchor).some(a=>a.id===k.id));
  if(anchor.genres?.some(g=>g.id===16)&&!candidate.genres?.some(g=>g.id===16))return null;
  if(!sharedGenres.length&&!sharedThemes.length)return null;
  const distinctive=sharedGenres.filter(g=>![16,18,10751].includes(g.id));
  return {score:sharedThemes.length*5+distinctive.length*3+sharedGenres.length,genres:sharedGenres.map(g=>g.name.toLowerCase()),themes:sharedThemes.map(k=>k.name)};
}
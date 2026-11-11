import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SearchResult } from "./media";
import { movieRouteId } from "./media";
import { cultureRouteId } from "./culture";
export function detailPreviewKey(r:SearchResult){return ["detail-preview",r.mediaType==="movie"?movieRouteId(r.externalId):cultureRouteId(r.source,r.externalId)];}
export function useDetailPreview(id:string){return useQuery<SearchResult>({queryKey:["detail-preview",id],enabled:false}).data;}
export function useRememberPreview(){const qc=useQueryClient();return (r:SearchResult)=>qc.setQueryData(detailPreviewKey(r),r);}
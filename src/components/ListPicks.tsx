import {useQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {itemsQuery} from '@/lib/queries';
import {getSimilar} from '@/lib/similar.functions';
import {searchMedia} from '@/lib/search.functions';
import {movieRouteId} from '@/lib/media';
import {cultureRouteId} from '@/lib/culture';
import {listAnchors,listPicks} from '@/lib/list-picks';
import type {ShelfCategory} from '@/lib/home-shelves';
import {RecommendationShelf} from './RecommendationShelf';
import {Button} from './ui/button';
export function ListPicks({list}:{list:{id:string;name:string;kind:string}}){
 const categories:ShelfCategory[]=list.kind==='mixed'?['movie','music','book']:list.kind==='movies'?['movie']:list.kind==='music'?['music']:list.kind==='books'?['book']:[];
 return <>{categories.map(category=><ListShelf key={`${list.id}:${category}`} list={list} category={category}/>)}</>;
}
function ListShelf({list,category}:{list:{id:string;name:string};category:ShelfCategory}){
 const items=useQuery(itemsQuery(list.id));const similar=useServerFn(getSimilar);const search=useServerFn(searchMedia);const [generate,setGenerate]=useState(false);
 const anchors=listAnchors(items.data ?? [],category);
 const picks=useQuery({queryKey:['list-picks',list.id,category,items.data?.map(i=>i.id),generate],enabled:anchors.length>0,staleTime:30*60_000,queryFn:async()=>{
  const groups=await Promise.all(anchors.map(async a=>{
   try{
    const response=await similar({data:{kind:category==='movie'?'movie':'culture',id:category==='movie'?movieRouteId(a.external_id):cultureRouteId(a.source,a.external_id),generate,page:1}});
    if(response.ok&&response.data.similar.length)return response.data.similar.map(i=>i.result);
    if(category!=='movie'&&a.creator){const found=await search({data:{q:a.creator.slice(0,120),filter:category}});return found[category];}
   }catch{/* Other anchors still contribute. */}
   return [];
  }));return listPicks(groups,items.data ?? [],category);
 }});
 if(!anchors.length)return null;
 return <div><RecommendationShelf title={`Podrían ir en tu lista… ${list.name}`} subtitle={`Por ${anchors.map(a=>a.title).join(' · ')}`} items={picks.data ?? []} loading={picks.isFetching&&!picks.data} listId={list.id}/>{!picks.isFetching&&!picks.data?.length&&<div className="px-4 pb-4"><p className="text-sm text-muted-foreground">Todavía no encontramos opciones para esta lista.</p><Button variant="ghost" onClick={()=>{setGenerate(true);void picks.refetch();}}><RefreshCw/>Buscar sugerencias</Button></div>}</div>;
}
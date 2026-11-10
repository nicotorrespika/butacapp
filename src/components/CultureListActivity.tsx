import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useAddToList } from "@/hooks/use-add-to-list";
import { commentsQuery,itemsQuery,listQuery,myListsQuery,ratingsQuery,useListRealtime } from "@/lib/queries";
import { listAccepts,type SearchResult } from "@/lib/media";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { ItemDrawer } from "./ItemDrawer";
export function CultureListActivity({result,listId}:{result:SearchResult;listId?:string}) {
 const {user}=useAuth();const lists=useQuery(myListsQuery);const [chosen,setChosen]=useState("");const id=listId ?? chosen;const adder=useAddToList(id || undefined);
 const detail=useQuery({...listQuery(id),enabled:!!id});const items=useQuery({...itemsQuery(id),enabled:!!id});const ratings=useQuery({...ratingsQuery(id),enabled:!!id});const comments=useQuery({...commentsQuery(id),enabled:!!id});useListRealtime(id);
 const item=items.data?.find(i=>i.source===result.source&&i.external_id===result.externalId);
 return <section className="space-y-4"><h2 className="font-display text-2xl">En tu lista</h2>{!listId&&<select aria-label="Lista para este título" value={chosen} onChange={e=>setChosen(e.target.value)} className="h-11 w-full border border-input bg-card px-3"><option value="">Elegí una lista</option>{lists.data?.filter(l=>listAccepts(l.kind,result.mediaType)).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>}{item&&detail.data&&user?<ItemDrawer inline item={item} ratings={ratings.data ?? []} comments={comments.data ?? []} profiles={detail.data.profiles} userId={user.id} isOwner={detail.data.list.owner_id===user.id} onOpenChange={()=>{}}/>:<Button variant="outline" onClick={()=>adder.add(result)} disabled={adder.isBusy(result)}><Plus/>Agregar a una lista</Button>}{adder.sheet}</section>;
}
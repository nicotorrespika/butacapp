import {ShareButton} from "./ShareButton";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, CalendarDays, Disc3, Film, Heart, MessageCircle, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { friendsQuery, type Activity } from "@/lib/social";
import { movieRouteId } from "@/lib/media";
import { Button } from "./ui/button";
import { Poster } from "./Poster";
import { UserAvatar } from "./UserAvatar";
import { SocialComments } from "./SocialComments";
import {cultureRouteId} from "@/lib/culture";
import {StarRating} from "./StarRating";

export function FriendsFeed({category="all"}:{category?:"all"|"movie"|"music"|"book"|"event"}){
 const {user}=useAuth();const qc=useQueryClient();const id=user?.id ?? "";const friends=useQuery({...friendsQuery(id),enabled:!!id});const ids=friends.data?.filter(f=>f.following).map(f=>f.sender_id===id?f.receiver_id:f.sender_id) ?? [];
 useEffect(()=>{if(!id)return;const channel=supabase.channel(`friends-feed-${id}-${Math.random().toString(36).slice(2)}`);for(const table of ["activity","ratings","list_items","user_follows","lists"])channel.on("postgres_changes",{event:"*",schema:"public",table},()=>{qc.invalidateQueries({queryKey:["social"]});qc.invalidateQueries({queryKey:["lists","mine"]});});channel.subscribe();return()=>{void supabase.removeChannel(channel);};},[id,qc]);
 const [filter,setFilter]=useState(false);const end=useRef<HTMLDivElement>(null);const start=useRef(0);
 const feed=useInfiniteQuery({queryKey:["social","feed",id,ids,filter,category],enabled:ids.length>0,initialPageParam:null as {date:string;id:string}|null,queryFn:async({pageParam})=>{
  let q=supabase.from("activity").select("*").in("user_id",ids).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(20);
  if(category!=="all")q=q.eq("category",category);else q=q.or("category.is.null,category.neq.art");
  if(filter)q=q.in("kind",["watched","rated"]);if(pageParam)q=q.or(`created_at.lt.${pageParam.date},and(created_at.eq.${pageParam.date},id.lt.${pageParam.id})`);
  const r=await q;if(r.error)throw r.error;return r.data;
 },getNextPageParam:last=>{const row=last.at(-1);return last.length===20&&row?{date:row.created_at,id:row.id}:undefined;}});
 useEffect(()=>{const el=end.current;if(!el)return;const observer=new IntersectionObserver(e=>{if(e[0]?.isIntersecting&&feed.hasNextPage&&!feed.isFetchingNextPage)void feed.fetchNextPage();},{rootMargin:"300px"});observer.observe(el);return()=>observer.disconnect();},[feed.hasNextPage,feed.isFetchingNextPage,feed.fetchNextPage]);
 return <section onTouchStart={e=>{start.current=window.scrollY===0?(e.touches[0]?.clientY ?? 0):0;}} onTouchEnd={e=>{if(start.current&&(e.changedTouches[0]?.clientY ?? 0)-start.current>80)void feed.refetch();}} className="px-4 py-8">
  <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="cinema-heading text-3xl">Chusmeá qué hacen tus amigues</h2><Button variant="ghost" onClick={()=>feed.refetch()} disabled={!ids.length||feed.isFetching}><RefreshCw/>Actualizar</Button></div>
  <div className="my-4 flex gap-2"><Button variant="ghost" aria-pressed={!filter} onClick={()=>setFilter(false)}>Todo</Button><Button variant="ghost" aria-pressed={filter} onClick={()=>setFilter(true)}>Solo vistas y notas</Button></div>
  {!friends.isLoading&&!ids.length?<div className="py-12"><p className="font-display text-2xl">La sala espera a tu gente.</p><Button asChild className="mt-6" size="lg"><Link to="/friends"><Search/>Buscar amigos</Link></Button></div>:<>
   {feed.isError&&<p className="py-6 text-sm text-muted-foreground">No pudimos cargar la actividad. Tocá Actualizar para probar otra vez.</p>}
   {feed.data?.pages.flat().map(a=><FeedRow key={a.id} activity={a} profile={friends.data?.find(f=>f.profile?.id===a.user_id)?.profile}/>)}
   {!feed.isLoading&&!feed.data?.pages.flat().length&&!feed.isError&&<p className="py-12 text-sm text-muted-foreground">Por acá, silencio todavía.</p>}
   <div ref={end} className="h-12 text-center text-sm text-muted-foreground">{feed.isFetchingNextPage?"Cargando…":""}</div>
  </>}
 </section>;
}
function FeedRow({activity:a,profile}:{activity:Activity;profile?:{username:string|null;display_name:string;avatar_url:string|null}|undefined}){
 const {user}=useAuth();const qc=useQueryClient();const [reply,setReply]=useState(false);const [expanded,setExpanded]=useState(false);
 const likes=useQuery({queryKey:["social","likes",a.id],queryFn:async()=>{const r=await supabase.from("activity_likes").select("user_id").eq("activity_id",a.id);if(r.error)throw r.error;return r.data;}});
 const list=useQuery({queryKey:["social","feed-list",a.list_id],enabled:!!a.list_id,queryFn:async()=>{const r=await supabase.from("lists").select("name").eq("id",a.list_id ?? "").maybeSingle();return r.data;}});
 const covers=useQuery({queryKey:["social","feed-covers",a.list_id],enabled:a.kind==="created_list"&&!!a.list_id,queryFn:async()=>{const r=await supabase.from("list_items").select("image_url,title").eq("list_id",a.list_id ?? "").not("image_url","is",null).limit(4);return r.data ?? [];}});
 const itemPoster=useQuery({queryKey:["social","feed-poster",a.item_id],enabled:!!a.item_id&&!a.image_url,queryFn:async()=>{const r=await supabase.from("list_items").select("image_url").eq("id",a.item_id ?? "").maybeSingle();return r.data?.image_url ?? null;}});
 const rating=useQuery({queryKey:["social","feed-rating",a.item_id,a.user_id],enabled:a.kind==="added"&&!!a.item_id,queryFn:async()=>{const r=await supabase.from("ratings").select("score_10").eq("item_id",a.item_id ?? "").eq("user_id",a.user_id).maybeSingle();if(r.error)throw r.error;return r.data;}});
 const score=a.kind==="added"?rating.data?.score_10 ?? a.score_10:a.score_10;
 const liked=likes.data?.some(l=>l.user_id===user?.id);const verb={watched:a.category==="music"?"escuchó":a.category==="book"?"leyó":"vio",rated:"puntuó",reviewed:"reseñó",created_list:"creó la lista",added:"agregó",commented:"comentó en"}[a.kind] ?? "descubrió";
 async function like(){if(!user)return;const r=liked?await supabase.from("activity_likes").delete().eq("activity_id",a.id).eq("user_id",user.id):await supabase.from("activity_likes").insert({activity_id:a.id,user_id:user.id});if(r.error)return void toast.error("No se pudo guardar el like");qc.invalidateQueries({queryKey:["social","likes",a.id]});}
 const movie=a.external_id&&a.source&&(a.source==="tmdb"||a.source==="imdb");
 const culture=a.external_id&&(a.source==="openlibrary"||a.source==="itunes");const event=a.source==="event"&&a.external_id;const Icon={movie:Film,music:Disc3,book:BookOpen,event:CalendarDays}[a.category as "movie"|"music"|"book"|"event"];
 return <article className="flex gap-3 border-b border-border/50 py-6">
  <div className="min-w-0 flex-1"><Link to="/people/$userId" params={{userId:a.user_id}} className="flex min-h-11 items-center gap-2"><UserAvatar name={profile?.display_name} url={profile?.avatar_url} className="size-7"/><span className="text-sm">{profile?.username ?? profile?.display_name ?? "Alguien"}</span></Link><p className="mb-2 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(a.created_at),{addSuffix:true,locale:es})}</p>
  <p className="text-sm text-muted-foreground">{Icon&&<Icon aria-hidden="true" className="mr-2 inline size-3"/>}{event?(a.body==="Voy"?"va a ":"le interesa "):verb} {event?<Link to="/event/$eventId" params={{eventId:a.external_id ?? ""}} className="font-display text-lg text-foreground">{a.title}</Link>:culture?<Link to="/culture/$cultureId" params={{cultureId:cultureRouteId(a.source ?? "",a.external_id ?? "")}} className="font-display text-lg text-foreground">{a.title}</Link>:movie?<Link to="/movie/$movieId" params={{movieId:movieRouteId(a.external_id ?? "")}} search={{list:a.list_id ?? undefined}} className="font-display text-lg text-foreground">{a.title}</Link>:a.list_id?<Link to="/lists/$listId" params={{listId:a.list_id}} className="font-display text-lg text-foreground">{a.title}</Link>:<span className="font-display text-lg text-foreground">{a.title}</span>}{a.kind==="added"&&list.data&&<> a <Link to="/lists/$listId" params={{listId:a.list_id ?? ""}}>{list.data.name}</Link></>}</p>
  {!!score&&<div className="mt-2 flex items-center gap-2 text-sm text-primary"><StarRating value={score} size="sm"/><span>{score}/10</span></div>}
  {a.body&&!event&&<><p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground ${expanded?"":"line-clamp-3"}`}>{a.body}</p>{a.body.length>100&&<Button variant="ghost" className="px-0" onClick={()=>setExpanded(!expanded)}>{expanded?"Ver menos":"Ver más"}</Button>}</>}
  {!!covers.data?.length&&<div className="mt-3 flex gap-1">{covers.data.map((c,i)=><Poster key={i} src={c.image_url} alt={c.title} media="movie" className="w-10"/>)}</div>}
  <div className="mt-3 flex flex-wrap gap-2"><Button variant="ghost" aria-pressed={liked} className={`px-0 ${liked?"text-primary":"text-muted-foreground"}`} onClick={like}><Heart fill={liked?"currentColor":"none"}/>Me gusta {likes.data?.length||""}</Button><Button variant="ghost" className="text-muted-foreground" onClick={()=>setReply(!reply)}><MessageCircle/>Responder</Button><ShareButton compact content={{kind:"activity",id:a.id,title:a.title,image:a.image_url ?? itemPoster.data,private:true,category:a.kind==="reviewed"?"Reseña":"Actividad"}}/></div>
  {reply&&<div className="mt-4"><SocialComments activityId={a.id}/></div>}
  </div>{movie&&<Link to="/movie/$movieId" params={{movieId:movieRouteId(a.external_id ?? "")}} search={{list:a.list_id ?? undefined}} className="mt-14 w-20 shrink-0 self-start"><Poster src={a.image_url ?? itemPoster.data ?? null} alt={a.title} media="movie"/></Link>}
 </article>;
}
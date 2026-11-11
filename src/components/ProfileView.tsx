import {ShareButton} from "./ShareButton";
import {SoundtrackCollection} from "./SoundtrackCollection";
import {useScreenState} from "@/hooks/use-screen-state";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Heart, Plus, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, profileListsQuery, watchedQuery, viewingStats, friendsQuery } from "@/lib/social";
import { movieRouteId } from "@/lib/media";
import { CATEGORY_COPY, TOP_KINDS_BY_CATEGORY, type TopKind } from "@/lib/copy";
import { TopFiveSection } from "./TopFiveSection";
import { useAuth } from "@/hooks/use-auth";
import { Poster } from "./Poster";
import {ListCoverStrip} from "./ListCoverStrip";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";
import { CreateListDrawer } from "./CreateListDrawer";
import { SocialComments } from "./SocialComments";
import { FriendsPanel } from "./FriendsPanel";
import { CulturalProfile } from "./CulturalProfile";
import { EventAgenda } from "./EventAgenda";
import { ErrorState } from "./States";

export function ProfileView({userId}:{userId:string}){
 const {user}=useAuth();const own=user?.id===userId;const qc=useQueryClient();const p=useQuery(profileQuery(userId));const watches=useQuery(watchedQuery(userId));const lists=useQuery(profileListsQuery(userId));const relations=useQuery({...friendsQuery(user?.id ?? ""),enabled:!!user});
 const [category,setCategory]=useScreenState<"movie"|"music"|"book">(`profile:${userId}:category`,"movie");
 const [topKind,setTopKind]=useScreenState<TopKind>(`profile:${userId}:topkind`,"artist");
 const [tab,setTab]=useScreenState(`profile:${userId}:tab`,"Listas");const [editing,setEditing]=useState(false);const [name,setName]=useState("");const [username,setUsername]=useState("");const [bio,setBio]=useState("");const [avatar,setAvatar]=useState("");const [creating,setCreating]=useState(false);const [saving,setSaving]=useState(false);
 useEffect(()=>{if(p.data){setName(p.data.display_name);setUsername(p.data.username ?? "");setBio(p.data.bio);setAvatar(p.data.avatar_url ?? "");}},[p.data]);
 const refresh=()=>qc.invalidateQueries({queryKey:["social"]});
 async function save(e:React.FormEvent){e.preventDefault();setSaving(true);const r=await supabase.from("profiles").update({display_name:name.trim(),username:username.trim().toLowerCase(),bio,avatar_url:avatar||null}).eq("id",userId);setSaving(false);if(r.error)return void toast.error("No se pudo guardar. Usá un usuario único de 3 a 24 letras, números o guiones bajos.");setEditing(false);refresh();qc.invalidateQueries({queryKey:["profile"]});toast.success("Perfil actualizado");}
 if(p.isError)return <ErrorState onRetry={()=>p.refetch()}/>;if(!p.data)return <p className="py-12 text-muted-foreground">Cargando…</p>;
 const stats=viewingStats(watches.data?.filter(w=>w.watched) ?? []);const friend=relations.data?.some(f=>f.status==="accepted"&&(f.sender_id===userId||f.receiver_id===userId));
 return <div className="space-y-8">
  <header className="flex flex-wrap items-center gap-4"><UserAvatar name={p.data.display_name} url={p.data.avatar_url} className="size-20 text-3xl"/><div className="min-w-0"><h1 className="break-words font-display text-3xl">{p.data.display_name}</h1><p className="text-sm text-muted-foreground">@{p.data.username ?? "sin_usuario"}</p></div>{own&&<Button variant="outline" onClick={()=>setEditing(!editing)}><Save/>Editar perfil</Button>}</header>
  {own?<Button asChild variant="outline"><Link to="/avisos"><UserPlus/>Agregar amigos</Link></Button>:<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={async()=>{if(!user)return;const existing=relations.data?.find(f=>f.sender_id===userId||f.receiver_id===userId);const r=existing?await supabase.from("friendships").delete().eq("id",existing.id):await supabase.from("friendships").insert({sender_id:user.id,receiver_id:userId});if(r.error)toast.error("No pudimos cambiar la amistad.");else refresh();}}><UserPlus/>{friend?"Amigos · quitar":"Agregar amigo"}</Button>{friend&&<Button asChild variant="outline"><Link to="/avisos" onClick={()=>{sessionStorage.setItem("butacapp:messages:peer",JSON.stringify(userId));sessionStorage.setItem("butacapp:avisos:section",JSON.stringify("Mensajes"));qc.setQueryData(["screen-state","messages:peer"],userId);qc.setQueryData(["screen-state","avisos:section"],"Mensajes");}}>Mensaje</Link></Button>}</div>}
  <ShareButton content={{kind:"profile",id:userId,title:p.data.display_name,image:p.data.avatar_url,private:p.data.share_visibility!=="public",ownerId:userId,category:"Perfil"}}/>
  {own&&<Button asChild variant="outline"><Link to="/gustos"><Heart/>Mis gustos</Link></Button>}
  {p.data.bio&&<p className="max-w-xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{p.data.bio}</p>}
  {own&&<label className="block text-sm text-muted-foreground">Puntuar con<select aria-label="Puntuar con" value={p.data.rating_style} onChange={async e=>{const r=await supabase.from("profiles").update({rating_style:e.target.value}).eq("id",userId);if(r.error)toast.error("No se pudo guardar");else{refresh();toast.success("Joya, guardada");}}} className="ml-3 h-11 rounded-sm border border-input bg-card px-3"><option value="stars">Estrellas</option><option value="popcorn">Pochoclos</option></select></label>}
  {own&&(!p.data.username||editing)&&<form onSubmit={save} className="space-y-3"><label className="block text-sm">Nombre de usuario<input aria-label="Nombre de usuario" required pattern="[a-zA-Z0-9_]{3,24}" value={username} onChange={e=>setUsername(e.target.value)} className="mt-2 h-11 w-full rounded-sm border border-input bg-card px-3"/></label>{editing&&<><label className="block text-sm">Nombre<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 h-11 w-full rounded-sm border border-input bg-card px-3"/></label><label className="block text-sm">Bio<textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={280} className="mt-2 w-full rounded-sm border border-input bg-card p-3"/></label><label className="block text-sm">Foto (dirección de imagen)<input type="url" value={avatar} onChange={e=>setAvatar(e.target.value)} className="mt-2 h-11 w-full rounded-sm border border-input bg-card px-3"/></label></>}<Button type="submit" disabled={saving}><Check/>Guardar</Button></form>}
  <div role="tablist" aria-label="Categoría del perfil" className="flex gap-2">{([["movie","Cine"],["music","Música"],["book","Libros"]] as const).map(([id,label])=><Button role="tab" aria-selected={category===id} key={id} variant="ghost" onClick={()=>setCategory(id)}>{label}</Button>)}</div>
  {category!=="movie"&&<><div role="tablist" aria-label="Tipo de Top 5" className="flex gap-2">{TOP_KINDS_BY_CATEGORY[category].map(t=><Button role="tab" aria-selected={topKind===t.kind} key={t.kind} variant="ghost" onClick={()=>setTopKind(t.kind)}>{t.label}</Button>)}</div><TopFiveSection userId={userId} kind={TOP_KINDS_BY_CATEGORY[category].some(t=>t.kind===topKind)?topKind:TOP_KINDS_BY_CATEGORY[category][0]!.kind} own={own}/><CulturalProfile userId={userId} type={category} tab={tab}/></>}
  {category==="movie"&&<><TopFiveSection userId={userId} kind="movie" own={own}/>
  <dl className="flex flex-wrap gap-8">{[["Vistas",stats.watched],["Promedio",stats.average ?? "—"]].map(([label,value])=><div key={label}><dd className="cinema-heading text-4xl">{value}</dd><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt></div>)}{stats.genres.length>0&&<div><dd className="text-sm">{stats.genres.join(" · ")}</dd><dt className="text-[11px] uppercase text-muted-foreground">Géneros más vistos</dt></div>}</dl>
  </>}
  <div role="tablist" className="flex overflow-x-auto scrollbar-none">{["Listas","Pendientes",CATEGORY_COPY[category].favoritesTab,"Reseñas",CATEGORY_COPY[category].doneTab,"Amigos","Mi agenda"].map(t=><Button role="tab" aria-selected={tab===t} variant="ghost" key={t} onClick={()=>setTab(t)} className={`shrink-0 rounded-none border-b px-3 ${tab===t?"border-primary":"border-transparent text-muted-foreground"}`}>{t}</Button>)}</div>
  {category==="movie"&&tab==="Pendientes"&&<div className="grid grid-cols-3 gap-3">{watches.data?.filter(m=>m.queued&&!m.watched).map(m=><Link key={m.id} to="/movie/$movieId" params={{movieId:movieRouteId(m.external_id)}}><Poster src={m.image_url} alt={m.title} media="movie"/><h3 className="mt-2 font-display text-lg">{m.title}</h3></Link>)}</div>}
  {tab==="Listas"&&<section className="space-y-4">{own&&<Button onClick={()=>setCreating(true)}><Plus/>Nueva lista</Button>}{lists.data?.filter(l=>l.kind!=="art"&&(l.kind==="mixed"||l.kind===(category==="movie"?"movies":category==="book"?"books":"music"))).map(l=><Link key={l.id} to="/lists/$listId" params={{listId:l.id}} className="block py-3"><h2 className="font-display text-2xl">{l.name}</h2><p className="text-xs text-muted-foreground">{l.description}</p><ListCoverStrip covers={l.covers} name={l.name}/></Link>)}{!lists.data?.length&&<p className="text-sm text-muted-foreground">Nada guardado todavía.</p>}</section>}
  {category==="movie"&&tab==="Favoritas"&&<div className="grid grid-cols-3 gap-3">{watches.data?.filter(m=>m.favorite).map(m=><Link key={m.id} to="/movie/$movieId" params={{movieId:movieRouteId(m.external_id)}}><Poster src={m.image_url} alt={m.title} media="movie"/><h3 className="mt-2 font-display text-lg">{m.title}</h3></Link>)}</div>}
  {category==="movie"&&(tab==="Vistas"||tab==="Reseñas")&&<section className="space-y-6">{watches.data?.filter(w=>tab==="Vistas"||w.review).map(w=><article className={tab==="Reseñas"?"review-ticket":""} key={w.id}>{tab==="Reseñas"&&<div className="mb-4 flex items-center justify-between gap-2"><span className="cinema-meta">SALA 1 / FUNCIÓN NOCHE</span>{w.watched&&<span className="ticket-stamp cinema-heading px-2 py-1 text-xl">VISTA</span>}</div>}<Link to="/movie/$movieId" params={{movieId:movieRouteId(w.external_id)}} className="flex items-start gap-3"><Poster src={w.image_url} alt={w.title} media="movie" className="w-16 shrink-0"/><div><h2 className="font-display text-xl">{w.title}</h2><p className="text-sm text-primary">{w.score_10?`${w.score_10}/10 ★`:""}</p><p className="mt-2 text-sm text-muted-foreground">{w.review}</p></div></Link><ShareButton content={{kind:"review",id:w.id,title:w.title,image:w.image_url,year:w.year,category:"Reseña",private:p.data.share_visibility!=="public"}}/></article>)}{!watches.data?.length&&<p className="text-sm text-muted-foreground">Todavía no hay películas acá.</p>}</section>}
  {own&&category==="music"&&<SoundtrackCollection userId={userId}/>}
  {own&&tab==="Mi agenda"&&<EventAgenda personal/>}
  {tab==="Amigos"&&(own?<FriendsPanel/>:<p className="text-sm text-muted-foreground">{friend?"Son amigos. Lo que viene, compartido.":"Buscá a esta persona desde Amigos para enviarle una solicitud."}</p>)}
  {!own&&friend&&<section><h2 className="mb-4 font-display text-2xl">En su butaca</h2><SocialComments profileId={userId}/></section>}
  <CreateListDrawer open={creating} onOpenChange={setCreating} onCreated={()=>{setCreating(false);refresh();}}/>
 </div>;
}
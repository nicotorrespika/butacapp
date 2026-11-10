import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Library, LogIn, Search, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getHomePosters,getArgentineMovies } from "@/lib/home.functions";
import {DiscoveryDeck} from "./DiscoveryDeck";
import {Poster} from "./Poster";
import {movieRouteId} from "@/lib/media";
import { myListsQuery } from "@/lib/queries";
import { Button } from "./ui/button";
import { FriendsFeed } from "./FriendsFeed";
import hero from "@/assets/hero-theater.jpg";
export function HomeExperience(){
 const {user}=useAuth();const fetchPosters=useServerFn(getHomePosters);const posters=useQuery({queryKey:["home-posters"],queryFn:()=>fetchPosters(),staleTime:3600000});const lists=useQuery({...myListsQuery,enabled:!!user});
 const fetchArgentine=useServerFn(getArgentineMovies);const argentine=useQuery({queryKey:["home","argentine"],queryFn:()=>fetchArgentine()});
 return <div><header className="relative overflow-hidden"><div className="absolute inset-0">{posters.data?.length?<div className="poster-mosaic grid grid-cols-6 gap-1 sm:grid-cols-10">{[...posters.data,...posters.data].map((src,i)=><img key={i} src={src} alt="" className="aspect-[2/3] w-full object-cover" loading="lazy"/>)}</div>:<img src={hero} alt="" className="h-full w-full object-cover opacity-50"/>}<div className="absolute inset-0 bg-poster-fade"/></div><div className="relative flex min-h-[440px] flex-col justify-end px-5 pb-10 sm:min-h-[500px]"><h1 className="break-words cinema-heading text-6xl">BUTACAPP</h1><p className="mt-4 text-base text-muted-foreground">Todavía queda algo por descubrir.</p><div className="mt-7 flex flex-wrap gap-3">{user?<><Button asChild><Link to="/search"><Search/>Buscar una película</Link></Button><Button asChild variant="outline"><Link to="/lists"><Library/>Mis listas</Link></Button></>:<><Button asChild><Link to="/auth"><LogIn/>Entrar</Link></Button><Button asChild variant="outline"><Link to="/auth" search={{mode:"signup"}}><UserPlus/>Crear cuenta</Link></Button></>}</div></div></header>
 {user&&<><section className="px-4 pt-8"><div className="flex items-center justify-between gap-2"><h2 className="cinema-heading text-3xl">Mis listas</h2><Button asChild variant="ghost"><Link to="/lists"><Library/>Ver listas</Link></Button></div><div className="mt-3 flex gap-5 overflow-x-auto scrollbar-none">{lists.data?.slice(0,6).map(l=><Link key={l.id} to="/lists/$listId" params={{listId:l.id}} className="min-w-40 py-3 font-display text-xl">{l.name}</Link>)}</div></section><FriendsFeed/></>}
 {user&&<DiscoveryDeck surprise/>}
 {!!argentine.data?.length&&<section className="px-4 py-8"><h2 className="mb-5 cinema-heading text-4xl">Cine argentino para ver</h2><div className="flex gap-3 overflow-x-auto">{argentine.data.slice(0,12).map(m=><Link key={m.externalId} to="/movie/$movieId" params={{movieId:movieRouteId(m.externalId)}} className="w-28 shrink-0"><Poster src={m.imageUrl} alt={m.title} media="movie"/><p className="mt-2 font-display text-lg">{m.title}</p></Link>)}</div></section>}
 <p className="px-4 py-6 text-[10px] text-muted-foreground">Datos de cine: TMDB. Este producto usa la API de TMDB y no está avalado ni certificado por TMDB.</p></div>;
}
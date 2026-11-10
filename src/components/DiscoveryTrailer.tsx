import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {getMovie} from "@/lib/movies.functions";
import {MovieTrailer} from "./MovieTrailer";
export function DiscoveryTrailer({id}:{id:string}){const fetchMovie=useServerFn(getMovie);const q=useQuery({queryKey:["discovery","trailer",id],queryFn:()=>fetchMovie({data:{id}})});if(q.isLoading)return <p className="text-sm text-muted-foreground">Buscando el tráiler…</p>;const m=q.data?.ok?q.data.data:null;return m?.trailerKey?<MovieTrailer videoKey={m.trailerKey} title={m.title} posterUrl={m.backdropUrl}/>:<p className="text-sm text-muted-foreground">Esta no tiene tráiler registrado, che.</p>;}
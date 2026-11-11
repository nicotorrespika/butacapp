import { Popcorn, Star } from "lucide-react";
import {useQuery} from "@tanstack/react-query";
import {useAuth} from "@/hooks/use-auth";
import {profileQuery} from "@/lib/social";
import { cn } from "@/lib/utils";
import { starFill } from "@/lib/ratings";
import { Button } from "./ui/button";
interface StarRatingProps {value:number|null;onChange?:((score:number|null)=>void)|undefined;size?:"sm"|"lg";label?:string;compact?:boolean;}
export function StarRating({value,onChange,size="lg",label="Tu nota",compact=false}:StarRatingProps){
 const {user}=useAuth();const profile=useQuery({...profileQuery(user?.id ?? ""),enabled:!!user});const Icon=profile.data?.rating_style==="popcorn"?Popcorn:Star;
 const glyph=(star:number)=><span className="relative block"><Icon className={cn(size==="sm"?"size-3.5":"size-7","text-muted-foreground/40")}/><span className="absolute inset-0 overflow-hidden" style={{width:`${starFill(value,star)*100}%`}}><Icon className={cn(size==="sm"?"size-3.5":"size-7","fill-primary text-primary")}/></span></span>;
 if(!onChange)return <div className="flex gap-0.5" aria-label={`${value ?? 0} de 10`}>{[1,2,3,4,5].map(s=><span key={s}>{glyph(s)}</span>)}</div>;
 return <div className={compact?"flex items-center gap-2":""}><div role="radiogroup" aria-label={label} className="flex w-fit">{[1,2,3,4,5].map(s=><Button key={s} variant="ghost" type="button" role="radio" aria-checked={value===s*2||value===s*2-1} aria-label={`${s} estrellas`} className="h-11 w-11 p-0" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const score=s*2-(e.clientX-r.left<r.width/2?1:0);onChange(value===score?null:score);}}>{glyph(s)}</Button>)}</div><p className={cn("text-sm text-muted-foreground",!compact&&"mt-1")}>{value ?? "—"}/10</p></div>;
}

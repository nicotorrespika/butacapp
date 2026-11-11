import type { SearchResult } from "@/lib/media";
import { BackButton } from "./BackButton";
import { Poster } from "./Poster";
import { Skeleton } from "./States";
export function DetailPreview({result}:{result?:SearchResult|undefined}){
 return <div className="px-4 py-5"><BackButton/><header className="mt-4 flex items-start gap-4">{result?<Poster src={result.imageUrl} alt={result.title} media={result.mediaType} className="w-24 shrink-0"/>:<Skeleton className="aspect-[2/3] w-24 shrink-0"/>}<div className="min-w-0 flex-1">{result?<><h1 className="font-display text-3xl text-primary">{result.title}</h1><p className="mt-2 text-sm text-muted-foreground">{[result.creator,result.year].filter(Boolean).join(" · ")}</p></>:<Skeleton className="h-9 w-4/5"/>}<Skeleton className="mt-3 h-4 w-1/2"/></div></header><Skeleton className="mt-5 h-16 w-full"/><Skeleton className="mt-5 h-24 w-full"/></div>;
}
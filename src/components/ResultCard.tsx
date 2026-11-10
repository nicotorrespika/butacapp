import {ShareButton} from "./ShareButton";
import {shareResult} from "@/lib/sharing";
import { Check, Loader2, Plus } from "lucide-react";
import { Poster } from "@/components/Poster";
import type { SearchResult } from "@/lib/media";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** One search result: cover, title, author, year and a 44px "+" button. */
export function ResultCard({
  result,
  onAdd,
  className,
  added = false,
  busy = false,
  targetName,
  onOpen,
}: {
  result: SearchResult;
  onAdd: (r: SearchResult) => void;
  /** Tap on cover/title opens the detail page (movies). */
  onOpen?: ((r: SearchResult) => void) | undefined;
  className?: string;
  /** Already added to the target list (shows a check instead of "+"). */
  added?: boolean;
  busy?: boolean;
  /** When adding straight into one list, its name (for the button label). */
  targetName?: string | undefined;
}) {
  return (
    <article className={cn("group relative animate-rise", className)}>
      <div className="relative">
        {onOpen ? (
          <Button variant="ghost"
            type="button"
            onClick={() => onOpen(result)}
            aria-label={`Ver ficha de ${result.title}`}
            className="block h-auto w-full rounded-sm p-0"
          >
            <Poster src={result.imageUrl} alt={result.title} media={result.mediaType} />
          </Button>
        ) : (
          <Poster src={result.imageUrl} alt={result.title} media={result.mediaType} />
        )}
        <Button variant="glass" size="icon"
          type="button"
          onClick={() => onAdd(result)}
          disabled={added || busy}
          aria-label={
            added
              ? `${result.title} ya está en la lista`
              : `Agregar ${result.title} a ${targetName ? `«${targetName}»` : "una lista"}`
          }
          className={cn(
            "absolute bottom-2 right-2 rounded-sm border-border transition-colors duration-300",
            added ? "text-primary" : "text-foreground",
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : added ? (
            <Check className="size-5" strokeWidth={3} />
          ) : (
            <Plus className="size-5" strokeWidth={2.5} />
          )}
        </Button>
      </div>
      <div className="mt-2 px-0.5">
        <ShareButton content={shareResult(result)} compact/>
        {result.kindLabel==="Cine argentino"&&<p className="mb-1 text-[10px] uppercase text-primary">Cine argentino</p>}
        <h3 className="line-clamp-2 font-display text-xl leading-snug text-primary">
          {onOpen ? (
            <Button variant="ghost" type="button" onClick={() => onOpen(result)} className="h-auto min-h-11 justify-start whitespace-normal rounded-none p-0 text-left font-display text-xl font-normal text-primary hover:bg-transparent">
              {result.title}
            </Button>
          ) : (
            result.title
          )}
        </h3>
        <p className="cinema-meta mt-0.5 truncate text-muted-foreground">
          {[result.creator, result.year].filter(Boolean).join(" · ") || result.kindLabel}
        </p>
      </div>
    </article>
  );
}

import { Check, Loader2, Plus } from "lucide-react";
import { Poster } from "@/components/Poster";
import type { SearchResult } from "@/lib/media";
import { cn } from "@/lib/utils";

/** One search result: cover, title, author, year and a 44px "+" button. */
export function ResultCard({
  result,
  onAdd,
  className,
  added = false,
  busy = false,
  targetName,
}: {
  result: SearchResult;
  onAdd: (r: SearchResult) => void;
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
        <Poster src={result.imageUrl} alt={result.title} media={result.mediaType} />
        <button
          type="button"
          onClick={() => onAdd(result)}
          disabled={added || busy}
          aria-label={
            added
              ? `${result.title} ya está en la lista`
              : `Agregar ${result.title} a ${targetName ? `«${targetName}»` : "una lista"}`
          }
          className={cn(
            "absolute bottom-2 right-2 flex size-11 items-center justify-center rounded-full shadow-glow transition-transform duration-200 ease-cine active:scale-90",
            added ? "bg-success text-background" : "bg-primary text-primary-foreground",
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : added ? (
            <Check className="size-5" strokeWidth={3} />
          ) : (
            <Plus className="size-5" strokeWidth={2.5} />
          )}
        </button>
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-2 font-sans text-sm font-semibold leading-snug text-foreground">{result.title}</h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[result.creator, result.year].filter(Boolean).join(" · ") || result.kindLabel}
        </p>
      </div>
    </article>
  );
}

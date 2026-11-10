import { Plus } from "lucide-react";
import { Poster } from "@/components/Poster";
import type { SearchResult } from "@/lib/media";
import { cn } from "@/lib/utils";

/** One search result: cover, title, author, year and a 44px "+" button. */
export function ResultCard({
  result,
  onAdd,
  className,
}: {
  result: SearchResult;
  onAdd: (r: SearchResult) => void;
  className?: string;
}) {
  return (
    <article className={cn("group relative animate-rise", className)}>
      <div className="relative">
        <Poster src={result.imageUrl} alt={result.title} media={result.mediaType} />
        <button
          type="button"
          onClick={() => onAdd(result)}
          aria-label={`Agregar ${result.title} a una lista`}
          className="absolute bottom-2 right-2 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform duration-200 ease-cine active:scale-90"
        >
          <Plus className="size-5" strokeWidth={2.5} />
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

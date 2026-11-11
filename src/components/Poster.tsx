import { useState } from "react";
import { BookOpen, Disc3, Film, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/media";

/** Aspect ratio per media: posters are tall, album covers square, artworks slightly tall. */
export const ASPECT: Record<MediaType, string> = {
  movie: "aspect-[2/3]",
  music: "aspect-square",
  book: "aspect-[2/3]",
  art: "aspect-[4/5]",
};

const ICON = { movie: Film, music: Disc3, book: BookOpen, art: Palette };

interface PosterProps {
  src: string | null | undefined;
  alt: string;
  media: MediaType;
  className?: string;
  /** Force a ratio (e.g. square grids) instead of the media default. */
  aspect?: string;
}

/** Cover/poster image with a graceful fallback when missing or broken. */
export function Poster({ src, alt, media, className, aspect }: PosterProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const Icon = ICON[media];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm bg-muted ring-1 ring-border",
        aspect ?? ASPECT[media],
        className,
      )}
    >
      {src && src !== failedSrc ? (
        <img
          src={src}
          srcSet={src.includes("image.tmdb.org/t/p/")?`${src.replace(/\/w\d+\//,"/w185/")} 185w, ${src.replace(/\/w\d+\//,"/w342/")} 342w, ${src.replace(/\/w\d+\//,"/w500/")} 500w`:undefined}
          sizes="(max-width: 640px) 160px, 200px"
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-cine"
        />
      ) : media === "book" ? (
        <div role="img" aria-label={alt} className="book-cover">
          <div className="book-cover-frame">
            <BookOpen className="book-cover-mark" aria-hidden="true" />
            <span className={cn("book-cover-title", alt.length > 70 && "book-cover-title-long")}>{alt}</span>
            <span className="book-cover-rule" aria-hidden="true" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
          <Icon className="size-7 opacity-60" />
          <span className="line-clamp-3 font-display text-sm leading-tight">{alt}</span>
        </div>
      )}
    </div>
  );
}

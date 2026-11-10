import { useState } from "react";
import { Disc3, Film, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/media";

/** Aspect ratio per media: posters are tall, album covers square, artworks slightly tall. */
export const ASPECT: Record<MediaType, string> = {
  movie: "aspect-[2/3]",
  music: "aspect-square",
  art: "aspect-[4/5]",
};

const ICON = { movie: Film, music: Disc3, art: Palette };

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
  const [failed, setFailed] = useState(false);
  const Icon = ICON[media];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted shadow-poster ring-1 ring-border",
        aspect ?? ASPECT[media],
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-cine"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
          <Icon className="size-7 opacity-60" />
          <span className="line-clamp-3 font-display text-sm leading-tight">{alt}</span>
        </div>
      )}
    </div>
  );
}

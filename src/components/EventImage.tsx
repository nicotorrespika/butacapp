import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Film, Music, BookOpen, Palette, Drama, CalendarDays } from "lucide-react";
import stageCover from "@/assets/event-stage.jpg";
import musicCover from "@/assets/event-music.jpg";
import cultureCover from "@/assets/event-culture.jpg";
import { eventCover } from "@/lib/event-covers";

const icons = {
  movie: Film,
  music: Music,
  book: BookOpen,
  art: Palette,
  theater: Drama,
  festival: CalendarDays,
};

const labels: Record<string, string> = {
  theater: "Teatro",
  music: "Música en vivo",
  movie: "Cine",
  art: "Arte y Muestras",
  book: "Letras y Libros",
  festival: "Feria o Festival",
};

const FALLBACK_COVERS: Record<string, string> = {
  theater: stageCover,
  movie: stageCover,
  music: musicCover,
  festival: musicCover,
  book: cultureCover,
  art: cultureCover,
};

export function EventImage({ title, interest, url, compact = false }: { title: string; interest: string; url: string | null; compact?: boolean }) {
  const [failed, setFailed] = useState<string[]>([]);
  const signed = useQuery({
    queryKey: ["event-photo", url],
    enabled: !!url?.startsWith("storage:"),
    staleTime: 3000000,
    queryFn: async () => {
      const r = await supabase.storage.from("event-photos").createSignedUrl(url?.slice(8) ?? "", 3600);
      return r.data?.signedUrl ?? null;
    },
  });

  const related = eventCover(title);
  const originalSrc = url?.startsWith("storage:") ? signed.data : url;
  const customSrc = originalSrc && !failed.includes(originalSrc) ? originalSrc : related?.url;
  const isFallback = !customSrc || failed.includes(customSrc);
  const imageSrc = isFallback ? (FALLBACK_COVERS[interest] ?? stageCover) : customSrc;
  const imageFailed = failed.includes(imageSrc);
  const Icon = icons[interest as keyof typeof icons] ?? CalendarDays;
  const label = labels[interest] ?? "Evento cultural";

  return (
    <div className={compact ? "relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-card sm:w-24" : "relative aspect-video w-full overflow-hidden rounded-sm border border-border bg-card"} title={customSrc === related?.url ? related?.credit : undefined}>
      {!imageFailed && <img
        src={imageSrc}
        width={1536}
        height={1024}
        alt={title}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(previous => previous.includes(imageSrc) ? previous : [...previous, imageSrc])}
        className={compact ? "h-full w-full object-contain" : "h-full w-full object-cover transition-transform duration-700 ease-cine group-hover:scale-105"}
      />}
      {!compact && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />}
      {isFallback && <div className={compact ? "absolute inset-x-1 bottom-2" : "absolute inset-x-4 bottom-4"}>
        <p className={compact ? "line-clamp-3 break-words font-display text-xs leading-tight text-foreground" : "line-clamp-3 break-words font-display text-xl leading-tight text-foreground sm:text-3xl"}>{title}</p>
        {!compact && <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">Portada ilustrada</p>}
      </div>}
      {!compact && !isFallback && customSrc === related?.url && <p className="absolute inset-x-3 bottom-2 text-[10px] text-foreground">{related?.credit}</p>}
      {!compact && <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md">
        <Icon className="size-3.5 text-primary" />
        <span>{label}</span>
      </div>}
    </div>
  );
}
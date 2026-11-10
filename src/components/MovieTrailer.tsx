import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MovieTrailer({ videoKey, title, posterUrl }: { videoKey: string; title: string; posterUrl: string | null }) {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="px-4" aria-label="Tráiler">
      <h2 className="mb-4 font-display text-2xl">Tráiler</h2>
      <div className="relative aspect-video overflow-hidden rounded-sm bg-secondary">
        {playing ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`} title={`Tráiler de ${title}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
        ) : (
          <Button variant="ghost" onClick={() => setPlaying(true)} aria-label={`Reproducir tráiler de ${title}`} className="relative h-full w-full rounded-none p-0">
            {posterUrl && <img src={posterUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
            <span className="relative flex size-14 items-center justify-center rounded-full border border-border bg-background/80 text-foreground"><Play className="size-6" /></span>
          </Button>
        )}
      </div>
    </section>
  );
}
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Film, Music, BookOpen, Palette, Drama, CalendarDays } from "lucide-react";

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

const FALLBACK_COVERS: Record<string, string[]> = {
  theater: [
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
  ],
  music: [
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  ],
  movie: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80",
  ],
  art: [
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80",
  ],
  book: [
    "https://images.unsplash.com/photo-1507842229453-76421376d436?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
  ],
  festival: [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
  ],
};

function getFallback(interest: string, title: string) {
  const pool = FALLBACK_COVERS[interest] ?? FALLBACK_COVERS.festival;
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return pool[Math.abs(hash) % pool.length];
}

export function EventImage({ title, interest, url }: { title: string; interest: string; url: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  const signed = useQuery({
    queryKey: ["event-photo", url],
    enabled: !!url?.startsWith("storage:"),
    staleTime: 3000000,
    queryFn: async () => {
      const r = await supabase.storage.from("event-photos").createSignedUrl(url?.slice(8) ?? "", 3600);
      return r.data?.signedUrl ?? null;
    },
  });

  const customSrc = url?.startsWith("storage:") ? signed.data : url;
  const isFallback = !customSrc || failed === customSrc;
  const imageSrc = isFallback ? getFallback(interest, title) : customSrc;
  const Icon = icons[interest as keyof typeof icons] ?? CalendarDays;
  const label = labels[interest] ?? "Evento cultural";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border bg-card">
      <img
        src={imageSrc}
        alt={title}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (customSrc) setFailed(customSrc);
        }}
        className="h-full w-full object-cover transition-transform duration-700 ease-cine group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md">
        <Icon className="size-3.5 text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}
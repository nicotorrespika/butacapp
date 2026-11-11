import { useState } from 'react';
import { UserRound } from 'lucide-react';

export function TopPortrait({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-muted-foreground">
    {url && failed !== url ? <img src={url} alt={name} loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(url)} /> : <UserRound aria-label={`Retrato de ${name} no disponible`} className="size-8" />}
  </span>;
}
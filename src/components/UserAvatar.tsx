import { cn } from "@/lib/utils";

/** Initial-based avatar (uses the photo when available). */
export function UserAvatar({
  name,
  url,
  className,
}: {
  name: string | null | undefined;
  url?: string | null | undefined;
  className?: string | undefined;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      title={name ?? undefined}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-display text-base text-primary ring-2 ring-background",
        className,
      )}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initial}
    </span>
  );
}

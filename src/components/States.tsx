import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Calm, centered empty state with optional action. */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center animate-rise", className)}>
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-border [&_svg]:size-7">
        {icon}
      </div>
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      {children && <p className="mt-2 max-w-xs text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle />}
      title="Algo falló"
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
    >
      {message ?? "No pudimos cargar esto. Revisá tu conexión."}
    </EmptyState>
  );
}

/** Shimmer placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} />;
}

/** Grid of poster-shaped skeletons. */
export function PosterGridSkeleton({ count = 6, aspect = "aspect-[2/3]" }: { count?: number; aspect?: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className={aspect} />
          <Skeleton className="mt-2 h-3.5 w-4/5" />
          <Skeleton className="mt-1.5 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

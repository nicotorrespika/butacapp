import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_SCORE } from "@/lib/ratings";

interface StarRatingProps {
  value: number | null;
  onChange?: (score: number | null) => void;
  size?: "sm" | "lg";
  label?: string;
}

/**
 * 1–5 stars. Interactive when onChange is given (44px targets);
 * tapping the current score again clears it.
 */
export function StarRating({ value, onChange, size = "lg", label = "Tu nota" }: StarRatingProps) {
  const stars = Array.from({ length: MAX_SCORE }, (_, i) => i + 1);
  if (!onChange) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`${value ?? 0} de ${MAX_SCORE}`}>
        {stars.map((s) => (
          <Star
            key={s}
            className={cn(
              size === "sm" ? "size-3.5" : "size-5",
              value && s <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground/40",
            )}
          />
        ))}
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center">
      {stars.map((s) => {
        const active = value !== null && s <= value;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
            onClick={() => onChange(value === s ? null : s)}
            className="flex h-11 w-11 items-center justify-center transition-transform active:scale-90"
          >
            <Star
              className={cn(
                "size-7 transition-all duration-200",
                active ? "fill-primary text-primary drop-shadow-[0_0_8px_var(--primary)]" : "text-muted-foreground/50",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

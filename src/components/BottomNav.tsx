import { Link } from "@tanstack/react-router";
import { Library, Search, User } from "lucide-react";

const TABS = [
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/lists", label: "Mis listas", icon: Library },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

/** Thumb-friendly bottom tab bar (fixed, respects the iOS safe area). */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 pb-safe backdrop-blur-xl"
    >
      <ul className="mx-auto flex h-[var(--nav-height)] max-w-xl items-stretch">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="group flex h-full min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-wide text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <Icon className="size-[22px] transition-transform duration-300 ease-cine group-active:scale-90" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

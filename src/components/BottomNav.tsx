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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-safe"
    >
      <ul className="mx-auto flex h-[var(--nav-height)] max-w-xl items-stretch">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="group flex h-full min-h-11 flex-col items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-foreground"
            >
              <Icon strokeWidth={1.5} className="size-5 transition-colors group-data-[status=active]:text-primary" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

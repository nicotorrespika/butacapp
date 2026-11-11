import { Link } from "@tanstack/react-router";
import { Home, Search, User, Bell } from "lucide-react";
import {useAvisos} from "@/hooks/use-avisos";

const TABS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/avisos", label: "Avisos", icon: Bell },
  { to: "/profile", label: "Perfil", icon: User },
] as const;

/** Fixed top navigation on phones, bottom navigation on larger screens. */
export function BottomNav() {
  const count=useAvisos();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background pt-[env(safe-area-inset-top)] sm:top-auto sm:bottom-0 sm:border-b-0 sm:border-t sm:pt-0 sm:pb-safe"
    >
      <ul className="mx-auto flex h-[var(--nav-height)] max-w-xl items-stretch">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{exact:true}}
              className="group flex h-full min-h-11 flex-col items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors data-[status=active]:text-foreground"
            >
              <Icon strokeWidth={1.5} className="size-5 transition-colors group-data-[status=active]:text-primary" />
              <span className="relative">{label}{to==="/avisos"&&!!count.data&&<span className="absolute -right-4 -top-1 text-[10px] text-primary">{count.data}</span>}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

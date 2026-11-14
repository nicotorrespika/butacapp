import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { InstallInvitation } from "@/components/InstallInvitation";
import { registerAppWorker } from "@/lib/register-app-worker";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Fin del rollo</p>
        <h1 className="mt-3 font-display text-6xl text-foreground">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">Esta escena no existe o fue cortada en edición.</p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-foreground">Se cortó la proyección</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo salió mal. Probá de nuevo o volvé al inicio.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-input px-5 text-sm font-semibold text-foreground"
          >
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({staticData:{sitemap:false},
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#14181c" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "MOMENTO BUTACA" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "MOMENTO BUTACA / tu daily artístico" },
      {
        name: "description",
        content: "Armá listas compartidas de películas, discos y obras de arte. Marcá, puntuá y comentá en grupo.",
      },
      { property: "og:title", content: "MOMENTO BUTACA / tu daily artístico" },
      { property: "og:description", content: "Listas compartidas para ver, escuchar y visitar en grupo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Big+Shoulders+Display:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { void registerAppWorker().catch(() => {}); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InstallInvitation />
        {/* Required: nested routes render here. */}
        <Outlet />
        <Toaster position="top-center" theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Disc3, Film, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { takePendingRedirect, useAuth } from "@/hooks/use-auth";
import hero from "@/assets/hero-theater.jpg";
import { HomeExperience } from "@/components/HomeExperience";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Butaca — listas compartidas de cine, música y arte" },
      {
        name: "description",
        content: "Armá watchlists colaborativas: buscá películas, discos y obras, marcalas, puntualas y comentalas en grupo.",
      },
      { property: "og:title", content: "Butaca — listas compartidas de cine, música y arte" },
      { property: "og:description", content: "Watchlists colaborativas para ver, escuchar y visitar en grupo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
function Home(){return <div className="mx-auto max-w-5xl pb-nav"><HomeExperience/><BottomNav/></div>;}

/** Public landing. Signed-in visitors (incl. OAuth returns) go straight to their lists. */
function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: takePendingRedirect() ?? "/lists", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <img
        src={hero}
        alt="Sala de cine a oscuras con el haz del proyector"
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-poster-fade" />

      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-8">
        <span className="font-display text-2xl">
          Butaca<span className="text-primary">.</span>
        </span>

        <div className="mt-auto animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Listas en grupo</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.92]">
            Lo que vamos a <em className="text-gradient-amber">ver</em>, escuchar y visitar.
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Una lista compartida, un buscador para todo, y las notas de todos en un solo lugar.
          </p>

          <ul className="mt-6 flex gap-2 text-xs text-muted-foreground">
            {[
              { i: Film, t: "Películas" },
              { i: Disc3, t: "Música" },
              { i: Palette, t: "Arte" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-2 backdrop-blur">
                <Icon className="size-3.5 text-primary" /> {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Empezar</Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link to="/auth">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

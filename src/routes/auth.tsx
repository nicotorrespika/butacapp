import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePendingRedirect, useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import hero from "@/assets/hero-theater.jpg";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — Butaca" },
      { name: "description", content: "Iniciá sesión o creá tu cuenta para armar listas compartidas." },
      { property: "og:title", content: "Entrar — Butaca" },
      { property: "og:description", content: "Iniciá sesión para armar listas de cine, música y arte en grupo." },
    ],
  }),
  component: AuthPage,
});

/** Only same-origin relative paths are accepted as post-login targets. */
function safePath(redirect: string | undefined): string {
  if (!redirect) return "/lists";
  try {
    const u = new URL(redirect, window.location.origin);
    if (u.origin !== window.location.origin) return "/lists";
    const p = u.pathname + u.search;
    return p.startsWith("/auth") ? "/lists" : p;
  } catch {
    return "/lists";
  }
}

type Mode = "signin" | "signup" | "magic" | "forgot";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  // Already signed in (or just signed in) → go to the intended page.
  useEffect(() => {
    if (!loading && user) navigate({ to: safePath(redirect), replace: true });
  }, [user, loading, redirect, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const target = safePath(redirect);
    savePendingRedirect(target);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setSent("Te mandamos un email para confirmar tu cuenta. Abrilo desde este dispositivo.");
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setSent("Revisá tu correo: te mandamos un link mágico para entrar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Si existe una cuenta con ese email, te llegará un link para cambiar la contraseña.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg.includes("Invalid login") ? "Email o contraseña incorrectos" : msg);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    savePendingRedirect(safePath(redirect));
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("No se pudo entrar con Google");
  }

  const TABS: { id: Mode; label: string }[] = [
    { id: "signin", label: "Entrar" },
    { id: "signup", label: "Crear cuenta" },
  ];

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <img
        src={hero}
        alt=""
        width={1024}
        height={1536}
        className="absolute inset-0 h-[55dvh] w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 h-[56dvh] bg-poster-fade" />

      <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-end px-5 pb-10 pt-24">
        <Link to="/" className="mb-auto font-display text-2xl text-foreground">
          Butaca<span className="text-primary">.</span>
        </Link>

        <h1 className="font-display text-5xl leading-[0.95] text-foreground animate-rise">
          Tu próxima <em className="text-gradient-amber">función</em>, en grupo.
        </h1>

        <div className="mt-8 rounded-3xl border border-border bg-card/90 p-5 backdrop-blur-xl animate-rise">
          {sent ? (
            <div className="py-6 text-center">
              <Mail className="mx-auto size-10 text-primary" />
              <p className="mt-4 text-sm text-foreground">{sent}</p>
              <Button variant="ghost" className="mt-4" onClick={() => setSent(null)}>
                Volver
              </Button>
            </div>
          ) : (
            <>
              {(mode === "signin" || mode === "signup") && (
                <div className="mb-5 grid grid-cols-2 rounded-full bg-secondary p-1">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMode(t.id)}
                      className={cn(
                        "h-10 rounded-full text-sm font-semibold transition-colors",
                        mode === t.id ? "bg-background text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              {(mode === "magic" || mode === "forgot") && (
                <p className="mb-4 font-display text-2xl">
                  {mode === "magic" ? "Entrar con link mágico" : "Recuperar contraseña"}
                </p>
              )}

              <form onSubmit={submit} className="space-y-3">
                {mode === "signup" && (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    className="h-12 rounded-xl text-base"
                    required
                  />
                )}
                <Input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="h-12 rounded-xl text-base"
                  required
                />
                {(mode === "signin" || mode === "signup") && (
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={6}
                    className="h-12 rounded-xl text-base"
                    required
                  />
                )}
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === "signin" && "Entrar"}
                  {mode === "signup" && "Crear cuenta"}
                  {mode === "magic" && "Enviarme el link"}
                  {mode === "forgot" && "Enviar link de recuperación"}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
              </div>

              <GoogleButton onClick={google} />

              <div className="mt-4 flex flex-wrap justify-center gap-x-4 text-sm">
                {mode !== "magic" ? (
                  <button type="button" className="min-h-11 text-primary" onClick={() => setMode("magic")}>
                    Usar link mágico
                  </button>
                ) : (
                  <button type="button" className="min-h-11 text-primary" onClick={() => setMode("signin")}>
                    Usar contraseña
                  </button>
                )}
                {mode === "signin" && (
                  <button type="button" className="min-h-11 text-muted-foreground" onClick={() => setMode("forgot")}>
                    Olvidé mi contraseña
                  </button>
                )}
                {mode === "forgot" && (
                  <button type="button" className="min-h-11 text-muted-foreground" onClick={() => setMode("signin")}>
                    Volver
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/** Google's branded button (dark theme per Google guidelines). */
function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#8E918F] bg-[#131314] px-3 text-sm font-medium text-[#E3E3E3] transition-opacity active:opacity-80"
    >
      <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.450 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.350.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
      </svg>
      Continuar con Google
    </button>
  );
}

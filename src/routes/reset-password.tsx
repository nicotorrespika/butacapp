import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({staticData:{sitemap:false},
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Nueva contraseña — MOMENTO BUTACA" },
      { name: "description", content: "Elegí una nueva contraseña para tu cuenta de MOMENTO BUTACA." },
      { property: "og:title", content: "Nueva contraseña — MOMENTO BUTACA" },
      { property: "og:description", content: "Elegí una nueva contraseña para tu cuenta." },
    ],
  }),
  component: ResetPassword,
});

/** Landing page of the password-recovery email link. */
function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error("No se pudo cambiar", { description: error.message });
    toast.success("Contraseña actualizada");
    navigate({ to: "/lists", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <h1 className="font-display text-4xl">Nueva contraseña</h1>
      <p className="mt-2 text-sm text-muted-foreground">Elegí una contraseña de al menos 6 caracteres.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          autoComplete="new-password"
          placeholder="Nueva contraseña"
          className="h-12 rounded-xl text-base"
          required
        />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Guardar
        </Button>
      </form>
    </main>
  );
}

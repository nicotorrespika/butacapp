import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { keys, myListsQuery, useMyProfile } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — Butaca" },
      { name: "description", content: "Tu perfil y preferencias en Butaca." },
      { property: "og:title", content: "Perfil — Butaca" },
      { property: "og:description", content: "Tu perfil en Butaca." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const profile = useMyProfile(user?.id);
  const lists = useQuery(myListsQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile.data) setName(profile.data.display_name);
  }, [profile.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) return void toast.error("No se pudo guardar", { description: error.message });
    toast.success("Nombre actualizado");
    qc.invalidateQueries({ queryKey: keys.profile(user.id) });
    qc.invalidateQueries({ queryKey: ["list"] });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const owned = lists.data?.filter((l) => l.owner_id === user?.id).length ?? 0;
  const shared = (lists.data?.length ?? 0) - owned;
  const items = lists.data?.reduce((a, l) => a + l.itemCount, 0) ?? 0;

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <h1 className="font-display text-4xl">Perfil</h1>

      <div className="mt-6 flex items-center gap-4 animate-rise">
        <UserAvatar
          name={profile.data?.display_name || user?.email}
          url={profile.data?.avatar_url}
          className="size-20 text-4xl ring-primary/40"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-3xl">{profile.data?.display_name || "…"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
        {[
          ["Mis listas", owned],
          ["Compartidas", shared],
          ["Ítems", items],
        ].map(([label, n]) => (
          <div key={label} className="p-4 text-center">
            <dd className="font-display text-3xl text-primary">{n}</dd>
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>

      <form onSubmit={save} className="mt-8 space-y-2">
        <label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cómo te ven los demás
        </label>
        <div className="flex gap-2">
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="h-11 flex-1 rounded-full px-4 text-base"
          />
          <Button type="submit" variant="secondary" disabled={saving || !name.trim() || name === profile.data?.display_name}>
            {saving ? <Loader2 className="animate-spin" /> : "Guardar"}
          </Button>
        </div>
      </form>

      <Button variant="outline" size="lg" className="mt-10 w-full" onClick={signOut}>
        <LogOut /> Cerrar sesión
      </Button>
    </div>
  );
}

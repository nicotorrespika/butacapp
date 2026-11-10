import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Crown, Link2, Loader2, Mail, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { UserAvatar } from "@/components/UserAvatar";
import { keys, type ListDetail } from "@/lib/queries";

/**
 * Invite collaborators:
 *  - Link: a reusable token link anyone can open to join.
 *  - Email: records an email invite (auto-joins when that person signs in
 *    with the same email) and opens the mail app with the link.
 */
export function InviteDrawer({
  open,
  onOpenChange,
  detail,
  userId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  detail: ListDetail;
  userId: string;
}) {
  const qc = useQueryClient();
  const { list, members } = detail;
  const isOwner = list.owner_id === userId;
  const [link, setLink] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  // Reuse my existing link invite for this list, or create one.
  useEffect(() => {
    if (!open || link) return;
    (async () => {
      const { data: existing } = await supabase
        .from("list_invites")
        .select("token")
        .eq("list_id", list.id)
        .eq("created_by", userId)
        .is("email", null)
        .limit(1)
        .maybeSingle();
      let token = existing?.token;
      if (!token) {
        const { data, error } = await supabase
          .from("list_invites")
          .insert({ list_id: list.id, created_by: userId })
          .select("token")
          .single();
        if (error) return void toast.error("No se pudo generar el link", { description: error.message });
        token = data.token;
      }
      setLink(`${window.location.origin}/invite/${token}`);
    })();
  }, [open, link, list.id, userId]);

  const message = `Sumate a mi lista «${list.name}» en Butaca`;

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  }

  async function share() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: list.name, text: message, url: link });
      } catch {
        /* user cancelled */
      }
    } else copy();
  }

  async function inviteByEmail(e: React.FormEvent) {
    e.preventDefault();
    const to = email.trim().toLowerCase();
    if (!to || !link) return;
    setBusy(true);
    const { error } = await supabase.from("list_invites").insert({ list_id: list.id, created_by: userId, email: to });
    setBusy(false);
    if (error) return void toast.error("No se pudo invitar", { description: error.message });
    toast.success(`Invitación guardada para ${to}`, {
      description: "Entra automáticamente cuando inicie sesión con ese email.",
    });
    setEmail("");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(message)}&body=${encodeURIComponent(
      `${message}:\n\n${link}`,
    )}`;
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from("list_members").delete().eq("list_id", list.id).eq("user_id", memberId);
    if (error) return void toast.error("No se pudo quitar", { description: error.message });
    qc.invalidateQueries({ queryKey: keys.list(list.id) });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-xl border-border bg-card">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-3xl font-normal">Invitar</DrawerTitle>
          <DrawerDescription>Los colaboradores pueden agregar, marcar, puntuar y comentar.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-6 overflow-y-auto px-4 pb-8">
          <section>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 className="size-3.5" /> Por link
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
              <span className="min-w-0 flex-1 truncate py-3 text-sm text-muted-foreground">
                {link ?? "Generando…"}
              </span>
              <Button variant="ghost" size="icon" onClick={copy} disabled={!link} aria-label="Copiar link">
                <Copy />
              </Button>
            </div>
            <Button className="mt-2 w-full" onClick={share} disabled={!link}>
              <Share2 /> Compartir link
            </Button>
          </section>

          <section>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Mail className="size-3.5" /> Por email
            </p>
            <form onSubmit={inviteByEmail} className="flex gap-2">
              <Input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amiga@correo.com"
                className="h-11 flex-1 rounded-full px-4 text-base"
                required
              />
              <Button type="submit" variant="secondary" disabled={busy || !link}>
                {busy ? <Loader2 className="animate-spin" /> : "Invitar"}
              </Button>
            </form>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Miembros · {members.length}
            </p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {members.map((m) => (
                <li key={m.user_id} className="flex min-h-14 items-center gap-3 px-3">
                  <UserAvatar name={m.profile?.display_name} url={m.profile?.avatar_url} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.profile?.display_name || "Sin nombre"}
                    {m.user_id === userId && <span className="text-muted-foreground"> (vos)</span>}
                  </span>
                  {m.role === "owner" ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Crown className="size-3.5" /> Dueño
                    </span>
                  ) : isOwner ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Quitar a ${m.profile?.display_name}`}
                      onClick={() => removeMember(m.user_id)}
                    >
                      <X />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Colaborador</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

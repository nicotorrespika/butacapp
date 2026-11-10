import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/States";
import { LIST_KIND_LABEL, type ListKind } from "@/lib/media";
import { keys } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/invite/$token")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Te invitaron a una lista — Butaca" },
      { name: "description", content: "Sumate a una lista compartida de cine, música y arte." },
      { property: "og:title", content: "Te invitaron a una lista — Butaca" },
      { property: "og:description", content: "Sumate a una lista compartida en Butaca." },
    ],
  }),
  component: InvitePage,
});

/** Invite link landing: preview the list, then join with one tap. */
function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [joining, setJoining] = useState(false);

  const invite = useQuery({
    queryKey: ["invite", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_invite", { _token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  async function join() {
    setJoining(true);
    const { data, error } = await supabase.rpc("accept_invite", { _token: token });
    setJoining(false);
    if (error || !data) return void toast.error("No se pudo unir", { description: error?.message });
    qc.invalidateQueries({ queryKey: keys.myLists });
    toast.success("¡Ya sos parte de la lista!");
    navigate({ to: "/lists/$listId", params: { listId: data }, replace: true });
  }

  if (invite.isLoading) {
    return (
      <div className="space-y-3 px-6 pt-24">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto h-10 w-2/3" />
      </div>
    );
  }

  if (!invite.data) {
    return (
      <EmptyState
        icon={<Ticket />}
        title="Invitación no válida"
        className="pt-24"
        action={
          <Button asChild variant="outline">
            <Link to="/lists">Ir a mis listas</Link>
          </Button>
        }
      >
        El link pudo haber expirado o la lista fue borrada.
      </EmptyState>
    );
  }

  const i = invite.data;
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center animate-rise">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
        <Ticket className="size-7" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        {i.owner_name} te invita
      </p>
      <h1 className="mt-2 font-display text-5xl leading-[0.95]">{i.name}</h1>
      {i.description && <p className="mt-3 max-w-xs text-sm text-muted-foreground">{i.description}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        {LIST_KIND_LABEL[i.kind as ListKind]} · {i.member_count} miembro{i.member_count === 1 ? "" : "s"}
      </p>
      <Button size="lg" className="mt-8 w-full max-w-xs" onClick={join} disabled={joining}>
        {joining && <Loader2 className="animate-spin" />} Unirme a la lista
      </Button>
    </div>
  );
}

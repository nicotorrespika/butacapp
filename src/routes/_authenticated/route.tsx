import { useEffect } from "react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { keys } from "@/lib/queries";

/**
 * Gate for every signed-in page. Client-only because the session lives in
 * the browser; unauthenticated visitors go to /auth and come back afterwards.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: AppShell,
});

function AppShell() {
  const qc = useQueryClient();

  // Join any lists that invited this user's email (once per app load).
  useEffect(() => {
    supabase.rpc("claim_email_invites").then(({ data }) => {
      if (data && data > 0) qc.invalidateQueries({ queryKey: keys.myLists });
    });
  }, [qc]);

  return (
    <div className="relative min-h-dvh">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center px-4"><Link to="/" className="py-3 font-display text-xl">BUTACAPP</Link></div>
      <main className="mx-auto w-full max-w-5xl pb-nav">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

/**
 * Session context for UI (header avatar, "who am I" checks).
 * Route protection lives in src/routes/_authenticated/route.tsx — this is only for display.
 * The single onAuthStateChange listener of the app lives here.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listener first, then hydrate the current session.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Pending post-login destination (used for invite links + Google OAuth round-trip). */
const REDIRECT_KEY = "wl:redirect";
export function savePendingRedirect(path: string | undefined) {
  if (typeof window === "undefined") return;
  if (path && path.startsWith("/") && !path.startsWith("//")) sessionStorage.setItem(REDIRECT_KEY, path);
}
export function takePendingRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
}

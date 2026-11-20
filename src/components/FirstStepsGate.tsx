import { type ReactNode } from 'react';
import { Navigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { useTastes } from '@/hooks/use-tastes';
import { Button } from './ui/button';

/** Defer only signed-in app screens; public share/auth pages remain accessible. */
export function FirstStepsGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { settings } = useTastes();
  const { pathname, privateScreen } = useRouterState({ select: s => ({ pathname: s.location.pathname, privateScreen: s.matches.some(m => m.routeId.startsWith('/_authenticated')) }) });
  if (pathname === '/primeros-pasos' || (pathname !== '/' && !privateScreen)) return children;
  if (loading || (user && settings.isPending)) return <p role="status" className="px-5 py-12 text-sm text-muted-foreground">Preparando tu butaca…</p>;
  if (!user) return children;
  if (settings.isError) return <main className="mx-auto max-w-md px-5 py-16"><p className="text-sm text-muted-foreground">No pudimos cargar tus primeros pasos.</p><Button className="mt-4" onClick={() => void settings.refetch()}>Probar de nuevo</Button></main>;
  if (!settings.data?.onboarding_done) return <Navigate to="/primeros-pasos" replace/>;
  return children;
}
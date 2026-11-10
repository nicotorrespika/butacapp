import { Film, KeyRound, SearchX } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/States";

/** Friendly states for movie/person pages when TMDB can't answer. */
export function FetchProblem({ reason, onRetry }: { reason: "no_key" | "not_found" | "provider"; onRetry: () => void }) {
  const back = (
    <Button asChild variant="outline">
      <Link to="/search">Volver a buscar</Link>
    </Button>
  );
  if (reason === "not_found")
    return (
      <EmptyState icon={<SearchX />} title="No la encontramos" action={back}>
        Puede que no esté en el catálogo de películas.
      </EmptyState>
    );
  if (reason === "no_key")
    return (
      <EmptyState icon={<KeyRound />} title="Falta conectar el catálogo" action={back}>
        Para ver fichas, filmografías y sugerencias hace falta la clave de TMDB.
      </EmptyState>
    );
  return (
    <ErrorState
      message="El catálogo de películas no respondió. Si recién cargaste la clave de TMDB, revisá que sea la correcta."
      onRetry={onRetry}
    />
  );
}

export { Film };

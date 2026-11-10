import { useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Goes back in history; falls back to search when the page was opened directly. */
export function BackButton() {
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <Button
      variant="glass"
      size="sm"
      aria-label="Volver"
      onClick={() => (window.history.length > 1 ? router.history.back() : void navigate({ to: "/search" }))}
    >
      <ArrowLeft className="size-5" />
      Atrás
    </Button>
  );
}

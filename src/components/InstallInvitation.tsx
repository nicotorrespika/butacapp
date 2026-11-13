import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "./ui/button";
import { installDismissedRecently } from "@/lib/pwa-policy";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const dismissalKey = "butacapp-install-dismissed";

export function InstallInvitation() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [guide, setGuide] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const installed = standalone.matches || ("standalone" in navigator && navigator.standalone === true);
    const recent = installDismissedRecently(localStorage.getItem(dismissalKey), Date.now());
    const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(apple);
    if (!installed && !recent && window.self === window.top) setHidden(false);
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const done = () => { setHidden(true); setPrompt(null); };
    const changed = () => { if (standalone.matches) done(); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    standalone.addEventListener("change", changed);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", done); standalone.removeEventListener("change", changed); };
  }, []);
  if (hidden || (!ios && !prompt)) return null;
  return <aside aria-label="Instalar MOMENTO BUTACA" className="fixed inset-x-3 z-50 rounded-sm border border-border bg-card px-3 py-2 bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom)+0.75rem)]">
    <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <Button variant="ghost" className="h-auto min-h-11 min-w-0 justify-start whitespace-normal px-0 text-left text-sm" onClick={async () => { if (ios) { setGuide(!guide); return; } if (!prompt) return; await prompt.prompt(); const choice = await prompt.userChoice; setPrompt(null); if (choice.outcome === "accepted") setHidden(true); }}><Download className="shrink-0 size-4"/>Instalá MOMENTO BUTACA en tu celular</Button>
      <Button variant="ghost" size="icon" aria-label="Cerrar invitación a instalar" onClick={() => { localStorage.setItem(dismissalKey, String(Date.now())); setHidden(true); }}><X className="size-4"/></Button>
    </div>
    {ios && guide && <p className="mx-auto max-w-3xl pb-2 text-xs leading-5 text-muted-foreground">En Safari, tocá Compartir <Share className="inline size-3"/> y luego «Añadir a pantalla de inicio».</p>}
  </aside>;
}
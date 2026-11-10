import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/use-auth";
import { LIST_KIND_LABEL, type ListKind } from "@/lib/media";
import { keys, type ListRow } from "@/lib/queries";
import { cn } from "@/lib/utils";

const KINDS: ListKind[] = ["mixed", "movies", "music", "art"];

/** Form to create a list; reused inside the add-to-list sheet. */
export function CreateListForm({
  defaultKind = "mixed",
  onCreated,
  submitLabel = "Crear lista",
}: {
  defaultKind?: ListKind;
  onCreated: (list: ListRow) => void;
  submitLabel?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<ListKind>(defaultKind);
  const [saving, setSaving] = useState(false);
  const [visibility,setVisibility]=useState("private");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("lists")
      .insert({ name: name.trim(), description: description.trim(), kind, visibility, owner_id: user.id })
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("No se pudo crear la lista", { description: error?.message });
      return;
    }
    qc.invalidateQueries({ queryKey: keys.myLists });
    onCreated(data);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label htmlFor="list-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nombre
        </label>
        <Input
          id="list-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Ciclo de domingos"
          className="h-12 rounded-xl text-base"
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="list-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Descripción corta
        </label>
        <Textarea
          id="list-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder="Para ver con amigos antes de fin de año"
          className="rounded-xl text-base"
        />
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</span>
        <div className="grid grid-cols-4 gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={cn(
                "h-11 rounded-xl border text-xs font-semibold transition-colors",
                kind === k
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary text-muted-foreground",
              )}
            >
              {LIST_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      <label className="text-sm text-muted-foreground">Quién puede verla<select aria-label="Quién puede verla" value={visibility} onChange={e=>setVisibility(e.target.value)} className="mt-2 h-11 w-full rounded-sm border border-input bg-background px-3"><option value="private">Solo colaboradores</option><option value="friends">Amigos</option><option value="public">Cualquiera</option></select></label>
      <Button type="submit" size="lg" disabled={saving || !name.trim()} className="mt-2">
        {saving && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

export function CreateListDrawer({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (list: ListRow) => void;
  trigger?: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-xl border-border bg-card">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-3xl font-normal">Nueva lista</DrawerTitle>
          <DrawerDescription>Después podés invitar a quien quieras.</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8">
          <CreateListForm onCreated={onCreated} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

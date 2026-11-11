import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";

/** Mobile-friendly confirmation dialog replacing native confirm(). */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirmar", destructive = false, onConfirm }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DrawerHeader>
        <div className="flex gap-2 px-4 pb-8">
          <Button variant="outline" className="min-h-12 flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant={destructive ? "destructive" : "default"} className="min-h-12 flex-1" onClick={() => { onOpenChange(false); onConfirm(); }}>{confirmLabel}</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** Mobile-friendly text-input dialog replacing native prompt(). */
export function PromptDialog({ open, onOpenChange, title, placeholder = "", confirmLabel = "Enviar", maxLength = 1000, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  maxLength?: number;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  useEffect(() => { if (open) setValue(""); }, [open]);
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
        <div className="space-y-3 px-4 pb-8">
          <textarea
            aria-label={title}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={maxLength}
            rows={3}
            placeholder={placeholder}
            className="w-full resize-y rounded-sm border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="min-h-12 flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="min-h-12 flex-1" disabled={!value.trim()} onClick={() => { const v = value.trim(); onOpenChange(false); onSubmit(v); }}>{confirmLabel}</Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

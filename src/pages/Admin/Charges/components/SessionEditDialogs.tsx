import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ChargeSession } from "@/adapters/api";
import { useSetSessionPrice, useWaiveSession } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { centsToInput, formatPrice, formatShortDay, inputToCents } from "../chargesUtils";

const who = (s: ChargeSession) => `${s.firstName} ${s.lastName} · ${formatShortDay(s.startsAt)} · ${s.serviceName}`;

// A different price for one session (discount, special rate…). It stays on the
// session even if the service's price changes later
export function PriceDialog({ session, onClose }: { session: ChargeSession | null; onClose: () => void }) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {session && <PriceForm key={session.id} session={session} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function PriceForm({ session, onClose }: { session: ChargeSession; onClose: () => void }) {
  const [value, setValue] = useState(centsToInput(session.priceCents));
  const save = useSetSessionPrice();
  const parsed = inputToCents(value);
  // 0 € isn't a price: not charging a session is "No cobrar esta sesión"
  const cents = parsed !== null && parsed > 0 ? parsed : null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (cents === null) return;
        save.mutate(
          { sessionId: session.id, priceCents: cents },
          {
            onSuccess: () => {
              toast.success(`Precio cambiado a ${formatPrice(cents)}`);
              onClose();
            },
            onError: (error) => toast.error("No se pudo cambiar el precio", { description: error.message }),
          },
        );
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>Cambiar precio</DialogTitle>
        <DialogDescription>{who(session)}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="session-price">Precio de esta sesión</Label>
        <div className="relative">
          <Input
            id="session-price"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={cents === null}
            className="pr-7 tabular-nums"
            autoFocus
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            €
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {parsed === 0
            ? "Para no cobrarla, usa «No cobrar esta sesión»: así queda el motivo."
            : "Solo esta sesión. El precio del servicio no cambia."}
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="rounded-full" disabled={cents === null || save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}

// "Sin cargo": the clinic decides not to charge this session (with a reason)
export function WaiveDialog({ session, onClose }: { session: ChargeSession | null; onClose: () => void }) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {session && <WaiveForm key={session.id} session={session} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function WaiveForm({ session, onClose }: { session: ChargeSession; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const waive = useWaiveSession();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        waive.mutate(
          { sessionId: session.id, reason: reason.trim() },
          {
            onSuccess: () => {
              toast.success("Sesión marcada sin cargo");
              onClose();
            },
            onError: (error) => toast.error("No se pudo marcar", { description: error.message }),
          },
        );
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>No cobrar esta sesión</DialogTitle>
        <DialogDescription>{who(session)}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="waive-reason">Motivo</Label>
        <Textarea
          id="waive-reason"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Revisión de cortesía, primera falta…"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">Se puede deshacer más adelante.</p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={waive.isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="rounded-full" disabled={!reason.trim() || waive.isPending}>
          {waive.isPending && <Loader2 className="animate-spin" />}
          Marcar sin cargo
        </Button>
      </DialogFooter>
    </form>
  );
}

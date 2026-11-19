import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ChargeSession, PaymentMethod } from "@/adapters/api";
import { useCreatePayment } from "@/adapters/hook";
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
import { cn } from "@/lib/utils";
import {
  centsToInput,
  formatPrice,
  formatShortDay,
  inputToCents,
  localDay,
  methodLabels,
  methodOrder,
} from "../chargesUtils";

type Props = {
  // The sessions to charge. null: closed
  sessions: ChargeSession[] | null;
  onClose: () => void;
  // After a successful charge (e.g. to clear the selection)
  onCharged?: () => void;
};

// One payment for one or more sessions: price of each (editable), how they
// paid, which day and an optional note
export default function ChargeDialog({ sessions, onClose, onCharged }: Props) {
  return (
    <Dialog open={!!sessions} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* key: a fresh form for every new set of sessions */}
        {sessions && (
          <ChargeForm
            key={sessions.map((s) => s.id).join()}
            sessions={sessions}
            onClose={onClose}
            onCharged={onCharged}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChargeForm({ sessions, onClose, onCharged }: Required<Pick<Props, "onClose">> & {
  sessions: ChargeSession[];
  onCharged?: () => void;
}) {
  const today = localDay(new Date());
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(sessions.map((s) => [s.id, centsToInput(s.priceCents)])),
  );
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState("");
  const create = useCreatePayment();

  const cents = sessions.map((s) => inputToCents(prices[s.id] ?? ""));
  const pricesOk = cents.every((c) => c !== null && c > 0);
  const total = cents.reduce<number>((sum, c) => sum + (c ?? 0), 0);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(paidOn) && paidOn <= today;
  const unconfirmed = sessions.filter((s) => s.state === "to_confirm").length;
  const upcoming = sessions.filter((s) => s.state === "upcoming").length;

  const submit = () =>
    create.mutate(
      {
        sessions: sessions.map((s, i) => ({
          sessionId: s.id,
          ...(cents[i] !== s.priceCents ? { priceCents: cents[i]! } : {}),
        })),
        method,
        ...(paidOn !== today ? { paidOn } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success(`Cobro de ${formatPrice(total)} registrado`);
          onCharged?.();
          onClose();
        },
        onError: (error) => toast.error("No se pudo cobrar", { description: error.message }),
      },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Cobrar {sessions.length === 1 ? "la sesión" : `${sessions.length} sesiones`}
        </DialogTitle>
        <DialogDescription>Queda registrado en Cobros. No es una factura.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <ul className="flex max-h-60 flex-col divide-y overflow-y-auto rounded-xl border">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-3 py-2">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {s.firstName} {s.lastName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatShortDay(s.startsAt)} · {s.serviceName}
                </span>
              </div>
              <div className="relative w-24 shrink-0">
                <Input
                  inputMode="decimal"
                  aria-label={`Precio de la sesión de ${s.firstName}`}
                  value={prices[s.id]}
                  onChange={(e) => setPrices((p) => ({ ...p, [s.id]: e.target.value }))}
                  aria-invalid={!(inputToCents(prices[s.id] ?? "") ?? 0)}
                  className="pr-6 text-right tabular-nums"
                  disabled={create.isPending}
                />
                <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
                  €
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Label>Forma de pago</Label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Forma de pago">
            {methodOrder.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                disabled={create.isPending}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  method === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {methodLabels[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="charge-date">Fecha del cobro</Label>
            <Input
              id="charge-date"
              type="date"
              max={today}
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              aria-invalid={!dateOk}
              disabled={create.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="charge-note">
              Nota <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="charge-note"
              rows={1}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Pagó su madre, número de transferencia…"
              disabled={create.isPending}
              className="min-h-9"
            />
          </div>
        </div>

        {(unconfirmed > 0 || upcoming > 0) && (
          <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            {unconfirmed > 0 &&
              `${unconfirmed === 1 ? "La sesión por confirmar se marcará" : `Las ${unconfirmed} sesiones por confirmar se marcarán`} como realizada${unconfirmed === 1 ? "" : "s"}. `}
            {upcoming > 0 &&
              `${upcoming === 1 ? "Una sesión todavía no ha pasado" : `${upcoming} sesiones todavía no han pasado`}: se cobra${upcoming === 1 ? "" : "n"} por adelantado.`}
          </p>
        )}
      </div>

      <DialogFooter className="items-center sm:justify-between">
        <span className="text-lg font-medium tabular-nums">{formatPrice(total)}</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onClose}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={submit}
            disabled={!pricesOk || !dateOk || create.isPending}
          >
            {create.isPending && <Loader2 className="animate-spin" />}
            Cobrar
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

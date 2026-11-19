import { useState } from "react";
import { CircleAlert, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import type { ChargeSession, SessionBonoOption } from "@/adapters/api";
import { useSessionBonos, useUseBono } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { bonoValidity, formatShortDay } from "../chargesUtils";

type Props = {
  session: ChargeSession | null;
  onClose: () => void;
  // No bono can pay it: offer to sell one
  onSell: () => void;
};

// "Pagar con bono": the person's bonos for this session. Those that can't pay
// it say why (another service, expired, no sessions left, weekly limit…). A
// monthly bono over its weekly limit can still be used, with a reason
export default function UseBonoDialog({ session, onClose, onSell }: Props) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {session && <UseBonoForm key={session.id} session={session} onClose={onClose} onSell={onSell} />}
      </DialogContent>
    </Dialog>
  );
}

const shortDay = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00`)).replace(".", "");

// "3 de 10 usadas" / "Semana del 16 al 22 nov: 1 de 2"
function balance(o: SessionBonoOption) {
  const b = o.bono;
  if (b.kind === "sessions") return `${b.usedSessions} de ${b.totalSessions} usadas`;
  const week = o.week ? `Semana del ${shortDay(o.week.from).split(" ")[0]} al ${shortDay(o.week.to)}` : "Esta semana";
  return b.sessionsPerWeek
    ? `${week}: ${o.week?.used ?? 0} de ${b.sessionsPerWeek}`
    : `${week}: ${o.week?.used ?? 0} (sin límite)`;
}

function UseBonoForm({ session, onClose, onSell }: { session: ChargeSession; onClose: () => void; onSell: () => void }) {
  const { data, isPending, error } = useSessionBonos(session.id);
  const use = useUseBono();
  const options = data ?? [];
  const firstUsable = options.find((o) => o.usable)?.bono.id ?? "";
  const [chosen, setChosen] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const selectedId = chosen ?? firstUsable;
  const selected = options.find((o) => o.bono.id === selectedId);
  const needsReason = !!selected && !selected.usable && selected.overridable;
  const ok = !!selected && (selected.usable || (needsReason && !!reason.trim()));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pagar con bono</DialogTitle>
        <DialogDescription>
          {session.firstName} {session.lastName} · {formatShortDay(session.startsAt)} · {session.serviceName}
        </DialogDescription>
      </DialogHeader>

      {isPending ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error.message}
        </p>
      ) : options.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center">
          <Ticket className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {session.patientId
              ? "Este paciente no tiene bonos."
              : "No hay bonos con este nombre. Los bonos sin ficha se buscan por nombre y apellidos."}
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              onClose();
              onSell();
            }}
          >
            Vender un bono
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Bono">
            {options.map((o) => {
              const selectable = o.usable || o.overridable;
              const active = o.bono.id === selectedId;
              return (
                <li key={o.bono.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!selectable}
                    onClick={() => setChosen(o.bono.id)}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : selectable ? "hover:bg-muted" : "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2 text-sm font-medium">
                      {o.bono.name}
                      <span className="text-xs font-normal text-muted-foreground">{balance(o)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {o.bono.serviceName} · {bonoValidity(o.bono)}
                      {!o.bono.payment && " · sin cobrar"}
                    </span>
                    {o.reason && (
                      <span className={cn("text-xs", o.overridable ? "text-amber-700 dark:text-amber-400" : "text-destructive")}>
                        {o.reason}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {needsReason && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="over-limit-reason">Motivo para pasarse del límite</Label>
              <Textarea
                id="over-limit-reason"
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Recupera una sesión de la semana pasada…"
              />
            </div>
          )}
          {!options.some((o) => o.usable || o.overridable) && (
            <p className="text-xs text-muted-foreground">
              Ninguno de sus bonos sirve para esta sesión. Cóbrala suelta o vende un bono nuevo.
            </p>
          )}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={use.isPending}>
          Cancelar
        </Button>
        {options.length > 0 && (
          <Button
            type="button"
            className="rounded-full"
            disabled={!ok || use.isPending}
            onClick={() =>
              use.mutate(
                { sessionId: session.id, bonoId: selectedId, ...(needsReason ? { overLimitReason: reason.trim() } : {}) },
                {
                  onSuccess: () => {
                    toast.success(`Sesión pagada con «${selected!.bono.name}»`);
                    onClose();
                  },
                  onError: (e) => toast.error("No se pudo usar el bono", { description: e.message }),
                },
              )
            }
          >
            {use.isPending && <Loader2 className="animate-spin" />}
            Usar bono
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

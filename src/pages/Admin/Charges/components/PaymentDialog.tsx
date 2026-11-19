import { useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ChargeSession, PaymentDetails } from "@/adapters/api";
import { useMe, useMovePayment, usePayment, useRefundPayment, useVoidPayment } from "@/adapters/hook";
import { Checkbox } from "@/components/ui/checkbox";
import { chargesManagerAccess, hasAccess } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  formatPrice,
  formatShortDay,
  formatTime,
  isChargeable,
  localDay,
  methodLabels,
  methodOrder,
  personKey,
} from "../chargesUtils";

type Props = {
  // The session whose payment is shown…
  session: ChargeSession | null;
  // …or a payment by id (a bono's). Both null: closed
  paymentId?: string | null;
  // Sessions the payment could move to (review sessions only)
  candidates: ChargeSession[];
  onClose: () => void;
};

const actionLabels: Record<string, string> = {
  paid: "Cobrado",
  voided: "Anulado",
  refunded: "Devuelto",
  refunded_partial: "Devuelto en parte",
  moved: "Pasado a otra sesión",
};

const dateTime = (iso: string) => `${formatShortDay(iso)}, ${formatTime(iso)}`;

// A payment: what it paid, who recorded it and its history. From here it's
// voided (a mistake), refunded (money back today) or, for a session to
// review, moved to another session
export default function PaymentDialog({ session, paymentId: directId = null, candidates, onClose }: Props) {
  const paymentId = session?.payment?.id ?? directId;
  const { data, isPending, error } = usePayment(paymentId);
  const { data: me } = useMe();
  const isManager = hasAccess(me, chargesManagerAccess);
  const [mode, setMode] = useState<"view" | "void" | "refund" | "move">("view");

  const close = () => {
    setMode("view");
    onClose();
  };
  const review = session?.state === "review";

  return (
    <Dialog open={!!paymentId} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{review ? "Cobro a revisar" : "Cobro"}</DialogTitle>
          <DialogDescription>
            {review
              ? "La cita de esta sesión se canceló o el paciente ya no está en ella. Pasa el cobro a otra sesión o devuélvelo."
              : "Lo que se cobró y quién lo registró."}
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
        ) : (
          <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border p-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Importe</dt>
                <dd className="text-lg font-medium tabular-nums">{formatPrice(data.amountCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Forma de pago</dt>
                <dd>{methodLabels[data.method]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Fecha</dt>
                <dd>{dateTime(data.paidAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Registrado por</dt>
                <dd>{data.recordedByName ?? "—"}</dd>
              </div>
              {data.note && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Nota</dt>
                  <dd>{data.note}</dd>
                </div>
              )}
            </dl>

            {data.bono && (
              <p className="rounded-xl border px-3 py-2 text-sm">
                Paga el bono <strong>{data.bono.name}</strong> de {data.bono.firstName} {data.bono.lastName}
                {data.bono.cancelled ? " (anulado)" : ""}.
              </p>
            )}

            {data.sessions.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  {data.sessions.length === 1 ? "Paga esta sesión" : `Paga ${data.sessions.length} sesiones`}
                </span>
                <ul className="divide-y rounded-xl border text-sm">
                  {data.sessions.map((s) => (
                    <li key={s.chargeId} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="min-w-0 truncate">
                        {s.firstName} {s.lastName}
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatShortDay(s.occurredAt)} · {s.serviceName}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatPrice(s.priceCents)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.history.length > 0 && (
              <ol className="flex flex-col gap-1 text-xs text-muted-foreground">
                {data.history.map((h, i) => (
                  <li key={i}>
                    {actionLabels[h.action] ?? h.action} · {dateTime(h.at)}
                    {h.byName ? ` · ${h.byName}` : ""}
                    {h.reason ? ` · «${h.reason}»` : ""}
                  </li>
                ))}
              </ol>
            )}

            {data.refunds.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-xl bg-muted px-3 py-2 text-sm">
                {data.refunds.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3">
                    <span>
                      Devuelto el {formatShortDay(r.paidAt)} ({methodLabels[r.method]})
                      {r.note ? ` · ${r.note}` : ""}
                    </span>
                    <span className="tabular-nums">{formatPrice(r.amountCents)}</span>
                  </li>
                ))}
              </ul>
            )}

            {data.voided ? (
              <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                Anulado: {data.voided.reason}
              </p>
            ) : data.kind !== "bono" && data.sessions.length === 0 ? (
              <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                Devuelto entero: ya no paga ninguna sesión.
              </p>
            ) : mode === "void" ? (
              <VoidForm paymentId={data.id} onBack={() => setMode("view")} onDone={close} />
            ) : mode === "refund" ? (
              <RefundForm
                payment={data}
                // From a session to review, only that session is ticked
                preselected={review && session?.chargeId ? [session.chargeId] : null}
                onBack={() => setMode("view")}
                onDone={close}
              />
            ) : mode === "move" && session ? (
              <MoveForm
                paymentId={data.id}
                session={session}
                candidates={candidates}
                onBack={() => setMode("view")}
                onDone={close}
              />
            ) : (
              <Actions
                review={review}
                // Voiding: managers, or whoever recorded it the same day, and
                // only while nothing was refunded. Refunding: managers, or
                // whoever recorded it. The server checks it again
                canVoid={
                  data.refunds.length === 0 &&
                  (isManager ||
                    (data.recordedById === me?.user.id && localDay(data.paidAt) === localDay(new Date())))
                }
                // A bono's money goes back by cancelling the bono (Bonos tab)
                canRefund={data.kind !== "bono" && (isManager || data.recordedById === me?.user.id)}
                bonoNote={data.kind === "bono"}
                onMode={setMode}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormButtons({
  onBack,
  pending,
  disabled,
  label,
  destructive,
}: {
  onBack: () => void;
  pending: boolean;
  disabled: boolean;
  label: string;
  destructive?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" className="rounded-full" onClick={onBack} disabled={pending}>
        Volver
      </Button>
      <Button
        type="submit"
        variant={destructive ? "destructive" : "default"}
        className="rounded-full"
        disabled={disabled || pending}
      >
        {pending && <Loader2 className="animate-spin" />}
        {label}
      </Button>
    </div>
  );
}

function VoidForm({ paymentId, onBack, onDone }: { paymentId: string; onBack: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const voidPayment = useVoidPayment();
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        voidPayment.mutate(
          { paymentId, reason: reason.trim() },
          {
            onSuccess: () => {
              toast.success("Cobro anulado");
              onDone();
            },
            onError: (error) => toast.error("No se pudo anular", { description: error.message }),
          },
        );
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="void-reason">¿Por qué se anula?</Label>
        <Textarea
          id="void-reason"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Me equivoqué de paciente, cobrado dos veces…"
          disabled={voidPayment.isPending}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Anular es para errores: el cobro deja de contar y sus sesiones vuelven a estar pendientes. Si el
          paciente pagó de verdad y le devuelves el dinero, usa Devolver.
        </p>
      </div>
      <FormButtons
        onBack={onBack}
        pending={voidPayment.isPending}
        disabled={!reason.trim()}
        label="Anular cobro"
        destructive
      />
    </form>
  );
}

function Actions({
  review,
  canVoid,
  canRefund,
  bonoNote,
  onMode,
}: {
  review: boolean;
  canVoid: boolean;
  canRefund: boolean;
  bonoNote: boolean;
  onMode: (mode: "void" | "refund" | "move") => void;
}) {
  if (bonoNote && !canVoid) {
    return <p className="text-xs text-muted-foreground">Para devolver el dinero de un bono, anula el bono desde la pestaña Bonos.</p>;
  }
  if (!review && !canVoid && !canRefund) {
    return (
      <p className="text-xs text-muted-foreground">
        Para anularlo o devolverlo, pídeselo a un administrador o a quien lo registró.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {review && (
        <Button className="rounded-full" onClick={() => onMode("move")}>
          Pasar a otra sesión
        </Button>
      )}
      {!review && canVoid && (
        <Button variant="outline" className="rounded-full" onClick={() => onMode("void")}>
          Anular
        </Button>
      )}
      {canRefund && (
        <Button variant="outline" className="rounded-full" onClick={() => onMode("refund")}>
          Devolver
        </Button>
      )}
    </div>
  );
}

function RefundForm({
  payment,
  preselected,
  onBack,
  onDone,
}: {
  payment: PaymentDetails;
  preselected: string[] | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const [method, setMethod] = useState(payment.method);
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(
    () => new Set(preselected ?? payment.sessions.map((s) => s.chargeId)),
  );
  const refund = useRefundPayment();
  const amount = payment.sessions
    .filter((s) => chosen.has(s.chargeId))
    .reduce((sum, s) => sum + s.priceCents, 0);
  const all = chosen.size === payment.sessions.length;
  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        refund.mutate(
          {
            paymentId: payment.id,
            method,
            ...(note.trim() ? { note: note.trim() } : {}),
            ...(all ? {} : { chargeIds: [...chosen] }),
          },
          {
            onSuccess: () => {
              toast.success(`Devolución de ${formatPrice(amount)} registrada`);
              onDone();
            },
            onError: (error) => toast.error("No se pudo devolver", { description: error.message }),
          },
        );
      }}
    >
      {payment.sessions.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">¿Qué sesiones devuelves?</legend>
          {payment.sessions.map((s) => (
            <label key={s.chargeId} className="flex items-center gap-3 text-sm">
              <Checkbox checked={chosen.has(s.chargeId)} onCheckedChange={() => toggle(s.chargeId)} />
              <span className="min-w-0 flex-1 truncate">
                {s.firstName} {s.lastName}
                <span className="text-muted-foreground"> · {formatShortDay(s.occurredAt)} · {s.serviceName}</span>
              </span>
              <span className="tabular-nums">{formatPrice(s.priceCents)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <p className="text-sm">
        Se devuelven <strong className="tabular-nums">{formatPrice(amount)}</strong> hoy. Cuenta como salida de
        dinero en la caja de hoy{all ? "" : ", y las demás sesiones siguen pagadas"}.
      </p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Cómo se devuelve">
        {methodOrder.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={method === m}
            onClick={() => setMethod(m)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              method === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {methodLabels[m]}
          </button>
        ))}
      </div>
      <Textarea
        aria-label="Nota"
        rows={1}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota (opcional)"
        className="min-h-9"
      />
      <FormButtons onBack={onBack} pending={refund.isPending} disabled={chosen.size === 0} label="Devolver" />
    </form>
  );
}

function MoveForm({
  paymentId,
  session,
  candidates,
  onBack,
  onDone,
}: {
  paymentId: string;
  session: ChargeSession;
  candidates: ChargeSession[];
  onBack: () => void;
  onDone: () => void;
}) {
  const move = useMovePayment();
  // The same person's sessions first
  const person = personKey(session);
  const options = candidates
    .filter((c) => isChargeable(c) && c.id !== session.id)
    .sort(
      (a, b) =>
        Number(personKey(b) === person) - Number(personKey(a) === person) ||
        a.startsAt.localeCompare(b.startsAt),
    );
  const [target, setTarget] = useState(options[0]?.id ?? "");

  if (options.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">
          No hay ninguna sesión sin cobrar a la que pasarlo. Da la nueva cita en la agenda y vuelve aquí, o
          devuelve el dinero.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" className="rounded-full" onClick={onBack}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        move.mutate(
          { paymentId, fromChargeId: session.chargeId!, toSessionId: target },
          {
            onSuccess: () => {
              toast.success("Cobro pasado a la otra sesión");
              onDone();
            },
            onError: (error) => toast.error("No se pudo pasar el cobro", { description: error.message }),
          },
        );
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="move-target">Pasar el cobro a</Label>
        <NativeSelect id="move-target" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full">
          {[
            ["Mismo paciente", options.filter((c) => personKey(c) === person)],
            ["Otros pacientes", options.filter((c) => personKey(c) !== person)],
          ].map(([label, list]) =>
            (list as ChargeSession[]).length === 0 ? null : (
              <optgroup key={label as string} label={label as string}>
                {(list as ChargeSession[]).map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} · {formatShortDay(c.startsAt)} {formatTime(c.startsAt)} ·{" "}
                    {c.serviceName}
                  </NativeSelectOption>
                ))}
              </optgroup>
            ),
          )}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          El importe no cambia: la sesión de destino queda pagada con el precio de esta.
        </p>
      </div>
      <FormButtons onBack={onBack} pending={move.isPending} disabled={!target} label="Pasar cobro" />
    </form>
  );
}

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentPatientInput, Bono, PaymentMethod } from "@/adapters/api";
import {
  useBonoTypes,
  useCalendarConfig,
  useCancelBono,
  useMe,
  usePayBono,
  useSellBono,
} from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { chargesManagerAccess, hasAccess } from "@/lib/roles";
import { cn } from "@/lib/utils";
import PatientFields from "../../Bookings/components/PatientFields";
import { describeBono } from "../../Settings/Charges/BonoTypesSection";
import { bonoValidity, centsToInput, formatPrice, inputToCents, localDay } from "../chargesUtils";
import MethodPicker from "./MethodPicker";

// ── Selling ──────────────────────────────────────────────────────────────

// "2026-11" and the next two months, for monthly bonos
function nextMonths(today: string) {
  const [y, m] = today.split("-").map(Number);
  return [0, 1, 2].map((i) => {
    const d = new Date(Date.UTC(y!, m! - 1 + i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
    return [key, label.charAt(0).toUpperCase() + label.slice(1)] as const;
  });
}

const CUSTOM = "custom";

// Sells a bono to a patient (ficha or name + contact): a type from
// Configuración or one made to measure, from which day (or which month), its
// price, and paid now or pending
export function SellBonoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">{open && <SellForm onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function SellForm({ onClose }: { onClose: () => void }) {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const today = localDay(new Date());
  const types = (useBonoTypes(clinicId).data ?? []).filter((t) => t.sellable);
  const services = useCalendarConfig(clinicId, { from: today, to: today }).data?.services ?? [];
  const sell = useSellBono();

  const [patient, setPatient] = useState<AppointmentPatientInput>({ firstName: "", lastName: "" });
  const [contact, setContact] = useState("");
  const [typeId, setTypeId] = useState("");
  // Made to measure (sessions bonos only)
  const [customName, setCustomName] = useState("");
  const [customService, setCustomService] = useState("");
  const [customSessions, setCustomSessions] = useState("5");
  const [validFrom, setValidFrom] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [price, setPrice] = useState("");
  const [payNow, setPayNow] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");

  const type = types.find((t) => t.id === typeId);
  const custom = typeId === CUSTOM;
  const kind = custom ? "sessions" : type?.kind;
  const chooseType = (id: string) => {
    setTypeId(id);
    const t = types.find((x) => x.id === id);
    setPrice(t ? centsToInput(t.priceCents) : "");
  };

  const hasFicha = !!patient.patientId;
  const patientOk = hasFicha || (!!patient.firstName.trim() && !!patient.lastName.trim() && !!contact.trim());
  const cents = inputToCents(price);
  const sessionsNum = Number(customSessions);
  const customOk = !custom || (!!customName.trim() && !!customService && Number.isInteger(sessionsNum) && sessionsNum >= 1 && sessionsNum <= 200);
  const ok = patientOk && (!!type || custom) && customOk && cents !== null && cents > 0;

  const submit = () =>
    sell.mutate(
      {
        patient: hasFicha
          ? { patientId: patient.patientId! }
          : { firstName: patient.firstName.trim(), lastName: patient.lastName.trim(), contact: contact.trim() },
        ...(custom
          ? {
              custom: {
                name: customName.trim(),
                serviceId: customService,
                kind: "sessions",
                sessions: sessionsNum,
                validityDays: null,
                sessionsPerWeek: null,
                priceCents: cents!,
                isActive: true,
              },
            }
          : { bonoTypeId: typeId }),
        ...(kind === "monthly" ? { month } : { validFrom }),
        priceCents: cents!,
        ...(note.trim() ? { note: note.trim() } : {}),
        pay: payNow ? { method } : null,
      },
      {
        onSuccess: (sold) => {
          toast.success(payNow ? `Bono vendido y cobrado (${formatPrice(sold.priceCents)})` : "Bono vendido, pendiente de pago");
          onClose();
        },
        onError: (e) => toast.error("No se pudo vender el bono", { description: e.message }),
      },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Vender bono</DialogTitle>
        <DialogDescription>El bono se puede usar desde ya, aunque se pague más tarde.</DialogDescription>
      </DialogHeader>

      <div className="flex max-h-[62svh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          <Label>Paciente</Label>
          <PatientFields value={patient} onChange={setPatient} label="Paciente" disabled={sell.isPending} forAppointment={false} />
          {/* Only when a name is written (not while searching fichas) */}
          {!hasFicha && (patient.firstName.trim() || patient.lastName.trim()) && (
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={100}
              placeholder="Teléfono o email (para distinguirlo)"
              aria-label="Teléfono o email"
              disabled={sell.isPending}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sell-type">Bono</Label>
          <NativeSelect id="sell-type" value={typeId} onChange={(e) => chooseType(e.target.value)} className="w-full">
            <NativeSelectOption value="">Elige un bono</NativeSelectOption>
            {types.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.name} · {formatPrice(t.priceCents)}
              </NativeSelectOption>
            ))}
            <NativeSelectOption value={CUSTOM}>A medida…</NativeSelectOption>
          </NativeSelect>
          {type && (
            <p className="text-xs text-muted-foreground">
              {type.serviceName} · {describeBono(type)}
            </p>
          )}
          {types.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay tipos de bono: créalos en Configuración → Cobros, o vende uno a medida.
            </p>
          )}
        </div>

        {custom && (
          <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_6rem]">
            <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nombre del bono" aria-label="Nombre del bono" maxLength={80} />
            <NativeSelect aria-label="Servicio" value={customService} onChange={(e) => setCustomService(e.target.value)} className="w-full">
              <NativeSelectOption value="">Servicio</NativeSelectOption>
              {services.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Input type="number" min={1} max={200} value={customSessions} onChange={(e) => setCustomSessions(e.target.value)} aria-label="Sesiones" />
            <p className="text-xs text-muted-foreground sm:col-span-3">De sesiones y sin caducidad.</p>
          </div>
        )}

        {kind && (
          <div className="grid gap-4 sm:grid-cols-2">
            {kind === "monthly" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="sell-month">Mes</Label>
                <NativeSelect id="sell-month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full">
                  {nextMonths(today).map(([key, label]) => (
                    <NativeSelectOption key={key} value={key}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="sell-from">Válido desde</Label>
                <Input id="sell-from" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="sell-price">Precio</Label>
              <div className="relative">
                <Input
                  id="sell-price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={price !== "" && (cents === null || cents <= 0)}
                  className="pr-7 tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-xl border p-3">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pago">
            {(
              [
                [true, "Cobrar ahora"],
                [false, "Pendiente de pago"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={payNow === value}
                onClick={() => setPayNow(value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-colors",
                  payNow === value ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {payNow ? (
            <MethodPicker value={method} onChange={setMethod} disabled={sell.isPending} />
          ) : (
            <p className="text-xs text-muted-foreground">Aparecerá en Pendientes hasta que se cobre.</p>
          )}
        </div>

        <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Nota (opcional)" aria-label="Nota" className="min-h-9" />
      </div>

      <DialogFooter className="items-center sm:justify-between">
        <span className="text-lg font-medium tabular-nums">{cents ? formatPrice(cents) : ""}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={sell.isPending}>
            Cancelar
          </Button>
          <Button type="button" className="rounded-full" onClick={submit} disabled={!ok || sell.isPending}>
            {sell.isPending && <Loader2 className="animate-spin" />}
            {payNow ? "Vender y cobrar" : "Vender"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

// ── Charging a pending bono ──────────────────────────────────────────────

export function PayBonoDialog({ bono, onClose }: { bono: Bono | null; onClose: () => void }) {
  return (
    <Dialog open={!!bono} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">{bono && <PayForm key={bono.id} bono={bono} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function PayForm({ bono, onClose }: { bono: Bono; onClose: () => void }) {
  const today = localDay(new Date());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidOn, setPaidOn] = useState(today);
  const pay = usePayBono();
  return (
    <>
      <DialogHeader>
        <DialogTitle>Cobrar bono</DialogTitle>
        <DialogDescription>
          {bono.firstName} {bono.lastName} · {bono.name} · {bonoValidity(bono)}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <MethodPicker value={method} onChange={setMethod} disabled={pay.isPending} />
        <div className="flex flex-col gap-2 sm:w-44">
          <Label htmlFor="bono-paid-on">Fecha del cobro</Label>
          <Input id="bono-paid-on" type="date" max={today} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
        </div>
      </div>
      <DialogFooter className="items-center sm:justify-between">
        <span className="text-lg font-medium tabular-nums">{formatPrice(bono.priceCents)}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={pay.isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={pay.isPending || !paidOn || paidOn > today}
            onClick={() =>
              pay.mutate(
                { bonoId: bono.id, method, ...(paidOn !== today ? { paidOn } : {}) },
                {
                  onSuccess: () => {
                    toast.success(`Bono cobrado (${formatPrice(bono.priceCents)})`);
                    onClose();
                  },
                  onError: (e) => toast.error("No se pudo cobrar", { description: e.message }),
                },
              )
            }
          >
            {pay.isPending && <Loader2 className="animate-spin" />}
            Cobrar
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

// ── Cancelling ───────────────────────────────────────────────────────────

// Cancels a bono. If it was paid, part or all of the money can go back today
export function CancelBonoDialog({ bono, onClose }: { bono: Bono | null; onClose: () => void }) {
  return (
    <Dialog open={!!bono} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">{bono && <CancelForm key={bono.id} bono={bono} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function CancelForm({ bono, onClose }: { bono: Bono; onClose: () => void }) {
  const { data: me } = useMe();
  // Refunding: owners and admins, or whoever recorded the payment (the server checks it too)
  const canRefund = hasAccess(me, chargesManagerAccess) || bono.payment?.recordedById === me?.user.id;
  const refundable = bono.payment ? bono.priceCents - bono.payment.refundedCents : 0;
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState(false);
  const [amount, setAmount] = useState(centsToInput(refundable));
  const [method, setMethod] = useState<PaymentMethod>(bono.payment?.method ?? "cash");
  const cancel = useCancelBono();
  const cents = inputToCents(amount);
  const amountOk = !refund || (cents !== null && cents > 0 && cents <= refundable);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        cancel.mutate(
          { bonoId: bono.id, reason: reason.trim(), ...(refund ? { refund: { amountCents: cents!, method } } : {}) },
          {
            onSuccess: () => {
              toast.success(refund ? `Bono anulado y ${formatPrice(cents!)} devueltos` : "Bono anulado");
              onClose();
            },
            onError: (e) => toast.error("No se pudo anular", { description: e.message }),
          },
        );
      }}
    >
      <DialogHeader>
        <DialogTitle>Anular bono</DialogTitle>
        <DialogDescription>
          {bono.firstName} {bono.lastName} · {bono.name} · {formatPrice(bono.priceCents)}
          {bono.payment ? "" : " (sin cobrar)"}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cancel-bono-reason">Motivo</Label>
        <Textarea
          id="cancel-bono-reason"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Vendido por error, el paciente se muda…"
          autoFocus
        />
      </div>
      {refundable > 0 && !canRefund && (
        <p className="text-xs text-muted-foreground">
          Está cobrado. Para devolver dinero al paciente, pídeselo a un administrador o a quien lo cobró.
        </p>
      )}
      {refundable > 0 && canRefund && (
        <div className="flex flex-col gap-3 rounded-xl border p-3">
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={refund} onCheckedChange={(v) => setRefund(v === true)} />
            Devolver dinero al paciente
          </label>
          {refund && (
            <>
              <div className="relative sm:w-40">
                <Input
                  inputMode="decimal"
                  aria-label="Importe a devolver"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={!amountOk}
                  className="pr-7 tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
              <MethodPicker value={method} onChange={setMethod} label="Cómo se devuelve" />
              <p className="text-xs text-muted-foreground">
                Como mucho {formatPrice(refundable)}. Cuenta como salida de dinero en la caja de hoy.
              </p>
            </>
          )}
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={cancel.isPending}>
          Volver
        </Button>
        <Button type="submit" variant="destructive" className="rounded-full" disabled={!reason.trim() || !amountOk || cancel.isPending}>
          {cancel.isPending && <Loader2 className="animate-spin" />}
          Anular bono
        </Button>
      </DialogFooter>
    </form>
  );
}

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentPatientInput, ChargeSession } from "@/adapters/api";
import {
  useCalendarConfig,
  useCancelManualSession,
  useCreateManualSession,
  useMe,
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
import PatientFields from "../../Bookings/components/PatientFields";
import { centsToInput, formatShortDay, inputToCents, localDay } from "../chargesUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  // "YYYY-MM-DD": the earliest day it can be
  startsOn: string;
  // "Cobrar ahora" ticked: the new session, to open the charge dialog with
  onChargeNow: (session: ChargeSession) => void;
};

// A session that happened but isn't in the calendar (a home visit, one
// someone forgot to book…): who, what, when, with whom, its price and why
// it's recorded here
export function ManualSessionDialog({ open, onClose, startsOn, onChargeNow }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {open && <ManualForm startsOn={startsOn} onClose={onClose} onChargeNow={onChargeNow} />}
      </DialogContent>
    </Dialog>
  );
}

function ManualForm({ startsOn, onClose, onChargeNow }: Omit<Props, "open">) {
  const { data: me } = useMe();
  const today = localDay(new Date());
  // Services and professionals: the same lists as the calendar (active ones)
  const config = useCalendarConfig(me?.activeClinic?.clinicId, { from: today, to: today });
  const services = config.data?.services ?? [];
  const professionals = config.data?.professionals ?? [];

  const [patient, setPatient] = useState<AppointmentPatientInput>({ firstName: "", lastName: "" });
  const [serviceId, setServiceId] = useState("");
  const [physioId, setPhysioId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [chargeNow, setChargeNow] = useState(true);
  const create = useCreateManualSession();

  const chooseService = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    // The service's price as a starting point
    setPrice(svc ? centsToInput(svc.priceCents) : "");
  };

  const patientOk = !!patient.patientId || (!!patient.firstName.trim() && !!patient.lastName.trim());
  const cents = price.trim() === "" ? undefined : inputToCents(price);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today && date >= startsOn;
  const ok = patientOk && !!serviceId && dateOk && cents !== null && !!note.trim();

  const submit = () =>
    create.mutate(
      {
        patient: patient.patientId
          ? { patientId: patient.patientId }
          : { firstName: patient.firstName.trim(), lastName: patient.lastName.trim() },
        serviceId,
        physioId: physioId || null,
        date,
        ...(time ? { time } : {}),
        ...(typeof cents === "number" ? { priceCents: cents } : {}),
        note: note.trim(),
      },
      {
        onSuccess: (session) => {
          toast.success("Sesión añadida");
          onClose();
          if (chargeNow && session && session.state === "pending") onChargeNow(session);
        },
        onError: (error) => toast.error("No se pudo añadir", { description: error.message }),
      },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Añadir sesión fuera de la agenda</DialogTitle>
        <DialogDescription>
          Una sesión que ya ocurrió pero no está en la agenda: a domicilio, una que no se reservó… No aparece en el
          calendario.
        </DialogDescription>
      </DialogHeader>

      <div className="flex max-h-[60svh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
          <Label>Paciente</Label>
          <PatientFields
            value={patient}
            onChange={setPatient}
            label="Paciente"
            disabled={create.isPending}
            forAppointment={false}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual-service">Servicio</Label>
            <NativeSelect
              id="manual-service"
              value={serviceId}
              onChange={(e) => chooseService(e.target.value)}
              disabled={create.isPending || config.isPending}
              className="w-full"
            >
              <NativeSelectOption value="">Elige un servicio</NativeSelectOption>
              {services.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual-physio">
              Profesional <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <NativeSelect
              id="manual-physio"
              value={physioId}
              onChange={(e) => setPhysioId(e.target.value)}
              disabled={create.isPending || config.isPending}
              className="w-full"
            >
              <NativeSelectOption value="">Sin indicar</NativeSelectOption>
              {professionals.map((p) => (
                <NativeSelectOption key={p.userId} value={p.userId}>
                  {p.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual-date">Fecha</Label>
            <Input
              id="manual-date"
              type="date"
              min={startsOn}
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={!dateOk}
              disabled={create.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual-time">
              Hora <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="manual-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={create.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual-price">Precio</Label>
            <div className="relative">
              <Input
                id="manual-price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={cents === null}
                placeholder="El del servicio"
                className="pr-7 tabular-nums"
                disabled={create.isPending}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
            </div>
          </div>
        </div>
        {!dateOk && date < startsOn && (
          <p className="text-xs text-destructive">Los cobros cuentan desde el {formatShortDay(`${startsOn}T12:00:00`)}.</p>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="manual-note">¿Por qué no está en la agenda?</Label>
          <Textarea
            id="manual-note"
            rows={2}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sesión a domicilio, se olvidó reservar…"
            disabled={create.isPending}
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <Checkbox checked={chargeNow} onCheckedChange={(v) => setChargeNow(v === true)} />
          Cobrarla ahora
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={create.isPending}>
          Cancelar
        </Button>
        <Button type="button" className="rounded-full" onClick={submit} disabled={!ok || create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />}
          Añadir sesión
        </Button>
      </DialogFooter>
    </>
  );
}

// Cancels a manual session recorded by mistake. A paid one stays "a revisar"
export function CancelManualDialog({ session, onClose }: { session: ChargeSession | null; onClose: () => void }) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {session && <CancelForm key={session.id} session={session} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CancelForm({ session, onClose }: { session: ChargeSession; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const cancel = useCancelManualSession();
  const paid = session.state === "paid";
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        cancel.mutate(
          { sessionId: session.id, reason: reason.trim() },
          {
            onSuccess: () => {
              toast.success(paid ? "Sesión anulada: su cobro queda a revisar" : "Sesión anulada");
              onClose();
            },
            onError: (error) => toast.error("No se pudo anular", { description: error.message }),
          },
        );
      }}
    >
      <DialogHeader>
        <DialogTitle>Anular sesión</DialogTitle>
        <DialogDescription>
          {session.firstName} {session.lastName} · {formatShortDay(session.startsAt)} · {session.serviceName}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cancel-manual-reason">Motivo</Label>
        <Textarea
          id="cancel-manual-reason"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Añadida por error, repetida…"
          autoFocus
        />
        {paid && (
          <p className="text-xs text-muted-foreground">
            Está cobrada: el cobro quedará «a revisar» para pasarlo a otra sesión o devolverlo.
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} disabled={cancel.isPending}>
          Volver
        </Button>
        <Button type="submit" variant="destructive" className="rounded-full" disabled={!reason.trim() || cancel.isPending}>
          {cancel.isPending && <Loader2 className="animate-spin" />}
          Anular sesión
        </Button>
      </DialogFooter>
    </form>
  );
}

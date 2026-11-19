import { useState, type ReactNode, type FormEvent } from "react";
import { Link } from "react-router";
import { Loader2, Plus, X } from "lucide-react";
import type { AppointmentPatientInput, AppointmentStatus, CalendarConfig } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { paths } from "@/routes/paths";
import { endTime, statusLabels } from "../calendarUtils";
import PatientFields from "./PatientFields";

export type AppointmentFormValues = {
  serviceId: string;
  date: string; // "2026-11-16"
  startTime: string; // "09:30"
  physioId: string;
  roomId: string;
  patients: AppointmentPatientInput[];
  status: AppointmentStatus;
  notes: string;
};

type Props = {
  config: CalendarConfig; // services, rooms and professionals to choose from
  initial: AppointmentFormValues;
  // New appointments can only be "Reservada" or "Confirmada"; when editing,
  // also "Realizada" and "No se presentó" (cancelling has its own button)
  statuses: AppointmentStatus[];
  submitLabel: string;
  pending: boolean;
  // Physios can only book for themselves: the physio is fixed to them
  lockedPhysioId?: string;
  onSubmit: (values: AppointmentFormValues) => void;
  onCancel: () => void;
  // Extra fields before the buttons (e.g. "Repetir cada semana"), which see the
  // form's current values
  extra?: (values: AppointmentFormValues) => ReactNode;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same as the backend

const emptyPatient = (): AppointmentPatientInput => ({ firstName: "", lastName: "" });

// Form to create or edit an appointment. The backend checks the rest
// (opening hours, room full, physio busy) and explains what failed
export default function AppointmentForm({
  config,
  initial,
  statuses,
  submitLabel,
  pending,
  lockedPhysioId,
  onSubmit,
  onCancel,
  extra,
}: Props) {
  const [values, setValues] = useState<AppointmentFormValues>(() => ({
    ...initial,
    patients: initial.patients.length > 0 ? initial.patients : [emptyPatient()],
  }));
  const set = <K extends keyof AppointmentFormValues>(key: K, value: AppointmentFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const missing = [
    config.services.length === 0 && "servicios",
    config.rooms.length === 0 && "salas",
    config.professionals.length === 0 && "fisios",
  ].filter(Boolean);

  if (missing.length > 0) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p>
          Para dar citas, la clínica necesita al menos un servicio, una sala y un fisio. Falta:{" "}
          <strong className="font-medium">{missing.join(", ")}</strong>.
        </p>
        <p className="text-muted-foreground">
          Los servicios y las salas se crean en{" "}
          <Link to={paths.adminSettings} className="underline underline-offset-4">
            Configuración
          </Link>
          , y los fisios se añaden en{" "}
          <Link to={paths.adminTeam} className="underline underline-offset-4">
            Equipo
          </Link>
          .
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Cerrar
          </Button>
        </DialogFooter>
      </div>
    );
  }

  const service = config.services.find((s) => s.id === values.serviceId);
  // Only rooms of the type the service needs
  const rooms = config.rooms.filter((r) => !service?.roomTypeId || r.roomTypeId === service.roomTypeId);
  const room = rooms.find((r) => r.id === values.roomId);
  const maxPatients = service && room ? Math.min(service.maxPatients, room.capacity) : 1;

  const chooseService = (serviceId: string) => {
    const next = config.services.find((s) => s.id === serviceId);
    const fitting = config.rooms.filter((r) => !next?.roomTypeId || r.roomTypeId === next.roomTypeId);
    setValues((v) => ({
      ...v,
      serviceId,
      // Keep the room if it still fits, otherwise the first one that does
      roomId: fitting.some((r) => r.id === v.roomId) ? v.roomId : (fitting[0]?.id ?? ""),
    }));
  };

  const setPatient = (index: number, patient: AppointmentPatientInput) =>
    set(
      "patients",
      values.patients.map((p, i) => (i === index ? patient : p)),
    );

  // Rows left empty don't count. Patients with a ficha keep its id; the rest
  // go by name only, without ficha
  const patients = values.patients
    .map((p) => ({
      ...p,
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
      email: p.email?.trim() || undefined,
    }))
    .filter((p) => p.firstName || p.lastName);
  const fichaIds = patients.flatMap((p) => (p.patientId ? [p.patientId] : []));
  // Group sessions can be created empty (people join later); individual ones
  // need their patient
  const patientsOk =
    (patients.length > 0 || !!service?.isGroup) &&
    patients.length <= maxPatients &&
    patients.every((p) => p.firstName && p.lastName && (!p.email || EMAIL_PATTERN.test(p.email)));
  const valid =
    !!service && !!room && !!values.physioId && !!values.date && !!values.startTime && patientsOk;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid) onSubmit({ ...values, patients, notes: values.notes.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="appt-service">Servicio</Label>
        <NativeSelect
          id="appt-service"
          value={values.serviceId}
          onChange={(e) => chooseService(e.target.value)}
          className="w-full"
          required
        >
          <NativeSelectOption value="" disabled>
            Elige un servicio
          </NativeSelectOption>
          {config.services.map((s) => (
            <NativeSelectOption key={s.id} value={s.id}>
              {s.name} · {s.durationMinutes} min{s.isGroup ? ` · grupo (máx. ${s.maxPatients})` : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="appt-date">Fecha</Label>
          <Input
            id="appt-date"
            type="date"
            required
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="appt-time">Hora</Label>
          <Input
            id="appt-time"
            type="time"
            step={300}
            required
            value={values.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
        </div>
        {service && values.startTime && (
          <p className="col-span-2 text-xs text-muted-foreground">
            Termina a las {endTime(values.startTime, service.durationMinutes)}
            {service.bufferMinutes > 0 && ` (la sala queda ${service.bufferMinutes} min más para limpieza)`}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="appt-physio">Fisio</Label>
          <NativeSelect
            id="appt-physio"
            value={values.physioId}
            onChange={(e) => set("physioId", e.target.value)}
            className="w-full"
            required
            disabled={!!lockedPhysioId}
          >
            <NativeSelectOption value="" disabled>
              Elige
            </NativeSelectOption>
            {config.professionals
              .filter((p) => !lockedPhysioId || p.userId === lockedPhysioId)
              .map((p) => (
                <NativeSelectOption key={p.userId} value={p.userId}>
                  {p.name}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="appt-room">Sala</Label>
          <NativeSelect
            id="appt-room"
            value={values.roomId}
            onChange={(e) => set("roomId", e.target.value)}
            className="w-full"
            required
            disabled={!service}
          >
            <NativeSelectOption value="" disabled>
              {service && rooms.length === 0 ? "Ninguna adecuada" : "Elige"}
            </NativeSelectOption>
            {rooms.map((r) => (
              <NativeSelectOption key={r.id} value={r.id}>
                {r.name}
                {r.capacity > 1 ? ` (${r.capacity} plazas)` : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {service && rooms.length === 0 && (
          <p className="col-span-2 text-xs text-destructive">
            Ninguna sala activa es del tipo que necesita este servicio.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          {maxPatients > 1 ? `Participantes (opcional, máximo ${maxPatients})` : "Paciente"}
        </Label>
        {values.patients.map((p, index) => (
          <PatientFields
            key={index}
            value={p}
            onChange={(patient) => setPatient(index, patient)}
            label={`Paciente ${index + 1}`}
            excludeIds={fichaIds}
            trailing={
              values.patients.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-muted-foreground"
                  onClick={() => set("patients", values.patients.filter((_, i) => i !== index))}
                  aria-label={`Quitar paciente ${index + 1}`}
                >
                  <X />
                </Button>
              )
            }
          />
        ))}
        {values.patients.length < maxPatients && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit rounded-full text-muted-foreground"
            onClick={() => set("patients", [...values.patients, emptyPatient()])}
          >
            <Plus /> Añadir paciente
          </Button>
        )}
        {/* A group service in a small room: say why fewer people fit */}
        {service?.isGroup && room && room.capacity < service.maxPatients && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {room.name} solo admite {room.capacity} {room.capacity === 1 ? "persona" : "personas"}.
            Para llegar a {service.maxPatients} participantes, elige una sala más grande o sube su
            capacidad en Configuración → Salas.
          </p>
        )}
        {patients.length > maxPatients && (
          <p className="text-xs text-destructive">
            Esta sala y este servicio admiten como máximo {maxPatients}{" "}
            {maxPatients === 1 ? "paciente" : "pacientes"}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="appt-status">Estado</Label>
          <NativeSelect
            id="appt-status"
            value={values.status}
            onChange={(e) => set("status", e.target.value as AppointmentStatus)}
            className="w-full"
          >
            {statuses.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {statusLabels[s]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="appt-notes">
            Notas <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="appt-notes"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Primera visita…"
          />
        </div>
      </div>

      {extra?.(values)}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" className="rounded-full" disabled={!valid || pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

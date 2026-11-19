import { useState, type ReactNode } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  Clock,
  DoorOpen,
  Globe,
  Loader2,
  NotebookPen,
  Pencil,
  Repeat,
  RotateCcw,
  Stethoscope,
  Trash2,
  TriangleAlert,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Appointment, CalendarConfig } from "@/adapters/api";
import { useDeleteAppointment, useUpdateAppointment, useUpdateSeries } from "@/adapters/hook";
import type { SeriesChanges } from "@/adapters/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
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
import {
  bookingTitle,
  formatDayLong,
  missesReminder,
  patientName,
  reminderLabels,
  statusLabels,
  toPatientInput,
} from "../calendarUtils";
import { formatMinutes } from "../../Settings/Services/serviceFormat";
import AppointmentForm, { type AppointmentFormValues } from "./AppointmentForm";
import GroupParticipants from "./GroupParticipants";
import PatientNameLink from "./PatientNameLink";
import SuggestedFichas from "./SuggestedFichas";

type Props = {
  appointment: Appointment;
  config: CalendarConfig; // options when editing
  canDelete: boolean; // owners and admins
  // Can change this appointment: owners, admins and reception always;
  // physios only their own
  canEdit: boolean;
  // Physios editing their own appointment can't hand it to another physio
  lockedPhysioId?: string;
  onClose: () => void;
};

// "2026-11-16" -> local Date (to format it)
const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

// Details of one appointment, opened by clicking it in the calendar:
// everything about it, plus edit, cancel (with a reason), reactivate and delete
export default function BookingDetailsDialog({
  appointment,
  config,
  canDelete,
  canEdit,
  lockedPhysioId,
  onClose,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit" | "cancel" | "scope">("view");
  // Series: which appointments a change or cancellation applies to
  const [scope, setScope] = useState<Scope>("this");
  const [pendingEdit, setPendingEdit] = useState<AppointmentFormValues | null>(null);
  const updateSeries = useUpdateSeries();
  const inSeries = !!appointment.seriesId && !appointment.detached && appointment.status !== "cancelled";
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdateAppointment();
  const remove = useDeleteAppointment();

  const { service, status } = appointment;
  const date = toDate(appointment.date);
  const range = `${appointment.startTime} – ${appointment.endTime}`;
  const title = bookingTitle(appointment);
  // Places for group sessions: the service's maximum, limited by the room's
  // capacity (a deactivated room isn't in the list: then the service decides)
  const roomCapacity = config.rooms.find((r) => r.id === appointment.room.id)?.capacity;
  const places = Math.min(service.maxPatients, roomCapacity ?? service.maxPatients);

  const save = (changes: Parameters<typeof update.mutate>[0]["changes"], success: string) =>
    update.mutate(
      { id: appointment.id, changes },
      {
        onSuccess: () => {
          toast.success(success);
          setMode("view");
          setReason("");
        },
        onError: (error) =>
          toast.error("No se pudo guardar la cita", { description: error.message }),
      },
    );

  // Applies a change to the following or all appointments of the series
  const saveSeries = (changes: SeriesChanges, success: string) =>
    updateSeries.mutate(
      {
        seriesId: appointment.seriesId!,
        scope: scope === "all" ? "all" : "following",
        fromAppointmentId: appointment.id,
        changes,
      },
      {
        onSuccess: ({ updated, skipped }) => {
          toast.success(`${success}: ${updated.length} ${updated.length === 1 ? "cita" : "citas"}`, {
            description: skipped.length
              ? `No se pudieron cambiar ${skipped.length}: ${skipped.map((x) => `${x.date.split("-").reverse().slice(0, 2).join("/")} (${x.message})`).join(", ")}`
              : undefined,
          });
          setMode("view");
          setReason("");
          setPendingEdit(null);
          if (changes && "cancel" in changes) onClose();
        },
        onError: (error) => toast.error("No se pudo cambiar la serie", { description: error.message }),
      },
    );

  // Editing an appointment of a series: if only what a series can share
  // changed (time, physio, room, patients, notes), ask which ones
  const saveEdit = (values: AppointmentFormValues) => {
    if (inSeries && values.date === appointment.date && values.serviceId === service.id && values.status === status) {
      setPendingEdit(values);
      setScope("this");
      setMode("scope");
      return;
    }
    saveOne(values);
  };

  const saveOne = (values: AppointmentFormValues) =>
    save(
      {
        serviceId: values.serviceId,
        roomId: values.roomId,
        physioId: values.physioId,
        date: values.date,
        startTime: values.startTime,
        patients: values.patients,
        status: values.status,
        notes: values.notes || null,
      },
      "Cita actualizada",
    );

  const applyEdit = () => {
    if (!pendingEdit) return;
    if (scope === "this") return saveOne(pendingEdit);
    saveSeries(
      {
        startTime: pendingEdit.startTime,
        physioId: pendingEdit.physioId,
        roomId: pendingEdit.roomId,
        patients: pendingEdit.patients,
        notes: pendingEdit.notes || null,
      },
      "Serie actualizada",
    );
  };

  const deleteIt = () =>
    remove.mutate(appointment.id, {
      onSuccess: () => {
        toast.success("Cita eliminada");
        setConfirmDelete(false);
        onClose();
      },
      onError: (error) => {
        toast.error("No se pudo eliminar la cita", { description: error.message });
        setConfirmDelete(false);
      },
    });

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && !update.isPending && onClose()}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          {/* Service color across the top */}
          <div
            className="absolute inset-x-0 top-0 h-1.5 rounded-t-lg"
            style={{ backgroundColor: service.color }}
            aria-hidden
          />

          <DialogHeader className="pt-1">
            <div className="flex items-center gap-2">
              <Badge variant={status === "confirmed" || status === "completed" ? "secondary" : "outline"}>
                {statusLabels[status]}
              </Badge>
              <span className="text-sm text-muted-foreground">{service.name}</span>
            </div>
            <DialogTitle className={status === "cancelled" ? "line-through" : undefined}>
              {title}
            </DialogTitle>
            <DialogDescription className="first-letter:uppercase">
              {formatDayLong(date)} · {range}
            </DialogDescription>
          </DialogHeader>

          {mode === "edit" && (
            <AppointmentForm
              config={config}
              initial={{
                serviceId: service.id,
                date: appointment.date,
                startTime: appointment.startTime,
                physioId: appointment.physio?.userId ?? "",
                roomId: appointment.room.id,
                patients: appointment.patients.map(toPatientInput),
                status: status === "cancelled" ? "booked" : status,
                notes: appointment.notes ?? "",
              }}
              statuses={["booked", "confirmed", "completed", "no_show"]}
              submitLabel="Guardar cambios"
              pending={update.isPending}
              lockedPhysioId={lockedPhysioId}
              onSubmit={saveEdit}
              onCancel={() => setMode("view")}
            />
          )}

          {mode === "scope" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm">Esta cita se repite cada semana. ¿A qué citas aplicas los cambios?</p>
              <ScopePicker value={scope} onChange={setScope} verb="Cambiar" />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={update.isPending || updateSeries.isPending}
                  onClick={() => setMode("edit")}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={update.isPending || updateSeries.isPending}
                  onClick={applyEdit}
                >
                  {(update.isPending || updateSeries.isPending) && <Loader2 className="animate-spin" />}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </div>
          )}

          {mode === "cancel" && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reason.trim()) return;
                if (inSeries && scope !== "this") {
                  saveSeries({ cancel: { reason: reason.trim() } }, "Citas canceladas");
                } else {
                  save({ status: "cancelled", cancellationReason: reason.trim() }, "Cita cancelada");
                }
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="cancel-reason">Motivo de la cancelación</Label>
                <Input
                  id="cancel-reason"
                  autoFocus
                  required
                  placeholder="El paciente está enfermo, cambio de planes…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  La cita queda en el historial y su hueco se libera.
                </p>
              </div>
              {inSeries && <ScopePicker value={scope} onChange={setScope} verb="Cancelar" />}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={update.isPending}
                  onClick={() => setMode("view")}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="rounded-full"
                  disabled={!reason.trim() || update.isPending || updateSeries.isPending}
                >
                  {(update.isPending || updateSeries.isPending) && <Loader2 className="animate-spin" />}
                  {inSeries && scope !== "this" ? "Cancelar citas" : "Cancelar cita"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {mode === "view" && (
            <>
              {/* The clinic changed something and this appointment no longer fits */}
              {appointment.issues.length > 0 && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Esta cita necesita revisión</span>
                    <ul className="list-disc pl-4 text-muted-foreground">
                      {appointment.issues.map((issue) => (
                        <li key={issue.code}>{issue.message}</li>
                      ))}
                    </ul>
                    <span className="text-xs text-muted-foreground">
                      {appointment.issues.every((i) => i.code === "NO_PHYSIO")
                        ? "Asígnalo en Clases (a toda la clase) o editando esta sesión."
                        : "Cambia la hora o la sala, o cancela la cita y avisa al paciente."}
                    </span>
                  </div>
                </div>
              )}

              <dl className="flex flex-col gap-3 text-sm">
                <Detail icon={<CalendarDays />} label="Fecha">
                  <span className="first-letter:uppercase">{formatDayLong(date)}</span>
                </Detail>
                <Detail icon={<Clock />} label="Hora">
                  {range} ({formatMinutes(appointment.durationMinutes)})
                </Detail>
                {appointment.seriesId && (
                  <Detail icon={<Repeat />} label="Se repite">
                    {appointment.detached ? "Cambiada a mano: ya no sigue la serie" : "Cada semana"}
                  </Detail>
                )}
                <Detail
                  icon={service.isGroup ? <Users /> : <User />}
                  label={
                    service.isGroup
                      ? `Participantes (${appointment.patients.length} de ${places})`
                      : "Paciente"
                  }
                >
                  {service.isGroup ? (
                    <GroupParticipants
                      appointment={appointment}
                      maxPatients={places}
                      canEdit={canEdit && status !== "cancelled"}
                    />
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {appointment.patients.map((p) => (
                        <li key={p.id}>
                          <PatientNameLink patient={p} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Detail>
                <SuggestedFichas appointment={appointment} canEdit={canEdit && status !== "cancelled"} />
                {appointment.patients.some((p) => p.reminder) && (
                  <Detail
                    icon={missesReminder(appointment) ? <BellOff /> : <Bell />}
                    label="Recordatorio"
                  >
                    <ul className="flex flex-col gap-0.5">
                      {appointment.patients.map((p) =>
                        p.reminder ? (
                          <li
                            key={p.id}
                            className={
                              p.reminder === "missing" || p.reminder === "failed"
                                ? "text-rose-700 dark:text-rose-400"
                                : undefined
                            }
                          >
                            {appointment.patients.length > 1 && `${patientName(p)}: `}
                            {reminderLabels[p.reminder]}
                          </li>
                        ) : null,
                      )}
                    </ul>
                    {missesReminder(appointment) && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {appointment.patients.some((p) => p.reminder === "missing" && p.patientId)
                          ? "Añade el email en su ficha"
                          : "Edita la cita para añadir su email"}
                        {appointment.patients.some((p) => p.reminder === "missing" && p.patientId) &&
                        appointment.patients.some((p) => p.reminder === "missing" && !p.patientId)
                          ? ", o edita la cita para los que no tienen ficha."
                          : "."}
                      </span>
                    )}
                  </Detail>
                )}
                <Detail icon={<Stethoscope />} label="Fisio">
                  {appointment.physio?.name ?? "Sin fisio asignado: edita la sesión o la clase para asignarlo"}
                </Detail>
                <Detail icon={<DoorOpen />} label="Sala">
                  {appointment.room.name}
                </Detail>
                {appointment.source === "online" && (
                  <Detail icon={<Globe />} label="Reserva online">
                    <span className="flex flex-col gap-0.5">
                      <span>Reservada por el paciente</span>
                      {appointment.contactPhone && (
                        <a href={`tel:${appointment.contactPhone}`} className="hover:underline">
                          {appointment.contactPhone}
                        </a>
                      )}
                      {appointment.contactEmail && (
                        <a
                          href={`mailto:${appointment.contactEmail}`}
                          className="break-all hover:underline"
                        >
                          {appointment.contactEmail}
                        </a>
                      )}
                    </span>
                  </Detail>
                )}
                {appointment.notes && (
                  <Detail icon={<NotebookPen />} label="Notas">
                    {appointment.notes}
                  </Detail>
                )}
                {status === "cancelled" && appointment.cancellationReason && (
                  <Detail icon={<XCircle />} label="Motivo">
                    {appointment.cancellationReason}
                  </Detail>
                )}
              </dl>

              {!canEdit && (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Esta cita es de otro fisio: puedes verla, pero solo {appointment.physio?.name ?? "su fisio"},
                  recepción o un administrador pueden modificarla.
                </p>
              )}

              {canEdit && (
              <DialogFooter className="gap-2 sm:justify-between">
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 /> Eliminar
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  {status === "cancelled" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      disabled={update.isPending}
                      onClick={() => save({ status: "booked" }, "Cita reactivada")}
                    >
                      {update.isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                      Reactivar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setMode("cancel")}
                    >
                      <XCircle /> Cancelar cita
                    </Button>
                  )}
                  {status !== "cancelled" && (
                    <Button type="button" className="rounded-full" onClick={() => setMode("edit")}>
                      <Pencil /> Editar
                    </Button>
                  )}
                </div>
              </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar la cita?"
        description={
          <>
            Se borrará la cita de <strong className="font-medium text-foreground">{title}</strong> ({range})
            y su historial. Si el paciente solo no va a venir, mejor cancélala.
          </>
        }
        confirmLabel="Eliminar cita"
        onConfirm={deleteIt}
        pending={remove.isPending}
      />
    </>
  );
}

// One "icon · label · value" row of the details
function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[1.25rem_7.5rem_1fr] items-start gap-2">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

type Scope = "this" | "following" | "all";

// Which appointments of a weekly series a change applies to. Only future ones
// that weren't changed by hand are touched
function ScopePicker({ value, onChange, verb }: { value: Scope; onChange: (s: Scope) => void; verb: string }) {
  const options: [Scope, string, string][] = [
    ["this", `${verb} solo esta`, "Las demás citas de la serie no cambian"],
    ["following", "Esta y las siguientes", "Desde esta cita en adelante"],
    ["all", "Todas", "Todas las citas futuras de la serie"],
  ];
  return (
    <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="A qué citas">
      {options.map(([key, label, hint]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={
            "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors " +
            (value === key ? "border-primary bg-primary/5" : "hover:bg-muted")
          }
        >
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </button>
      ))}
    </div>
  );
}

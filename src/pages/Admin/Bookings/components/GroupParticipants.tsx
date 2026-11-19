import { useState, type FormEvent } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, AppointmentPatientInput } from "@/adapters/api";
import { useSetAttendance, useUpdateAppointment } from "@/adapters/hook";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { patientName, toPatientInput } from "../calendarUtils";
import PatientFields from "./PatientFields";
import PatientNameLink from "./PatientNameLink";

type Props = {
  appointment: Appointment;
  // Places: the smaller of the service's maximum and the room's capacity
  maxPatients: number;
  // Can change this appointment (and it isn't cancelled)
  canEdit: boolean;
};

const emptyPatient: AppointmentPatientInput = { firstName: "", lastName: "" };

// Participants of a group session, inside the appointment's details: add and
// remove people right there, without opening the full edit form.
// Each change is saved at once (the backend checks the places again)
export default function GroupParticipants({ appointment, maxPatients, canEdit }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AppointmentPatientInput>(emptyPatient);
  const update = useUpdateAppointment();
  const attendance = useSetAttendance();
  // Group sessions can be left empty (people may join or book later)
  const canEmpty = true;
  const mark = (rowId: string, value: "pending" | "attended" | "no_show") =>
    attendance.mutate(
      { appointmentId: appointment.id, rows: [{ rowId, attendance: value }] },
      { onError: (error) => toast.error("No se pudo guardar la asistencia", { description: error.message }) },
    );

  const current: AppointmentPatientInput[] = appointment.patients.map(toPatientInput);
  // A ficha, or both names for someone new
  const draftReady = !!draft.patientId || (!!draft.firstName.trim() && !!draft.lastName.trim());
  const full = current.length >= maxPatients;

  const savePatients = (patients: typeof current, success: string) =>
    update.mutate(
      { id: appointment.id, changes: { patients } },
      {
        onSuccess: () => {
          toast.success(success);
          setDraft(emptyPatient);
          setAdding(false);
        },
        onError: (error) =>
          toast.error("No se pudo cambiar los participantes", { description: error.message }),
      },
    );

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftReady) return;
    savePatients(
      [...current, { ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim() }],
      "Participante añadido",
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {appointment.patients.map((p, index) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="flex-1">
              <PatientNameLink patient={p} />
            </span>
            {canEdit && (
              // Pasar lista: did they come? Tap again to undo
              <span className="flex gap-1" role="group" aria-label={`Asistencia de ${patientName(p)}`}>
                {(
                  [
                    ["attended", "Vino"],
                    ["no_show", "No vino"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={p.attendance === value}
                    disabled={attendance.isPending}
                    onClick={() => mark(p.id, p.attendance === value ? "pending" : value)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs transition-colors",
                      p.attendance === value
                        ? value === "attended"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-destructive bg-destructive/10 text-destructive"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </span>
            )}
            {canEdit && (current.length > 1 || canEmpty) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground hover:text-destructive"
                disabled={update.isPending}
                onClick={() =>
                  savePatients(
                    current.filter((_, i) => i !== index),
                    "Participante quitado",
                  )
                }
                aria-label={`Quitar a ${patientName(p)}`}
              >
                <X />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {canEdit &&
        (adding ? (
          <form onSubmit={add} className="flex flex-col gap-2 rounded-lg border p-2">
            <PatientFields
              autoFocus
              value={draft}
              onChange={setDraft}
              label="Participante nuevo"
              excludeIds={appointment.patients.flatMap((p) => (p.patientId ? [p.patientId] : []))}
              disabled={update.isPending}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={update.isPending}
                onClick={() => {
                  setDraft(emptyPatient);
                  setAdding(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full"
                disabled={!draftReady || update.isPending}
              >
                {update.isPending && <Loader2 className="animate-spin" />}
                Añadir
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit rounded-full"
            disabled={full}
            onClick={() => setAdding(true)}
          >
            <UserPlus /> {full ? "Sin plazas libres" : "Añadir participante"}
          </Button>
        ))}
    </div>
  );
}

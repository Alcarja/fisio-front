import { useState, type FormEvent } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { Appointment } from "@/adapters/api";
import { useUpdateAppointment } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { patientName } from "../calendarUtils";

type Props = {
  appointment: Appointment;
  // Places: the smaller of the service's maximum and the room's capacity
  maxPatients: number;
  // Can change this appointment (and it isn't cancelled)
  canEdit: boolean;
};

// Participants of a group session, inside the appointment's details: add and
// remove people right there, without opening the full edit form.
// Each change is saved at once (the backend checks the places again)
export default function GroupParticipants({ appointment, maxPatients, canEdit }: Props) {
  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const update = useUpdateAppointment();

  const current = appointment.patients.map(({ firstName, lastName }) => ({ firstName, lastName }));
  const full = current.length >= maxPatients;

  const savePatients = (patients: typeof current, success: string) =>
    update.mutate(
      { id: appointment.id, changes: { patients } },
      {
        onSuccess: () => {
          toast.success(success);
          setFirstName("");
          setLastName("");
          setAdding(false);
        },
        onError: (error) =>
          toast.error("No se pudo cambiar los participantes", { description: error.message }),
      },
    );

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    savePatients(
      [...current, { firstName: firstName.trim(), lastName: lastName.trim() }],
      "Participante añadido",
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {appointment.patients.map((p, index) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{patientName(p)}</span>
            {canEdit && current.length > 1 && (
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
            <div className="flex gap-2">
              <Input
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nombre"
                aria-label="Nombre del participante"
                disabled={update.isPending}
              />
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellidos"
                aria-label="Apellidos del participante"
                disabled={update.isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={update.isPending}
                onClick={() => setAdding(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full"
                disabled={!firstName.trim() || !lastName.trim() || update.isPending}
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

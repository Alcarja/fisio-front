import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { Appointment } from "@/adapters/api";
import { useLinkAppointmentPatient, useMe } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { hasFeature } from "@/lib/roles";
import { patientName } from "../calendarUtils";

// Online bookings that weren't linked to a ficha automatically (the email
// matched one but the name didn't, or several did): the clinic decides.
// Only with "Pacientes e historia clínica"
export default function SuggestedFichas({ appointment, canEdit }: { appointment: Appointment; canEdit: boolean }) {
  const { data: me } = useMe();
  const link = useLinkAppointmentPatient();
  const suggestions = appointment.patients.filter((p) => !p.patientId && p.suggestedPatient);
  if (!canEdit || !hasFeature(me, "clinical_history") || suggestions.length === 0) return null;

  const run = (rowId: string, body: { patientId?: string; dismiss?: boolean }, done: string) =>
    link.mutate(
      { appointmentId: appointment.id, rowId, ...body },
      {
        onSuccess: () => toast.success(done),
        onError: (e) => toast.error("No se pudo cambiar", { description: e.message }),
      },
    );

  return (
    <div className="flex flex-col gap-2">
      {suggestions.map((p) => (
        <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-dashed px-3 py-2 text-sm">
          <p>
            <Link2 className="mr-1.5 inline size-3.5 text-primary" />
            «{patientName(p)}» reservó con el email de la ficha de <strong>{p.suggestedPatient!.name}</strong>. ¿Es la
            misma persona?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={link.isPending}
              onClick={() => run(p.id, { patientId: p.suggestedPatient!.id }, "Cita enlazada a su ficha")}
            >
              {link.isPending && <Loader2 className="animate-spin" />}
              Sí, enlazar a su ficha
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={link.isPending}
              onClick={() => run(p.id, { dismiss: true }, "Sugerencia descartada")}
            >
              No es esta persona
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
import { Pencil, Users } from "lucide-react";
import type { BookingProfessional, OpeningHours } from "@/adapters/api";
import MemberAvatar from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clinicRoleLabels } from "@/lib/roles";
import SettingsSection from "../../components/SettingsSection";
import { openDaysLabel } from "../onlineBookingUtils";
import BookingHoursDialog from "./BookingHoursDialog";

type Props = {
  professionals: BookingProfessional[];
  clinicHours: OpeningHours[];
  // The clinic's switch: when off, the hours are kept but nobody can book
  bookingEnabled: boolean;
};

// Each professional: open or closed to online bookings, and on which days
export default function ProfessionalsSection({
  professionals,
  clinicHours,
  bookingEnabled,
}: Props) {
  const [editing, setEditing] = useState<BookingProfessional | null>(null);

  return (
    <SettingsSection
      title="Horario de cada profesional"
      description="Cuándo acepta reservas online cada uno. Sin horario, no se puede reservar online con esa persona. Las citas que dais desde la agenda no cambian."
    >
      {!bookingEnabled && (
        <p className="mb-4 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          La reserva online está desactivada. Puedes dejar los horarios preparados: no se usarán
          hasta que la actives.
        </p>
      )}

      {professionals.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <Users className="size-5" />
          Todavía no hay profesionales que atiendan citas. Añádelos en Equipo.
        </div>
      ) : (
        <ul className="flex flex-col divide-y">
          {professionals.map((professional) => {
            const open = professional.weeklyHours.length > 0;
            return (
              <li
                key={professional.memberId}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <MemberAvatar member={professional} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <span className="truncate">{professional.name}</span>
                    <Badge variant={open ? "secondary" : "outline"} className="shrink-0 text-[10px]">
                      {open ? "Abierto" : "Cerrado"}
                    </Badge>
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {clinicRoleLabels[professional.role]}
                    {open && ` · ${openDaysLabel(professional.weeklyHours)}`}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setEditing(professional)}
                >
                  <Pencil /> {open ? "Editar horario" : "Abrir reservas"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* key: the form starts from that professional's saved hours */}
      {editing && (
        <BookingHoursDialog
          key={editing.memberId}
          professional={editing}
          clinicHours={clinicHours}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </SettingsSection>
  );
}

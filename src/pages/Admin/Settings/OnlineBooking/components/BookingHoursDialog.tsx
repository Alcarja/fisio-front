import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BookingProfessional, OpeningHours, TimeRange, Weekday } from "@/adapters/api";
import { useUpdateBookingHours } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WeekHoursEditor from "../../Schedule/components/WeekHoursEditor";
import { toHours, toWeek, weekErrors, type Week } from "../../Schedule/scheduleUtils";
import { isOutsideClinicHours } from "../onlineBookingUtils";

type Props = {
  professional: BookingProfessional;
  clinicHours: OpeningHours[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// When one professional accepts online bookings: open or closed each day, and
// the slots of each open day. Every day closed = can't be booked online
export default function BookingHoursDialog({
  professional,
  clinicHours,
  open,
  onOpenChange,
}: Props) {
  const initial = toWeek(professional.weeklyHours);
  const clinicWeek = toWeek(clinicHours);
  const [week, setWeek] = useState<Week>(initial);
  const save = useUpdateBookingHours();

  const setDay = (day: Weekday, ranges: TimeRange[]) => setWeek((w) => ({ ...w, [day]: ranges }));

  const errors = weekErrors(week);
  const hasErrors = Object.values(errors).some(Boolean);
  const isDirty = JSON.stringify(toHours(week)) !== JSON.stringify(toHours(initial));

  const close = (next: boolean) => {
    if (!next && save.isPending) return;
    onOpenChange(next);
  };

  const handleSave = () =>
    save.mutate(
      { memberId: professional.memberId, weeklyHours: toHours(week) },
      {
        onSuccess: () => {
          toast.success("Horario de reservas guardado", { description: professional.name });
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error("No se pudo guardar el horario", { description: error.message }),
      },
    );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reservas online de {professional.name}</DialogTitle>
          <DialogDescription>
            Los días y las horas en que se puede reservar online con esta persona. Deja todos los
            días cerrados para que no reciba reservas online.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit rounded-full"
            onClick={() => setWeek(toWeek(clinicHours))}
            disabled={clinicHours.length === 0 || save.isPending}
          >
            <Copy /> Copiar el horario de la clínica
          </Button>

          <WeekHoursEditor
            week={week}
            onDayChange={setDay}
            errors={errors}
            idPrefix={`booking-${professional.memberId}`}
            disabled={save.isPending}
            dayNote={(day) =>
              isOutsideClinicHours(week[day], clinicWeek[day])
                ? "Parte de este horario queda fuera del de la clínica: ahí no se ofrecerán citas."
                : null
            }
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={save.isPending}
            onClick={() => close(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={!isDirty || hasErrors || save.isPending}
            onClick={handleSave}
          >
            {save.isPending && <Loader2 className="animate-spin" />}
            Guardar horario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

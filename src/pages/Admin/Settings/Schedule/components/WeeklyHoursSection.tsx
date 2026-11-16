import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OpeningHours, TimeRange, Weekday } from "@/adapters/api";
import { useUpdateWeeklyHours } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import SettingsSection from "../../components/SettingsSection";
import { toHours, toWeek, weekErrors, type Week } from "../scheduleUtils";
import WeekHoursEditor from "./WeekHoursEditor";

type Props = {
  weeklyHours: OpeningHours[];
};

// Monday to Sunday: open or closed, and the slots of each open day.
// Saved all at once. Render with a key that changes when the data reloads
export default function WeeklyHoursSection({ weeklyHours }: Props) {
  const initial = toWeek(weeklyHours);
  const [week, setWeek] = useState<Week>(initial);
  const save = useUpdateWeeklyHours();

  const setDay = (day: Weekday, ranges: TimeRange[]) => setWeek((w) => ({ ...w, [day]: ranges }));

  const errors = weekErrors(week);
  const hasErrors = Object.values(errors).some(Boolean);
  const isDirty = JSON.stringify(toHours(week)) !== JSON.stringify(toHours(initial));

  // Monday's slots on every other weekday (Tuesday to Friday)
  const copyMondayToWeekdays = () =>
    setWeek((w) => ({ ...w, 2: [...w[1]], 3: [...w[1]], 4: [...w[1]], 5: [...w[1]] }));

  const handleSave = () =>
    save.mutate(toHours(week), {
      onSuccess: () => toast.success("Horario guardado"),
      onError: (error) =>
        toast.error("No se pudo guardar el horario", { description: error.message }),
    });

  return (
    <SettingsSection
      title="Horario semanal"
      description="Los días y las horas en que abre tu clínica. Puedes añadir varias franjas por día."
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={copyMondayToWeekdays}
          disabled={week[1].length === 0 || save.isPending}
        >
          <Copy /> Copiar lunes a laborables
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <WeekHoursEditor
          week={week}
          onDayChange={setDay}
          errors={errors}
          idPrefix="open"
          disabled={save.isPending}
        />

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
          {isDirty && (
            <span className="text-sm text-muted-foreground sm:mr-auto">
              {hasErrors ? "Revisa las franjas marcadas en rojo." : "Tienes cambios sin guardar."}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={!isDirty || save.isPending}
            onClick={() => setWeek(initial)}
          >
            Descartar
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
        </div>
      </div>
    </SettingsSection>
  );
}

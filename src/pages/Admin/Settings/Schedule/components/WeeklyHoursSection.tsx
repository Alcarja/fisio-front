import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OpeningHours, TimeRange, Weekday } from "@/adapters/api";
import { useUpdateWeeklyHours } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import SettingsSection from "../../components/SettingsSection";
import { rangesError, sortRanges, weekdays } from "../scheduleUtils";
import TimeRangesEditor from "./TimeRangesEditor";

type Week = Record<Weekday, TimeRange[]>;

const toWeek = (hours: OpeningHours[]): Week => {
  const week = Object.fromEntries(weekdays.map((d) => [d.value, []])) as unknown as Week;
  for (const { weekday, startTime, endTime } of hours) week[weekday].push({ startTime, endTime });
  for (const d of weekdays) week[d.value] = sortRanges(week[d.value]);
  return week;
};

const toHours = (week: Week): OpeningHours[] =>
  weekdays.flatMap((d) => sortRanges(week[d.value]).map((r) => ({ weekday: d.value, ...r })));

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

  const errors = Object.fromEntries(
    weekdays.map((d) => [d.value, rangesError(week[d.value])]),
  ) as Record<Weekday, string | null>;
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
        <ul className="flex flex-col divide-y">
          {weekdays.map((day) => {
            const ranges = week[day.value];
            const open = ranges.length > 0;
            const checkboxId = `open-${day.value}`;

            return (
              <li
                key={day.value}
                className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr]"
              >
                <div className="flex items-center gap-2 sm:h-9">
                  <Checkbox
                    id={checkboxId}
                    checked={open}
                    disabled={save.isPending}
                    onCheckedChange={(checked) =>
                      setDay(day.value, checked ? [{ startTime: "09:00", endTime: "14:00" }] : [])
                    }
                  />
                  <Label htmlFor={checkboxId} className={cn(!open && "text-muted-foreground")}>
                    {day.label}
                  </Label>
                </div>

                {open ? (
                  <div className="flex flex-col gap-1">
                    <TimeRangesEditor
                      ranges={ranges}
                      onChange={(next) => setDay(day.value, next)}
                      label={day.label}
                      disabled={save.isPending}
                    />
                    {errors[day.value] && (
                      <p role="alert" className="text-xs text-destructive">
                        {errors[day.value]}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground sm:leading-9">Cerrado</span>
                )}
              </li>
            );
          })}
        </ul>

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

import type { TimeRange, Weekday } from "@/adapters/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { weekdays, type Week } from "../scheduleUtils";
import TimeRangesEditor from "./TimeRangesEditor";

type Props = {
  week: Week;
  onDayChange: (day: Weekday, ranges: TimeRange[]) => void;
  // Problem with each day's slots (weekErrors in scheduleUtils)
  errors: Record<Weekday, string | null>;
  // Makes the checkbox ids unique when two editors are on screen
  idPrefix: string;
  disabled?: boolean;
  // Optional warning under a day that is fine but worth a look
  dayNote?: (day: Weekday) => string | null;
};

// Monday to Sunday: open or closed, and the slots of each open day.
// Used by the clinic's weekly hours and by each professional's booking hours
export default function WeekHoursEditor({
  week,
  onDayChange,
  errors,
  idPrefix,
  disabled,
  dayNote,
}: Props) {
  return (
    <ul className="flex flex-col divide-y">
      {weekdays.map((day) => {
        const ranges = week[day.value];
        const open = ranges.length > 0;
        const checkboxId = `${idPrefix}-${day.value}`;
        const note = open && !errors[day.value] ? dayNote?.(day.value) : null;

        return (
          <li
            key={day.value}
            className="grid grid-cols-1 gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
          >
            <div className="flex items-center gap-2 sm:h-9">
              <Checkbox
                id={checkboxId}
                checked={open}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onDayChange(day.value, checked ? [{ startTime: "09:00", endTime: "14:00" }] : [])
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
                  onChange={(next) => onDayChange(day.value, next)}
                  label={day.label}
                  disabled={disabled}
                />
                {errors[day.value] && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors[day.value]}
                  </p>
                )}
                {note && <p className="text-xs text-muted-foreground">{note}</p>}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground sm:leading-9">Cerrado</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

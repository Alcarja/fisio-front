import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePublicSlots } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { addDays, dayParts, formatLongDate } from "../bookingFormat";
import Choice from "./Choice";

const DAYS_PER_PAGE = 7;

type Props = {
  slug: string;
  serviceId: string;
  // null: anyone available
  professionalId: string | null;
  // First and last dates that can be booked
  today: string;
  lastDate: string;
  // First day of the week being shown
  weekStart: string;
  onWeekChange: (weekStart: string) => void;
  date: string | null;
  time: string | null;
  onSelect: (date: string | null, time: string | null) => void;
};

// A week of days, and the free times of the chosen day
export default function SlotPicker({
  slug,
  serviceId,
  professionalId,
  today,
  lastDate,
  weekStart,
  onWeekChange,
  date,
  time,
  onSelect,
}: Props) {
  const weekEnd = addDays(weekStart, DAYS_PER_PAGE - 1);
  const { data: days, isPending, error } = usePublicSlots({
    slug,
    serviceId,
    professionalId: professionalId ?? undefined,
    from: weekStart,
    to: weekEnd,
  });

  const dates = Array.from({ length: DAYS_PER_PAGE }, (_, i) => addDays(weekStart, i));
  const timesOf = (d: string) => days?.find((day) => day.date === d)?.times ?? [];
  const weekIsEmpty = !!days && days.every((day) => day.times.length === 0);
  const times = date ? timesOf(date) : [];

  const goTo = (start: string) => {
    onWeekChange(start);
    onSelect(null, null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Semana anterior"
          disabled={weekStart <= today}
          onClick={() => goTo(addDays(weekStart, -DAYS_PER_PAGE))}
        >
          <ChevronLeft />
        </Button>
        <div className="grid min-w-0 flex-1 grid-cols-7 gap-1">
          {dates.map((d) => {
            const parts = dayParts(d);
            return (
              <Choice
                key={d}
                selected={date === d}
                disabled={isPending || timesOf(d).length === 0}
                onSelect={() => onSelect(d, null)}
                className="flex flex-col items-center gap-0.5 px-0 py-2 text-center"
              >
                <span className="text-[11px] capitalize opacity-70">{parts.weekday}</span>
                <span className="text-base font-medium tabular-nums">{parts.day}</span>
                <span className="text-[11px] opacity-70">{parts.month}</span>
              </Choice>
            );
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Semana siguiente"
          disabled={weekEnd >= lastDate}
          onClick={() => goTo(addDays(weekStart, DAYS_PER_PAGE))}
        >
          <ChevronRight />
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : weekIsEmpty ? (
        <p className="text-sm text-muted-foreground">
          No quedan horas libres esta semana.
          {weekEnd < lastDate && " Prueba con la siguiente."}
        </p>
      ) : !date ? (
        <p className="text-sm text-muted-foreground">Elige un día para ver las horas libres.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {formatLongDate(date)}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {times.map((t) => (
              <Choice
                key={t}
                selected={time === t}
                onSelect={() => onSelect(date, t)}
                className="px-0 py-2.5 text-center tabular-nums"
              >
                {t}
              </Choice>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

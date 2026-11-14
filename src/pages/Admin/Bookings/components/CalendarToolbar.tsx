import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarView = "week" | "day";

type Props = {
  title: string; // "16 – 21 nov 2026" or "lunes, 16 de noviembre"
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewBooking: () => void;
};

// Above the calendar: move between weeks/days, switch view, new booking
export default function CalendarToolbar({
  title,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onNewBooking,
}: Props) {
  const unit = view === "week" ? "semana" : "día";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button variant="outline" className="rounded-full" onClick={onToday}>
          Hoy
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onPrevious}
          aria-label={`${unit === "día" ? "Día" : "Semana"} anterior`}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onNext}
          aria-label={`${unit === "día" ? "Día" : "Semana"} siguiente`}
        >
          <ChevronRight />
        </Button>
      </div>

      <h2 className="font-display text-2xl tracking-tight first-letter:uppercase sm:text-3xl">
        {title}
      </h2>

      <div className="ml-auto flex items-center gap-2">
        {/* Week / day */}
        <div role="radiogroup" aria-label="Vista" className="flex rounded-full border bg-card p-1">
          {(
            [
              { value: "week", label: "Semana" },
              { value: "day", label: "Día" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={view === option.value}
              onClick={() => onViewChange(option.value)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                view === option.value
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button className="rounded-full" onClick={onNewBooking}>
          <Plus /> Nueva reserva
        </Button>
      </div>
    </div>
  );
}

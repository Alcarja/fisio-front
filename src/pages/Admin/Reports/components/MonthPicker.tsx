import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth } from "../reportUtils";

type Props = {
  month: Date;
  isCurrent: boolean; // the month on screen is this month
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
  nextDisabled?: boolean; // e.g. Pagos: future months can't be paid yet
};

// The only filter of the page: everything below refers to this month
export default function MonthPicker({
  month,
  isCurrent,
  onPrevious,
  onNext,
  onCurrent,
  nextDisabled = false,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={onCurrent}
          disabled={isCurrent}
        >
          Este mes
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onPrevious}
          aria-label="Mes anterior"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Mes siguiente"
        >
          <ChevronRight />
        </Button>
      </div>
      <h2
        className="font-display text-2xl tracking-tight first-letter:uppercase sm:text-3xl"
        aria-live="polite"
      >
        {formatMonth(month)}
      </h2>
    </div>
  );
}

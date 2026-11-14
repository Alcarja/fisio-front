import { Plus, X } from "lucide-react";
import type { TimeRange } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  ranges: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
  // Used for accessible labels, e.g. "Lunes"
  label: string;
  disabled?: boolean;
};

// Default for a new slot: right after the last one, or a morning slot
function nextRange(ranges: TimeRange[]): TimeRange {
  const last = ranges.at(-1);
  if (!last) return { startTime: "09:00", endTime: "14:00" };
  return { startTime: last.endTime, endTime: last.endTime < "20:00" ? "20:00" : "23:59" };
}

// List of "start – end" slots with add and remove. Used by the weekly hours
// and by special-hours exceptions
export default function TimeRangesEditor({ ranges, onChange, label, disabled }: Props) {
  const update = (index: number, patch: Partial<TimeRange>) =>
    onChange(ranges.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-2">
      {ranges.map((range, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            type="time"
            step={900}
            value={range.startTime}
            onChange={(e) => update(index, { startTime: e.target.value })}
            aria-label={`${label}, franja ${index + 1}: apertura`}
            disabled={disabled}
            className="w-28"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="time"
            step={900}
            value={range.endTime}
            onChange={(e) => update(index, { endTime: e.target.value })}
            aria-label={`${label}, franja ${index + 1}: cierre`}
            disabled={disabled}
            className="w-28"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground"
            onClick={() => onChange(ranges.filter((_, i) => i !== index))}
            aria-label={`Quitar franja ${index + 1} de ${label}`}
            disabled={disabled}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit rounded-full text-muted-foreground"
        onClick={() => onChange([...ranges, nextRange(ranges)])}
        disabled={disabled}
      >
        <Plus /> Añadir franja
      </Button>
    </div>
  );
}

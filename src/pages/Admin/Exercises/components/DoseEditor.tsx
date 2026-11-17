import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DoseDraft } from "../editorItems";

type Props = {
  value: DoseDraft;
  onChange: (change: Partial<DoseDraft>) => void;
};

// The dose, read as a sentence: "3 series × 12 repeticiones · descanso 60 s".
// Repetitions or time (stretches, planks, balance), never both boxes at once
export default function DoseEditor({ value, onChange }: Props) {
  const box = (key: "sets" | "reps" | "seconds" | "rest", label: string, max: number, min = 1) => (
    <Input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      aria-label={label}
      value={value[key]}
      onChange={(e) => onChange({ [key]: e.target.value })}
      className="h-8 w-14 px-2 text-center tabular-nums"
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Cómo se mide" className="flex w-fit gap-0.5 rounded-full border p-0.5 text-xs">
        {(
          [
            ["reps", "Repeticiones"],
            ["time", "Tiempo"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value.mode === key}
            onClick={() => onChange({ mode: key })}
            className={cn(
              "rounded-full px-2.5 py-0.5 transition-colors",
              value.mode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
        {box("sets", "Series", 20)}
        <span className="text-muted-foreground">series ×</span>
        {value.mode === "reps" ? (
          <>
            {box("reps", "Repeticiones", 200)}
            <span className="text-muted-foreground">rep.</span>
          </>
        ) : (
          <>
            {box("seconds", "Segundos", 1800)}
            <span className="text-muted-foreground">s</span>
          </>
        )}
        <span className="text-muted-foreground">· descanso</span>
        {box("rest", "Descanso en segundos", 600, 0)}
        <span className="text-muted-foreground">s</span>
        <label className="ml-1 flex items-center gap-1.5">
          <Checkbox checked={value.perSide} onCheckedChange={(v) => onChange({ perSide: v === true })} />
          cada lado
        </label>
      </div>
      {value.mode === "reps" && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Mantener cada repetición
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={1800}
            aria-label="Segundos de cada repetición"
            placeholder="—"
            value={value.seconds}
            onChange={(e) => onChange({ seconds: e.target.value })}
            className="h-7 w-14 px-2 text-center text-xs tabular-nums"
          />
          s (opcional)
        </label>
      )}
    </div>
  );
}

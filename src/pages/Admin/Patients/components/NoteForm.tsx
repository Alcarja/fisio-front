import { useId, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import type { CaseNoteInput } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { painClass, todayIso } from "../clinicalFormat";

type Props = {
  // Leave out for a new note (today, no pain recorded)
  initial?: CaseNoteInput;
  // The note can't be earlier than the expediente
  minDate: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (note: CaseNoteInput) => void;
  // Shows a "Cancelar" button
  onCancel?: () => void;
};

const levels = Array.from({ length: 11 }, (_, i) => i);

// One evolution note: what was done and how the patient is, the session's day
// and the pain from 0 to 10 (optional; click the number again to remove it)
export default function NoteForm({ initial, minDate, submitLabel, pending, onSubmit, onCancel }: Props) {
  const [text, setText] = useState(initial?.text ?? "");
  const [painLevel, setPainLevel] = useState<number | null>(initial?.painLevel ?? null);
  const [date, setDate] = useState(initial?.date ?? todayIso);
  // Several forms can be on screen (one per open expediente)
  const dateId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (text.trim() && date) onSubmit({ text: text.trim(), painLevel, date });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border p-3">
      <Textarea
        rows={3}
        maxLength={5000}
        required
        placeholder="Evolución de hoy: cómo llega, qué se ha hecho, ejercicios para casa…"
        aria-label="Nota de evolución"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={pending}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Dolor (0 nada · 10 máximo)</span>
          <div role="radiogroup" aria-label="Dolor de 0 a 10" className="flex flex-wrap gap-1">
            {levels.map((level) => {
              const selected = painLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={pending}
                  onClick={() => setPainLevel(selected ? null : level)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs tabular-nums transition-colors",
                    selected
                      ? cn("border-transparent font-medium", painClass(level))
                      : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={dateId} className="text-xs text-muted-foreground">
            Día de la sesión
          </label>
          <Input
            id={dateId}
            type="date"
            required
            min={minDate}
            max={todayIso()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={pending}
            className="w-40"
          />
        </div>

        <div className="ml-auto flex gap-2 self-end">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={pending}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm" className="rounded-full" disabled={!text.trim() || pending}>
            {pending && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

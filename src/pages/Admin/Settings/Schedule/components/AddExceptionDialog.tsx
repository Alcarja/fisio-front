import { useState, type FormEvent } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ScheduleExceptionType, TimeRange } from "@/adapters/api";
import { useCreateScheduleException } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { rangesError, todayIso } from "../scheduleUtils";
import TimeRangesEditor from "./TimeRangesEditor";

const types: { value: ScheduleExceptionType; label: string; hint: string }[] = [
  { value: "closed", label: "Cerrado", hint: "Festivos, vacaciones, cierres." },
  { value: "special_hours", label: "Horario especial", hint: "Abre con otras horas, p. ej. en verano." },
];

const emptyForm = () => ({
  type: "closed" as ScheduleExceptionType,
  startDate: todayIso(),
  endDate: todayIso(),
  reason: "",
  hours: [{ startTime: "08:00", endTime: "15:00" }] as TimeRange[],
});

// Popup to add a holiday, a closure or a period with special hours.
// Special hours apply to every day of the range (per-weekday hours can come later)
export default function AddExceptionDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const create = useCreateScheduleException();

  const datesError = form.endDate < form.startDate ? "La fecha de fin no puede ser anterior." : null;
  const hoursError = form.type === "special_hours" ? rangesError(form.hours) : null;
  const noHours = form.type === "special_hours" && form.hours.length === 0;

  const handleOpenChange = (next: boolean) => {
    if (!next && create.isPending) return;
    setOpen(next);
    if (!next) setForm(emptyForm());
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (datesError || hoursError || noHours) return;
    create.mutate(
      {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim() || null,
        hours:
          form.type === "special_hours" ? form.hours.map((h) => ({ ...h, weekday: null })) : [],
      },
      {
        onSuccess: () => {
          toast.success("Excepción añadida");
          handleOpenChange(false);
        },
        onError: (error) =>
          toast.error("No se pudo añadir la excepción", { description: error.message }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="rounded-full">
          <CalendarPlus /> Añadir excepción
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Añadir excepción</DialogTitle>
            <DialogDescription>Días en los que el horario semanal no se aplica.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            {/* Type */}
            <div role="radiogroup" aria-label="Tipo de excepción" className="grid grid-cols-2 gap-2">
              {types.map((t) => {
                const selected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors",
                      selected ? "border-primary bg-secondary" : "hover:bg-muted",
                    )}
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.hint}</span>
                  </button>
                );
              })}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="exception-start">Desde</Label>
                <Input
                  id="exception-start"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => {
                    const startDate = e.target.value;
                    // Keep the end date valid when moving the start forward
                    setForm((f) => ({
                      ...f,
                      startDate,
                      endDate: f.endDate < startDate ? startDate : f.endDate,
                    }));
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="exception-end">Hasta (incluido)</Label>
                <Input
                  id="exception-end"
                  type="date"
                  required
                  min={form.startDate}
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  aria-invalid={!!datesError}
                />
              </div>
              {datesError && (
                <p role="alert" className="col-span-2 text-xs text-destructive">
                  {datesError}
                </p>
              )}
            </div>

            {/* Special hours */}
            {form.type === "special_hours" && (
              <div className="flex flex-col gap-2">
                <Label>Horas de apertura</Label>
                <TimeRangesEditor
                  ranges={form.hours}
                  onChange={(hours) => setForm((f) => ({ ...f, hours }))}
                  label="Horario especial"
                />
                {(hoursError || noHours) && (
                  <p role="alert" className="text-xs text-destructive">
                    {noHours ? "Añade al menos una franja." : hoursError}
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="exception-reason">
                Motivo <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="exception-reason"
                placeholder="Navidad, horario de verano…"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={create.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="rounded-full"
              disabled={!!datesError || !!hoursError || noHours || create.isPending}
            >
              {create.isPending && <Loader2 className="animate-spin" />}
              Añadir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

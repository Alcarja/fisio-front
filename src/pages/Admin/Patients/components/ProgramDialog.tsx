import { useState, type FormEvent } from "react";
import { ArrowLeft, ClipboardList, FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ExerciseProgram, ExerciseTemplate } from "@/adapters/api";
import {
  useCreateProgram,
  useExercises,
  useExerciseTemplates,
  useMe,
  useUpdateProgram,
} from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ExerciseBuilder from "../../Exercises/components/ExerciseBuilder";
import { fromEditorItem, toEditorItem, type EditorItem } from "../../Exercises/editorItems";

type Props = {
  patientId: string;
  caseId: string;
  // "new": first program · "edit": change the active one ·
  // "phase": finish the active one and start a new one
  mode: "new" | "edit" | "phase";
  current?: ExerciseProgram;
  // Coming from a tabla ("Pautar a un paciente"): start with it
  template?: ExerciseTemplate;
  // Shown in the title when it's opened from outside the patient's ficha
  patientName?: string;
  onClose: () => void;
};

const DEFAULT_FREQUENCY = "1 vez al día, 5 días a la semana";

// Give a patient exercises for home inside an expediente. First: start from a
// tabla or from scratch. Then the same builder as the tablas, adjusted to them
export default function ProgramDialog({ patientId, caseId, mode, current, template, patientName, onClose }: Props) {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const { data: templates = [], isPending: loadingTemplates } = useExerciseTemplates(clinicId);
  const { data: exercises = [] } = useExercises(clinicId);
  const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? "Ejercicio";

  const fromTemplate = (t: ExerciseTemplate) => t.items.map((i) => toEditorItem(i, nameOf(i.exerciseId)));
  const fromCurrent = () =>
    current?.items.filter((i) => i.exerciseId).map((i) => toEditorItem({ ...i, exerciseId: i.exerciseId! }, i.name)) ?? [];

  // Editing (or a new phase of) what they have: straight to the builder.
  // A new one with tablas to choose from: the first step
  const [step, setStep] = useState<"start" | "build">(
    mode === "new" && !template ? "start" : "build",
  );
  const [frequency, setFrequency] = useState(template?.frequency ?? current?.frequency ?? DEFAULT_FREQUENCY);
  const [notes, setNotes] = useState(template?.notes ?? current?.notes ?? "");
  const [items, setItems] = useState<EditorItem[]>(() => (template ? fromTemplate(template) : fromCurrent()));
  const [startedFrom, setStartedFrom] = useState<string | null>(template?.name ?? null);

  const start = (t: ExerciseTemplate | null) => {
    setItems(t ? fromTemplate(t) : []);
    if (t?.frequency) setFrequency(t.frequency);
    if (t?.notes) setNotes(t.notes);
    setStartedFrom(t?.name ?? null);
    setStep("build");
  };

  const create = useCreateProgram();
  const update = useUpdateProgram();
  const pending = create.isPending || update.isPending;
  const valid = items.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    const data = { frequency: frequency.trim() || null, notes: notes.trim() || null, items: items.map(fromEditorItem) };
    const callbacks = {
      onSuccess: () => {
        toast.success(mode === "edit" ? "Ejercicios guardados" : mode === "phase" ? "Nueva fase pautada" : "Ejercicios pautados");
        onClose();
      },
      onError: (error: Error) => toast.error("No se pudieron guardar los ejercicios", { description: error.message }),
    };
    if (mode === "edit") update.mutate({ patientId, programId: current!.id, data }, callbacks);
    else create.mutate({ patientId, caseId, data, replaces: mode === "phase" ? current!.id : undefined }, callbacks);
  };

  const title =
    mode === "edit" ? "Editar ejercicios para casa" : mode === "phase" ? "Nueva fase de ejercicios" : "Pautar ejercicios para casa";

  if (step === "start") {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{patientName ? `${title} · ${patientName}` : title}</DialogTitle>
            <DialogDescription>¿Cómo quieres empezar? Después podrás ajustar cada ejercicio a este paciente.</DialogDescription>
          </DialogHeader>
          {loadingTemplates ? (
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => start(null)}
                className="flex flex-col items-start gap-2 rounded-2xl border border-dashed p-4 text-left transition-colors hover:border-primary hover:bg-secondary/40"
              >
                <FilePlus2 className="size-5 text-primary" />
                <span className="font-medium">Empezar en blanco</span>
                <span className="text-sm text-muted-foreground">Elige los ejercicios uno a uno desde el banco.</span>
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => start(t)}
                  className="flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors hover:border-primary hover:bg-secondary/40"
                >
                  <ClipboardList className="size-5 text-primary" />
                  <span className="font-medium">{t.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {t.items.length} {t.items.length === 1 ? "ejercicio" : "ejercicios"}:{" "}
                    {t.items.slice(0, 3).map((i) => nameOf(i.exerciseId)).join(", ")}
                    {t.items.length > 3 && "…"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!loadingTemplates && templates.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Consejo: guarda como tabla las combinaciones que más pautas (en Ejercicios → Tablas) y aquí las tendrás a un
              clic.
            </p>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="flex max-h-[92svh] flex-col overflow-y-auto sm:max-w-5xl md:h-[88svh] md:overflow-hidden">
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5 md:min-h-0 md:flex-1">
          <DialogHeader>
            <DialogTitle>{patientName ? `${title} · ${patientName}` : title}</DialogTitle>
            <DialogDescription>
              {mode === "phase"
                ? "Los ejercicios actuales quedan como fase anterior en el expediente. El paciente verá estos con el mismo enlace o QR que ya tiene."
                : startedFrom
                  ? `Desde la tabla «${startedFrom}». Los cambios solo afectan a este paciente.`
                  : "El paciente los verá en su móvil, sin el diagnóstico. Ajusta las dosis a su caso."}
            </DialogDescription>
          </DialogHeader>

          <ExerciseBuilder
            items={items}
            onChange={setItems}
            notesPlaceholder="Indicación para este paciente en este ejercicio"
            top={
              <div className="flex flex-col gap-2">
                <Label htmlFor="program-frequency">Frecuencia</Label>
                <Input id="program-frequency" maxLength={200} value={frequency} onChange={(e) => setFrequency(e.target.value)} />
              </div>
            }
            bottom={
              <div className="flex flex-col gap-2">
                <Label htmlFor="program-notes">Indicaciones para el paciente (opcional)</Label>
                <Textarea
                  id="program-notes"
                  rows={2}
                  maxLength={1000}
                  placeholder="Si algún ejercicio te duele más de 4 sobre 10, sáltatelo y coméntamelo en la próxima sesión."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Las verá en su página. No escribas el diagnóstico.</p>
              </div>
            }
          />

          <DialogFooter className="items-center gap-2">
            {mode === "new" && !template && (
              <Button type="button" variant="ghost" className="rounded-full sm:mr-auto" disabled={pending} onClick={() => setStep("start")}>
                <ArrowLeft /> Elegir otra tabla
              </Button>
            )}
            <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full" disabled={!valid || pending}>
              {pending && <Loader2 className="animate-spin" />}
              {mode === "edit" ? "Guardar" : `Pautar ${items.length || ""} ${items.length === 1 ? "ejercicio" : "ejercicios"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

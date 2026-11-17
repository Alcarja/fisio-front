import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Archive, Copy, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BodyRegion, Equipment, Exercise, ExerciseInput, ExerciseType } from "@/adapters/api";
import {
  useArchiveExercise,
  useCreateExercise,
  useDeleteExerciseImage,
  useDuplicateExercise,
  useUpdateExercise,
  useUploadExerciseImage,
} from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { bodyRegionLabels } from "../../Patients/clinicalFormat";
import { doseFromDraft, draftFromExercise, type DoseDraft } from "../editorItems";
import { compressImage, doseText, equipmentLabels, exerciseTypeLabels } from "../exerciseFormat";
import DoseEditor from "./DoseEditor";
import ExerciseThumb from "./ExerciseThumb";

type Props = {
  // Leave out to create one
  exercise?: Exercise;
  onClose: () => void;
  // After duplicating a base one: open the copy to edit it
  onDuplicated?: (copy: Exercise) => void;
};

// Create or edit one of the clinic's exercises. A base one (Kineflow's) only
// shows, with "Duplicar para adaptarlo". Mount it to open it
export default function ExerciseDialog({ exercise, onClose, onDuplicated }: Props) {
  const readOnly = !!exercise?.isBase;
  const [form, setForm] = useState(() => ({
    name: exercise?.name ?? "",
    bodyRegions: exercise?.bodyRegions ?? ([] as BodyRegion[]),
    type: exercise?.type ?? ("" as ExerciseType | ""),
    equipment: exercise?.equipment.filter((e) => e !== "none") ?? ([] as Equipment[]),
    instructions: exercise?.instructions ?? "",
    precautions: exercise?.precautions ?? "",
  }));
  const [dose, setDose] = useState<DoseDraft>(() => draftFromExercise(exercise));
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const create = useCreateExercise();
  const update = useUpdateExercise();
  const duplicate = useDuplicateExercise();
  const archive = useArchiveExercise();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const pending = create.isPending || update.isPending || duplicate.isPending || archive.isPending;
  const valid =
    !!form.name.trim() && form.bodyRegions.length > 0 && !!form.type && !!form.instructions.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly || !valid || !form.type) return;
    const data: ExerciseInput = {
      name: form.name.trim(),
      bodyRegions: form.bodyRegions,
      type: form.type,
      equipment: form.equipment.length ? form.equipment : ["none"],
      instructions: form.instructions.trim(),
      precautions: form.precautions.trim() || null,
      ...doseFromDraft(dose),
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(exercise ? "Ejercicio guardado" : "Ejercicio añadido al banco");
        onClose();
      },
      onError: (error: Error) => toast.error("No se pudo guardar el ejercicio", { description: error.message }),
    };
    if (exercise) update.mutate({ id: exercise.id, data }, callbacks);
    else create.mutate(data, callbacks);
  };

  const duplicateIt = () =>
    duplicate.mutate(exercise!.id, {
      onSuccess: (copy) => {
        toast.success("Copiado a tu banco: ya puedes adaptarlo");
        onClose();
        onDuplicated?.(copy);
      },
      onError: (error) => toast.error("No se pudo duplicar", { description: error.message }),
    });

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{readOnly ? exercise!.name : exercise ? "Editar ejercicio" : "Nuevo ejercicio"}</DialogTitle>
              {readOnly && <Badge variant="secondary">Banco Kineflow</Badge>}
            </div>
            <DialogDescription>
              {readOnly
                ? "Los ejercicios del banco de Kineflow no se editan. Duplícalo para adaptarlo y añadirle una imagen."
                : "Así lo verá el paciente. Escribe un paso por línea, en un lenguaje que entienda cualquiera."}
            </DialogDescription>
          </DialogHeader>

          {readOnly ? (
            <ReadOnlyView exercise={exercise!} />
          ) : (
            <div className="flex flex-col gap-5">
              <Field id="ex-name" label="Nombre">
                <Input
                  id="ex-name"
                  required
                  autoFocus
                  maxLength={120}
                  placeholder="Puente de glúteo"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>

              <Field label="Zonas">
                <Chips
                  options={Object.entries(bodyRegionLabels) as [BodyRegion, string][]}
                  selected={form.bodyRegions}
                  onToggle={(r) => set("bodyRegions", toggle(form.bodyRegions, r))}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="ex-type" label="Tipo">
                  <NativeSelect
                    id="ex-type"
                    required
                    className="w-full"
                    value={form.type}
                    onChange={(e) => set("type", e.target.value as ExerciseType)}
                  >
                    <NativeSelectOption value="" disabled>
                      Elige
                    </NativeSelectOption>
                    {Object.entries(exerciseTypeLabels).map(([key, label]) => (
                      <NativeSelectOption key={key} value={key}>
                        {label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <Field label="Material">
                <Chips
                  options={(Object.entries(equipmentLabels) as [Equipment, string][]).filter(([k]) => k !== "none")}
                  selected={form.equipment}
                  onToggle={(e) => set("equipment", toggle(form.equipment, e))}
                />
                <p className="text-xs text-muted-foreground">Sin marcar ninguno: sin material.</p>
              </Field>

              <Field id="ex-instructions" label="Cómo se hace">
                <Textarea
                  id="ex-instructions"
                  required
                  rows={5}
                  maxLength={3000}
                  placeholder={"Túmbate boca arriba con las rodillas dobladas.\nEleva la pelvis apretando los glúteos.\nBaja despacio."}
                  value={form.instructions}
                  onChange={(e) => set("instructions", e.target.value)}
                />
              </Field>

              <Field id="ex-precautions" label="Precauciones (opcional)">
                <Textarea
                  id="ex-precautions"
                  rows={2}
                  maxLength={1000}
                  placeholder="No arquees la zona lumbar al subir."
                  value={form.precautions}
                  onChange={(e) => set("precautions", e.target.value)}
                />
              </Field>

              <Field label="Dosis por defecto">
                <DoseEditor value={dose} onChange={(change) => setDose((d) => ({ ...d, ...change }))} />
                <p className="text-xs text-muted-foreground">La que se propone al añadirlo. Se ajusta en cada paciente.</p>
              </Field>

              {exercise && <ImageField exercise={exercise} />}
            </div>
          )}

          <DialogFooter className="gap-2">
            {exercise && !readOnly && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-muted-foreground hover:text-destructive sm:mr-auto"
                disabled={pending}
                onClick={() => setConfirmArchive(true)}
              >
                <Archive /> Archivar
              </Button>
            )}
            <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={onClose}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {readOnly ? (
              <Button type="button" className="rounded-full" disabled={pending} onClick={duplicateIt}>
                {duplicate.isPending ? <Loader2 className="animate-spin" /> : <Copy />}
                Duplicar y editar
              </Button>
            ) : (
              <Button type="submit" className="rounded-full" disabled={!valid || pending}>
                {pending && <Loader2 className="animate-spin" />}
                {exercise ? "Guardar" : "Añadir al banco"}
              </Button>
            )}
          </DialogFooter>
        </form>
        {confirmArchive && (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <span>
              «{exercise!.name}» saldrá del banco y de las tablas que lo usan. Los pacientes que ya lo tienen pautado lo
              seguirán viendo.
            </span>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setConfirmArchive(false)}>
                No, mantenerlo
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full"
                disabled={archive.isPending}
                onClick={() =>
                  archive.mutate(exercise!.id, {
                    onSuccess: () => {
                      toast.success("Ejercicio archivado");
                      onClose();
                    },
                    onError: (error) => toast.error("No se pudo archivar", { description: error.message }),
                  })
                }
              >
                {archive.isPending && <Loader2 className="animate-spin" />} Archivar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReadOnlyView({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap gap-1.5">
        {exercise.bodyRegions.map((r) => (
          <Badge key={r} variant="outline">
            {bodyRegionLabels[r]}
          </Badge>
        ))}
        <Badge variant="outline">{exerciseTypeLabels[exercise.type]}</Badge>
        {exercise.equipment.map((e) => (
          <Badge key={e} variant="outline">
            {equipmentLabels[e]}
          </Badge>
        ))}
      </div>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5">
        {exercise.instructions.split("\n").filter(Boolean).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      {exercise.precautions && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-800 dark:text-amber-300">
          {exercise.precautions}
        </p>
      )}
      <p className="text-muted-foreground">
        Dosis por defecto:{" "}
        {doseText({
          sets: exercise.defaultSets,
          reps: exercise.defaultReps,
          seconds: exercise.defaultSeconds,
          restSeconds: exercise.defaultRestSeconds,
          perSide: exercise.perSide,
        }) || "sin indicar"}
      </p>
    </div>
  );
}

function ImageField({ exercise }: { exercise: Exercise }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadExerciseImage();
  const remove = useDeleteExerciseImage();
  const [busy, setBusy] = useState(false);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const image = await compressImage(file);
      await upload.mutateAsync({ id: exercise.id, image });
      toast.success("Imagen guardada");
    } catch (error) {
      toast.error("No se pudo subir la imagen", { description: (error as Error).message });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <Field label="Imagen">
      <div className="flex items-center gap-3">
        <ExerciseThumb exercise={exercise} className="size-20 shrink-0" />
        <div className="flex flex-col items-start gap-1.5">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {exercise.hasImage ? "Cambiar imagen" : "Añadir imagen"}
          </Button>
          {exercise.hasImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(exercise.id, {
                  onSuccess: () => toast.success("Imagen quitada"),
                  onError: (error) => toast.error("No se pudo quitar la imagen", { description: error.message }),
                })
              }
            >
              <Trash2 /> Quitar
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            Una foto o dibujo del ejercicio. Que no se vea la cara de nadie sin su permiso.
          </span>
        </div>
      </div>
    </Field>
  );
}

function Chips<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: [T, string][];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected.includes(key)}
          onClick={() => onToggle(key)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            selected.includes(key)
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {id ? <Label htmlFor={id}>{label}</Label> : <span className="text-sm font-medium">{label}</span>}
      {children}
    </div>
  );
}

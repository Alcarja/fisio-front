import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ExerciseTemplate } from "@/adapters/api";
import { useCreateTemplate, useExercises, useMe, useUpdateTemplate } from "@/adapters/hook";
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
import { fromEditorItem, toEditorItem, type EditorItem } from "../editorItems";
import ExerciseBuilder from "./ExerciseBuilder";

// Create or edit a tabla: a reusable list of exercises with their doses
export default function TemplateDialog({ template, onClose }: { template?: ExerciseTemplate; onClose: () => void }) {
  const { data: me } = useMe();
  const { data: exercises = [] } = useExercises(me?.activeClinic?.clinicId);
  const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? "Ejercicio";

  const [name, setName] = useState(template?.name ?? "");
  const [frequency, setFrequency] = useState(template?.frequency ?? "1 vez al día, 5 días a la semana");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [items, setItems] = useState<EditorItem[]>(
    () => template?.items.map((i) => toEditorItem(i, nameOf(i.exerciseId))) ?? [],
  );

  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const pending = create.isPending || update.isPending;
  const valid = !!name.trim() && items.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    const data = {
      name: name.trim(),
      frequency: frequency.trim() || null,
      notes: notes.trim() || null,
      items: items.map(fromEditorItem),
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(template ? "Tabla guardada" : "Tabla creada");
        onClose();
      },
      onError: (error: Error) => toast.error("No se pudo guardar la tabla", { description: error.message }),
    };
    if (template) update.mutate({ id: template.id, data }, callbacks);
    else create.mutate(data, callbacks);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="flex max-h-[92svh] flex-col overflow-y-auto sm:max-w-5xl md:h-[88svh] md:overflow-hidden">
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5 md:min-h-0 md:flex-1">
          <DialogHeader>
            <DialogTitle>{template ? "Editar tabla" : "Nueva tabla"}</DialogTitle>
            <DialogDescription>
              Pulsa los ejercicios del banco para añadirlos. Después podrás pautar la tabla a cualquier paciente y
              ajustarla a su caso.
            </DialogDescription>
          </DialogHeader>

          <ExerciseBuilder
            items={items}
            onChange={setItems}
            top={
              <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tpl-name">Nombre de la tabla</Label>
                  <Input id="tpl-name" required autoFocus maxLength={120} placeholder="Lumbar fase 1" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tpl-frequency">Frecuencia</Label>
                  <Input id="tpl-frequency" maxLength={200} value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                </div>
              </div>
            }
            bottom={
              <div className="flex flex-col gap-2">
                <Label htmlFor="tpl-notes">Indicaciones generales (opcional)</Label>
                <Textarea
                  id="tpl-notes"
                  rows={2}
                  maxLength={1000}
                  placeholder="Calienta 5 minutos antes. Si algún ejercicio te duele más de 4 sobre 10, sáltatelo."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            }
          />

          <DialogFooter className="items-center gap-2">
            {!valid && (
              <span className="text-xs text-muted-foreground sm:mr-auto">
                {!name.trim() ? "Ponle un nombre a la tabla." : "Añade al menos un ejercicio."}
              </span>
            )}
            <Button type="button" variant="outline" className="rounded-full" disabled={pending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full" disabled={!valid || pending}>
              {pending && <Loader2 className="animate-spin" />}
              {template ? "Guardar tabla" : "Crear tabla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

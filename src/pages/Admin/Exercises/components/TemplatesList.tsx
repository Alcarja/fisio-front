import { useState } from "react";
import { CircleAlert, ClipboardList, Loader2, MoreHorizontal, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ExerciseTemplate } from "@/adapters/api";
import { useDeleteTemplate, useExercises, useExerciseTemplates, useMe } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doseText } from "../exerciseFormat";
import AssignTemplateDialog from "./AssignTemplateDialog";
import ExerciseThumb from "./ExerciseThumb";
import TemplateDialog from "./TemplateDialog";

// The clinic's tablas: create them once, give them to any patient
export default function TemplatesList() {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const { data: templates, isPending, error } = useExerciseTemplates(clinicId);
  const { data: exercises = [] } = useExercises(clinicId);
  const [open, setOpen] = useState<ExerciseTemplate | "new" | null>(null);
  const [assigning, setAssigning] = useState<ExerciseTemplate | null>(null);
  const [deleting, setDeleting] = useState<ExerciseTemplate | null>(null);
  const remove = useDeleteTemplate();
  const byId = new Map(exercises.map((e) => [e.id, e]));

  if (isPending) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          Las combinaciones de ejercicios que más pautas: «Hombro fase 1», «Escuela de espalda»… Créalas una vez y
          páutalas a cualquier paciente en un clic.
        </p>
        <Button className="w-fit shrink-0 rounded-full" onClick={() => setOpen("new")}>
          <Plus /> Nueva tabla
        </Button>
      </div>

      {templates.length === 0 ? (
        <button
          type="button"
          onClick={() => setOpen("new")}
          className="flex flex-col items-center gap-2 rounded-[1.75rem] border border-dashed bg-card p-10 text-center text-sm text-muted-foreground transition-colors hover:border-primary"
        >
          <ClipboardList className="size-6 text-primary" />
          <span className="font-medium text-foreground">Crea tu primera tabla</span>
          Elige ejercicios del banco, ajusta series y repeticiones, y guárdala con un nombre.
        </button>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5">
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => setOpen(t)} className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="font-medium hover:underline">{t.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.items.length} {t.items.length === 1 ? "ejercicio" : "ejercicios"}
                    {t.frequency && ` · ${t.frequency}`}
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label={`Opciones de ${t.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setOpen(t)}>
                      <Pencil /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(t)}>
                      <Trash2 /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ol className="flex flex-col gap-2">
                {t.items.map((i, index) => {
                  const e = byId.get(i.exerciseId);
                  return (
                    <li key={i.id} className="flex items-center gap-3 text-sm">
                      {e ? (
                        <ExerciseThumb exercise={e} className="size-9 shrink-0" />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs">{index + 1}</span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{e?.name ?? "Ejercicio archivado"}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{doseText(i, false)}</span>
                    </li>
                  );
                })}
              </ol>
              <Button variant="outline" className="mt-auto w-fit rounded-full" onClick={() => setAssigning(t)}>
                <Send /> Pautar a un paciente
              </Button>
            </li>
          ))}
        </ul>
      )}

      {open && <TemplateDialog template={open === "new" ? undefined : open} onClose={() => setOpen(null)} />}
      {assigning && <AssignTemplateDialog template={assigning} onClose={() => setAssigning(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar esta tabla?"
        description={`«${deleting?.name}» dejará de estar disponible. Los pacientes que ya tienen estos ejercicios pautados no pierden nada.`}
        confirmLabel="Eliminar tabla"
        onConfirm={() =>
          remove.mutate(deleting!.id, {
            onSuccess: () => {
              toast.success("Tabla eliminada");
              setDeleting(null);
            },
            onError: (err) => toast.error("No se pudo eliminar", { description: err.message }),
          })
        }
        pending={remove.isPending}
      />
    </div>
  );
}

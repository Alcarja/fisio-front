import { useState } from "react";
import { ChevronDown, Dumbbell, Layers, Pencil, QrCode, Square } from "lucide-react";
import { toast } from "sonner";
import { getProgramItemImage, type ExerciseProgram } from "@/adapters/api";
import { useFinishProgram } from "@/adapters/hook";
import AuthImage from "@/components/AuthImage";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { doseText } from "../../Exercises/exerciseFormat";
import { formatDate } from "../clinicalFormat";
import ProgramDialog from "./ProgramDialog";
import ShareProgramDialog from "./ShareProgramDialog";

type Props = {
  patientId: string;
  caseId: string;
  caseOpen: boolean;
  // This expediente's programs, newest first
  programs: ExerciseProgram[];
};

// Ejercicios para casa inside an expediente: the active program (to show the
// patient, edit, start a new phase or finish) and the earlier ones
export default function ProgramSection({ patientId, caseId, caseOpen, programs }: Props) {
  const active = programs.find((p) => p.status === "active");
  const finished = programs.filter((p) => p.status === "finished");
  const [dialog, setDialog] = useState<"new" | "edit" | "phase" | "share" | "finish" | null>(null);
  const [showFinished, setShowFinished] = useState(false);
  const finish = useFinishProgram();

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Ejercicios para casa</h4>

      {active ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-secondary/30 p-3">
          {!caseOpen && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              El expediente está cerrado, pero el paciente sigue viendo estos ejercicios. Finalízalos si ya no debe
              hacerlos.
            </p>
          )}
          <ProgramItems patientId={patientId} program={active} />
          {active.frequency && <p className="text-xs text-muted-foreground">{active.frequency}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full" onClick={() => setDialog("share")}>
              <QrCode /> Enseñar al paciente
            </Button>
            {caseOpen && (
              <>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDialog("edit")}>
                  <Pencil /> Editar
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDialog("phase")}>
                  <Layers /> Nueva fase
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="rounded-full text-muted-foreground" onClick={() => setDialog("finish")}>
              <Square /> Finalizar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Desde el {formatDate(active.startDate)}
            {active.createdByName && ` · ${active.createdByName}`}
          </p>
        </div>
      ) : caseOpen ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
          <Dumbbell className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            Sin ejercicios para casa. Páutaselos desde una de tus tablas o eligiéndolos del banco: los verá en su móvil.
          </p>
          <Button size="sm" className="shrink-0 rounded-full" onClick={() => setDialog("new")}>
            Pautar ejercicios
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin ejercicios activos.</p>
      )}

      {finished.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowFinished((s) => !s)}
            className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", showFinished && "rotate-180")} />
            {finished.length === 1 ? "1 fase anterior" : `${finished.length} fases anteriores`}
          </button>
          {showFinished &&
            finished.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 rounded-xl border p-3 opacity-80">
                <span className="text-xs text-muted-foreground">
                  {formatDate(p.startDate)} – {p.finishedAt ? formatDate(p.finishedAt.slice(0, 10)) : ""}
                </span>
                <ProgramItems patientId={patientId} program={p} />
              </div>
            ))}
        </div>
      )}

      {(dialog === "new" || dialog === "edit" || dialog === "phase") && (
        <ProgramDialog patientId={patientId} caseId={caseId} mode={dialog} current={active} onClose={() => setDialog(null)} />
      )}
      {dialog === "share" && active?.accessToken && (
        <ShareProgramDialog token={active.accessToken} onClose={() => setDialog(null)} />
      )}
      <ConfirmDialog
        open={dialog === "finish"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="¿Finalizar estos ejercicios?"
        description="El enlace del paciente dejará de funcionar. Los ejercicios quedan en el expediente."
        confirmLabel="Finalizar"
        destructive={false}
        onConfirm={() =>
          finish.mutate(
            { patientId, programId: active!.id },
            {
              onSuccess: () => {
                toast.success("Ejercicios finalizados");
                setDialog(null);
              },
              onError: (error) => toast.error("No se pudieron finalizar", { description: error.message }),
            },
          )
        }
        pending={finish.isPending}
      />
    </div>
  );
}

function ProgramItems({ patientId, program }: { patientId: string; program: ExerciseProgram }) {
  return (
    <ol className="flex flex-col gap-2">
      {program.items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 text-sm">
          {item.hasImage && item.imageVersion ? (
            <AuthImage
              load={() => getProgramItemImage(patientId, program.id, item.id, item.imageVersion!)}
              version={item.imageVersion}
              alt={item.name}
              className="size-10 shrink-0 rounded-lg"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-medium tabular-nums text-muted-foreground">
              {index + 1}
            </span>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{item.name}</span>
            <span className="text-xs text-muted-foreground">
              {doseText(item, false)}
              {item.notes && ` · ${item.notes}`}
            </span>
            {item.videoUrl && (
              <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Vídeo de YouTube
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

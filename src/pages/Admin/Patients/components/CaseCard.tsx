import { useState, type ReactNode } from "react";
import { ChevronDown, FolderCheck, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CaseNote, PatientCase, PatientClinical } from "@/adapters/api";
import {
  useCreateCaseNote,
  useDeleteCase,
  useDeleteCaseNote,
  useUpdateCase,
  useUpdateCaseNote,
} from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  closeOutcomeLabels,
  formatDate,
  painClass,
  painTrend,
  regionAndSide,
} from "../clinicalFormat";
import CaseDialog from "./CaseDialog";
import CloseCaseDialog from "./CloseCaseDialog";
import NoteForm from "./NoteForm";

type Props = {
  patientId: string;
  patientCase: PatientCase;
  professionals: PatientClinical["professionals"];
  // The logged-in user, and whether they can change other people's notes
  // (owners and admins)
  myUserId: string | undefined;
  canManage: boolean;
  defaultExpanded?: boolean;
};

// One expediente: a summary line that opens to show the assessment, the
// evolution notes (with a form to add today's) and the actions: edit, close,
// reopen, and delete while it has no notes
export default function CaseCard({
  patientId,
  patientCase: c,
  professionals,
  myUserId,
  canManage,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dialog, setDialog] = useState<"edit" | "close" | "reopen" | "delete" | null>(null);
  const ref = { patientId, caseId: c.id };
  const isOpen = c.status === "open";

  const update = useUpdateCase();
  const remove = useDeleteCase();
  const addNote = useCreateCaseNote();

  const pain = painTrend(c.notes);
  const sessions = c.notes.length;

  const reopen = () =>
    update.mutate(
      { ...ref, changes: { status: "open" } },
      {
        onSuccess: () => {
          toast.success("Expediente reabierto");
          setDialog(null);
        },
        onError: (error) => {
          toast.error("No se pudo reabrir el expediente", { description: error.message });
          setDialog(null);
        },
      },
    );

  const deleteIt = () =>
    remove.mutate(ref, {
      onSuccess: () => toast.success("Expediente eliminado"),
      onError: (error) => {
        toast.error("No se pudo eliminar el expediente", { description: error.message });
        setDialog(null);
      },
    });

  return (
    <article className={cn("rounded-2xl border", !isOpen && "bg-muted/30")}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{c.title}</span>
            <Badge variant="outline">{regionAndSide(c)}</Badge>
            {!isOpen && c.closeOutcome && (
              <Badge variant="secondary">{closeOutcomeLabels[c.closeOutcome]}</Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {isOpen
              ? `Abierto el ${formatDate(c.openedAt)}`
              : `${formatDate(c.openedAt)} – ${c.closedAt ? formatDate(c.closedAt) : ""}`}
            {" · "}
            {sessions === 1 ? "1 nota" : `${sessions} notas`}
            {c.physio && ` · ${c.physio.name}`}
          </span>
        </div>
        {pain && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Dolor</span>
            {pain.changed && (
              <>
                <PainBadge level={pain.first} />→
              </>
            )}
            <PainBadge level={pain.latest} />
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-5 border-t px-4 py-4">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Info label="Motivo de consulta" wide>
              {c.reason}
            </Info>
            <Info label="Valoración y diagnóstico" wide>
              {c.diagnosis}
            </Info>
            <Info label="Objetivos y plan" wide>
              {c.plan}
            </Info>
            <Info label="Inicio de la lesión">{c.onsetDate && formatDate(c.onsetDate)}</Info>
            <Info label="Fisio responsable">{c.physio?.name}</Info>
            {!isOpen && (
              <Info label="Cierre" wide>
                {c.closedAt && formatDate(c.closedAt)}
                {c.closeOutcome && ` · ${closeOutcomeLabels[c.closeOutcome]}`}
                {c.closeNotes && `\n${c.closeNotes}`}
              </Info>
            )}
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setDialog("edit")}
            >
              <Pencil /> Editar
            </Button>
            {isOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setDialog("close")}
              >
                <FolderCheck /> Cerrar expediente
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setDialog("reopen")}
              >
                <RotateCcw /> Reabrir
              </Button>
            )}
            {/* With notes it's clinical history: it can only be closed */}
            {sessions === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => setDialog("delete")}
              >
                <Trash2 /> Eliminar
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Evolución
            </h4>
            {isOpen && (
              // key: a fresh, empty form after each note is saved
              <NoteForm
                key={sessions}
                minDate={c.openedAt}
                submitLabel="Añadir nota"
                pending={addNote.isPending}
                onSubmit={(data) =>
                  addNote.mutate(
                    { ...ref, data },
                    {
                      onSuccess: () => toast.success("Nota añadida"),
                      onError: (error) =>
                        toast.error("No se pudo añadir la nota", { description: error.message }),
                    },
                  )
                }
              />
            )}
            {sessions === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isOpen ? "Todavía no hay notas. Añade la de la primera sesión." : "Sin notas."}
              </p>
            ) : (
              <ol className="flex flex-col">
                {c.notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    caseRef={ref}
                    note={note}
                    minDate={c.openedAt}
                    canChange={isOpen && (canManage || note.author?.userId === myUserId)}
                  />
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {dialog === "edit" && (
        <CaseDialog
          patientId={patientId}
          patientCase={c}
          professionals={professionals}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "close" && (
        <CloseCaseDialog patientId={patientId} patientCase={c} onClose={() => setDialog(null)} />
      )}
      <ConfirmDialog
        open={dialog === "reopen"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="¿Reabrir este expediente?"
        description="Volverá a estar abierto para añadir notas. Se borran la fecha y el resultado del cierre."
        confirmLabel="Reabrir"
        destructive={false}
        onConfirm={reopen}
        pending={update.isPending}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="¿Eliminar este expediente?"
        description={`«${c.title}» no tiene notas de evolución. No se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={deleteIt}
        pending={remove.isPending}
      />
    </article>
  );
}

function PainBadge({ level }: { level: number }) {
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums",
        painClass(level),
      )}
    >
      {level}
    </span>
  );
}

// One evolution note in the timeline. Its author (or an owner or admin) can
// correct or delete it while the expediente is open
function NoteItem({
  caseRef,
  note,
  minDate,
  canChange,
}: {
  caseRef: { patientId: string; caseId: string };
  note: CaseNote;
  minDate: string;
  canChange: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdateCaseNote();
  const remove = useDeleteCaseNote();
  const ref = { ...caseRef, noteId: note.id };

  return (
    <li className="relative flex flex-col gap-1.5 border-l py-2 pl-4 before:absolute before:top-3.5 before:-left-[4.5px] before:size-2 before:rounded-full before:bg-border">
      {editing ? (
        <NoteForm
          initial={note}
          minDate={minDate}
          submitLabel="Guardar"
          pending={update.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(changes) =>
            update.mutate(
              { ...ref, changes },
              {
                onSuccess: () => {
                  toast.success("Nota guardada");
                  setEditing(false);
                },
                onError: (error) =>
                  toast.error("No se pudo guardar la nota", { description: error.message }),
              },
            )
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{formatDate(note.date)}</span>
            {note.author && <span>· {note.author.name}</span>}
            {note.edited && <span>· editada</span>}
            {note.painLevel !== null && (
              <span className="flex items-center gap-1">
                · Dolor <PainBadge level={note.painLevel} />
              </span>
            )}
            {canChange && (
              <span className="ml-auto flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 rounded-full"
                  onClick={() => setEditing(true)}
                  aria-label="Editar nota"
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 rounded-full hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Eliminar nota"
                >
                  <Trash2 className="size-3" />
                </Button>
              </span>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{note.text}</p>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar esta nota?"
        description={`La nota del ${formatDate(note.date)} se borrará del expediente. No se puede deshacer.`}
        confirmLabel="Eliminar nota"
        onConfirm={() =>
          remove.mutate(ref, {
            onSuccess: () => toast.success("Nota eliminada"),
            onError: (error) => {
              toast.error("No se pudo eliminar la nota", { description: error.message });
              setConfirmDelete(false);
            },
          })
        }
        pending={remove.isPending}
      />
    </li>
  );
}

// One field of the assessment; hidden while it's empty
function Info({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", wide && "sm:col-span-2")}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CloseOutcome, PatientCase } from "@/adapters/api";
import { useUpdateCase } from "@/adapters/hook";
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
import { closeOutcomeLabels, todayIso } from "../clinicalFormat";

type Props = {
  patientId: string;
  patientCase: PatientCase;
  onClose: () => void;
};

// Close an expediente (alta): how it ended, when, and a comment.
// It can be reopened later if the injury comes back
export default function CloseCaseDialog({ patientId, patientCase, onClose }: Props) {
  const [outcome, setOutcome] = useState<CloseOutcome | "">("");
  const [closedAt, setClosedAt] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const update = useUpdateCase();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!outcome) return;
    update.mutate(
      {
        patientId,
        caseId: patientCase.id,
        changes: {
          status: "closed",
          closeOutcome: outcome,
          closedAt,
          closeNotes: notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Expediente cerrado");
          onClose();
        },
        onError: (error) =>
          toast.error("No se pudo cerrar el expediente", { description: error.message }),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !update.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Cerrar expediente</DialogTitle>
            <DialogDescription>
              «{patientCase.title}» pasará a cerrados con toda su evolución. Se puede reabrir si
              el paciente recae.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[1fr_9.5rem] gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="close-outcome">Resultado</Label>
                <NativeSelect
                  id="close-outcome"
                  required
                  className="w-full"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as CloseOutcome)}
                >
                  <NativeSelectOption value="" disabled>
                    Elige
                  </NativeSelectOption>
                  {Object.entries(closeOutcomeLabels).map(([key, label]) => (
                    <NativeSelectOption key={key} value={key}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="close-date">Fecha</Label>
                <Input
                  id="close-date"
                  type="date"
                  required
                  min={patientCase.openedAt}
                  max={todayIso()}
                  value={closedAt}
                  onChange={(e) => setClosedAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="close-notes">
                Comentario <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="close-notes"
                rows={3}
                maxLength={2000}
                placeholder="Estado al alta, recomendaciones…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={update.isPending}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full" disabled={!outcome || update.isPending}>
              {update.isPending && <Loader2 className="animate-spin" />}
              Cerrar expediente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

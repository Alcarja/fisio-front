import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicalBackground } from "@/adapters/api";
import { useUpdateClinicalBackground } from "@/adapters/hook";
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
import { backgroundFields } from "../clinicalFormat";

type Props = {
  patientId: string;
  background: ClinicalBackground;
  onClose: () => void;
};

// Edit the patient's antecedentes: health data shared by all their expedientes
export default function BackgroundDialog({ patientId, background, onClose }: Props) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(backgroundFields.map((f) => [f.key, background[f.key] ?? ""])) as Record<
      keyof ClinicalBackground,
      string
    >,
  );
  const update = useUpdateClinicalBackground();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const changes = Object.fromEntries(
      backgroundFields.map((f) => [f.key, form[f.key].trim() || null]),
    ) as ClinicalBackground;
    update.mutate(
      { patientId, changes },
      {
        onSuccess: () => {
          toast.success("Antecedentes guardados");
          onClose();
        },
        onError: (error) =>
          toast.error("No se pudieron guardar los antecedentes", { description: error.message }),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !update.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Antecedentes</DialogTitle>
            <DialogDescription>
              Datos de salud del paciente que valen para todos sus expedientes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            {backgroundFields.map((f) => {
              const props = {
                id: `background-${f.key}`,
                maxLength: f.maxLength,
                placeholder: f.placeholder,
                value: form[f.key],
                onChange: (e: { target: { value: string } }) =>
                  setForm((current) => ({ ...current, [f.key]: e.target.value })),
              };
              return (
                <div key={f.key} className="flex flex-col gap-2">
                  <Label htmlFor={props.id}>{f.label}</Label>
                  {f.long ? <Textarea rows={4} {...props} /> : <Input {...props} />}
                </div>
              );
            })}
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
            <Button type="submit" className="rounded-full" disabled={update.isPending}>
              {update.isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

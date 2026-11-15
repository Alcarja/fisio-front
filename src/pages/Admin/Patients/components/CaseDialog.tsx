import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BodyRegion, CaseInput, CaseSide, PatientCase, PatientClinical } from "@/adapters/api";
import { useCreateCase, useMe, useUpdateCase } from "@/adapters/hook";
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
import { bodyRegionLabels, sideLabels, todayIso } from "../clinicalFormat";

type Props = {
  patientId: string;
  // Leave out to open a new expediente
  patientCase?: PatientCase;
  professionals: PatientClinical["professionals"];
  onClose: () => void;
};

// Open a new expediente or edit one. Mount it to open it, unmount it to close it
export default function CaseDialog({ patientId, patientCase, professionals, onClose }: Props) {
  const isEdit = !!patientCase;
  const { data: me } = useMe();
  const myId = me?.user.id;

  const [form, setForm] = useState(() => ({
    title: patientCase?.title ?? "",
    bodyRegion: patientCase?.bodyRegion ?? ("" as BodyRegion | ""),
    side: patientCase?.side ?? ("" as CaseSide | ""),
    // New: whoever opens it, if they attend patients
    physioId: patientCase
      ? (patientCase.physio?.userId ?? "")
      : professionals.some((p) => p.userId === myId)
        ? myId!
        : "",
    reason: patientCase?.reason ?? "",
    diagnosis: patientCase?.diagnosis ?? "",
    plan: patientCase?.plan ?? "",
    onsetDate: patientCase?.onsetDate ?? "",
    openedAt: patientCase?.openedAt ?? todayIso(),
  }));
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const create = useCreateCase();
  const update = useUpdateCase();
  const pending = create.isPending || update.isPending;
  const valid = !!form.title.trim() && !!form.bodyRegion && !!form.openedAt;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || !form.bodyRegion) return;
    const optional = (value: string) => value.trim() || null;
    const data: CaseInput = {
      title: form.title.trim(),
      bodyRegion: form.bodyRegion,
      side: form.side || null,
      physioId: form.physioId || null,
      reason: optional(form.reason),
      diagnosis: optional(form.diagnosis),
      plan: optional(form.plan),
      onsetDate: form.onsetDate || null,
      openedAt: form.openedAt,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? "Expediente guardado" : "Expediente abierto");
        onClose();
      },
      onError: (error: Error) =>
        toast.error(isEdit ? "No se pudo guardar el expediente" : "No se pudo abrir el expediente", {
          description: error.message,
        }),
    };
    if (isEdit) update.mutate({ patientId, caseId: patientCase.id, changes: data }, callbacks);
    else create.mutate({ patientId, data }, callbacks);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar expediente" : "Abrir expediente"}</DialogTitle>
            <DialogDescription>
              Un expediente por lesión o motivo de consulta. Puede haber varios abiertos a la vez.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <Field id="case-title" label="Título">
              <Input
                id="case-title"
                required
                autoFocus
                maxLength={150}
                placeholder="Tendinopatía del supraespinoso"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="case-region" label="Zona">
                <NativeSelect
                  id="case-region"
                  required
                  className="w-full"
                  value={form.bodyRegion}
                  onChange={(e) => set("bodyRegion", e.target.value as BodyRegion)}
                >
                  <NativeSelectOption value="" disabled>
                    Elige
                  </NativeSelectOption>
                  {Object.entries(bodyRegionLabels).map(([key, label]) => (
                    <NativeSelectOption key={key} value={key}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field id="case-side" label="Lado">
                <NativeSelect
                  id="case-side"
                  className="w-full"
                  value={form.side}
                  onChange={(e) => set("side", e.target.value as CaseSide | "")}
                >
                  <NativeSelectOption value="">No aplica</NativeSelectOption>
                  {Object.entries(sideLabels).map(([key, label]) => (
                    <NativeSelectOption key={key} value={key}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <Field id="case-reason" label="Motivo de consulta" optional>
              <Textarea
                id="case-reason"
                rows={2}
                maxLength={2000}
                placeholder="Qué le pasa y cómo empezó, en palabras del paciente"
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
              />
            </Field>

            <Field id="case-diagnosis" label="Valoración y diagnóstico" optional>
              <Textarea
                id="case-diagnosis"
                rows={2}
                maxLength={2000}
                value={form.diagnosis}
                onChange={(e) => set("diagnosis", e.target.value)}
              />
            </Field>

            <Field id="case-plan" label="Objetivos y plan de tratamiento" optional>
              <Textarea
                id="case-plan"
                rows={2}
                maxLength={4000}
                value={form.plan}
                onChange={(e) => set("plan", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="case-onset" label="Inicio de la lesión" optional>
                <Input
                  id="case-onset"
                  type="date"
                  max={todayIso()}
                  value={form.onsetDate}
                  onChange={(e) => set("onsetDate", e.target.value)}
                />
              </Field>
              <Field id="case-opened" label="Apertura">
                <Input
                  id="case-opened"
                  type="date"
                  required
                  max={todayIso()}
                  value={form.openedAt}
                  onChange={(e) => set("openedAt", e.target.value)}
                />
              </Field>
            </div>

            <Field id="case-physio" label="Fisio responsable">
              <NativeSelect
                id="case-physio"
                className="w-full"
                value={form.physioId}
                onChange={(e) => set("physioId", e.target.value)}
              >
                <NativeSelectOption value="">Sin asignar</NativeSelectOption>
                {professionals.map((p) => (
                  <NativeSelectOption key={p.userId} value={p.userId}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full" disabled={!valid || pending}>
              {pending && <Loader2 className="animate-spin" />}
              {isEdit ? "Guardar" : "Abrir expediente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
    </div>
  );
}

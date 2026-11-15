import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Patient, PatientInput } from "@/adapters/api";
import { useCreatePatient, useUpdatePatient } from "@/adapters/hook";
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

type Props = {
  // Leave out to create a new patient
  patient?: Patient;
  onClose: () => void;
  // After creating: e.g. to open the new ficha
  onCreated?: (patient: Patient) => void;
};

const toForm = (p?: Patient) => ({
  firstName: p?.firstName ?? "",
  lastName: p?.lastName ?? "",
  phone: p?.phone ?? "",
  email: p?.email ?? "",
  nif: p?.nif ?? "",
  birthDate: p?.birthDate ?? "",
  address: p?.address ?? "",
  postalCode: p?.postalCode ?? "",
  city: p?.city ?? "",
  notes: p?.notes ?? "",
});

type Form = ReturnType<typeof toForm>;

const today = () => new Date().toLocaleDateString("sv-SE"); // "2026-11-16"

// Create or edit a patient's ficha. Mount it to open it (it starts from the
// patient's current data), unmount it to close it
export default function PatientDialog({ patient, onClose, onCreated }: Props) {
  const isEdit = !!patient;
  const [form, setForm] = useState<Form>(() => toForm(patient));
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const pending = create.isPending || update.isPending;

  const set = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Empty optional fields are saved as null
    const optional = (value: string) => value.trim() || null;
    const data: PatientInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: optional(form.phone),
      email: optional(form.email),
      nif: optional(form.nif),
      birthDate: form.birthDate || null,
      address: optional(form.address),
      postalCode: optional(form.postalCode),
      city: optional(form.city),
      notes: optional(form.notes),
    };
    const onError = (error: Error) =>
      toast.error(isEdit ? "No se pudo guardar la ficha" : "No se pudo crear el paciente", {
        description: error.message,
      });

    if (isEdit) {
      update.mutate(
        { patientId: patient.id, changes: data },
        {
          onSuccess: () => {
            toast.success("Ficha guardada");
            onClose();
          },
          onError,
        },
      );
    } else {
      create.mutate(data, {
        onSuccess: (created) => {
          toast.success("Paciente creado");
          onClose();
          onCreated?.(created);
        },
        onError,
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar ficha" : "Nuevo paciente"}</DialogTitle>
            <DialogDescription>
              Solo el nombre y los apellidos son obligatorios. El resto se puede completar
              después.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <Field id="patient-first-name" label="Nombre">
                <Input
                  id="patient-first-name"
                  required
                  autoFocus
                  maxLength={100}
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field id="patient-last-name" label="Apellidos">
                <Input
                  id="patient-last-name"
                  required
                  maxLength={100}
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field id="patient-phone" label="Teléfono" optional>
                <Input
                  id="patient-phone"
                  type="tel"
                  maxLength={30}
                  placeholder="600 11 22 33"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <Field id="patient-email" label="Email" optional>
                <Input
                  id="patient-email"
                  type="email"
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field id="patient-nif" label="NIF / NIE" optional>
                <Input
                  id="patient-nif"
                  maxLength={20}
                  value={form.nif}
                  onChange={(e) => set("nif", e.target.value)}
                />
              </Field>
              <Field id="patient-birth-date" label="Nacimiento" optional>
                <Input
                  id="patient-birth-date"
                  type="date"
                  max={today()}
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                />
              </Field>
            </div>

            <Field id="patient-address" label="Dirección" optional>
              <Input
                id="patient-address"
                maxLength={200}
                placeholder="Calle, número, piso"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-[8rem_1fr] gap-3">
              <Field id="patient-postal-code" label="Código postal" optional>
                <Input
                  id="patient-postal-code"
                  maxLength={12}
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                />
              </Field>
              <Field id="patient-city" label="Localidad" optional>
                <Input
                  id="patient-city"
                  maxLength={100}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
            </div>

            <Field id="patient-notes" label="Notas internas" optional>
              <Textarea
                id="patient-notes"
                rows={3}
                maxLength={2000}
                placeholder="Administrativas: las ve también recepción"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
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
            <Button
              type="submit"
              className="rounded-full"
              disabled={pending || !form.firstName.trim() || !form.lastName.trim()}
            >
              {pending && <Loader2 className="animate-spin" />}
              {isEdit ? "Guardar" : "Crear paciente"}
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
  children: React.ReactNode;
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

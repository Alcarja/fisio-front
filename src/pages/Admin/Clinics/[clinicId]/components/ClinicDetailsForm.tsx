import { useState, type FormEvent, type ReactNode } from "react";
import { Building2, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Clinic, ClinicUpdate } from "@/adapters/api";
import { useUpdateClinic } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "long",
  timeStyle: "short",
});

// Known values; anything else coming from the API is still shown
const statusOptions = [
  { value: "active", label: "Activa" },
  { value: "inactive", label: "Inactiva" },
];

type FormValues = {
  name: string;
  slug: string;
  logo: string;
  status: string;
  isPublic: boolean;
};

const toFormValues = (clinic: Clinic): FormValues => ({
  name: clinic.name,
  slug: clinic.slug,
  logo: clinic.logo ?? "",
  status: clinic.status ?? "active",
  isPublic: clinic.isPublic ?? false,
});

// Only the fields that actually changed, ready to send in a PUT/PATCH
function getChanges(initial: FormValues, current: FormValues): ClinicUpdate {
  const changes: ClinicUpdate = {};
  if (current.name.trim() !== initial.name) changes.name = current.name.trim();
  if (current.slug !== initial.slug) changes.slug = current.slug;
  if (current.logo.trim() !== initial.logo)
    changes.logo = current.logo.trim() || null;
  if (current.status !== initial.status) changes.status = current.status;
  if (current.isPublic !== initial.isPublic)
    changes.isPublic = current.isPublic;
  return changes;
}

// Same rules as the create form
function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "");
}

type Props = {
  clinic: Clinic;
};

// Editable clinic details. Render with key={clinic.id} so it resets per clinic
export default function ClinicDetailsForm({ clinic }: Props) {
  const initial = toFormValues(clinic);
  const [values, setValues] = useState<FormValues>(initial);
  const updateClinic = useUpdateClinic();

  const changes = getChanges(initial, values);
  const isDirty = Object.keys(changes).length > 0;

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDirty) return;
    updateClinic.mutate(
      { clinicId: clinic.id, changes },
      // Start from what the server saved (e.g. trimmed values).
      // The hook updates the cache, so `clinic` (and `initial`) follow too
      {
        onSuccess: (saved) => {
          setValues(toFormValues(saved));
          toast.success("Cambios guardados", {
            description: `Se ha actualizado ${saved.name}.`,
          });
        },
        // Edits are kept, so the user can fix them and try again
        onError: (error) =>
          toast.error("No se pudieron guardar los cambios", {
            description: error.message,
          }),
      },
    );
  };

  const statusIsKnown = statusOptions.some((o) => o.value === values.status);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section
        title="Información general"
        description="Nombre, dirección y logo de la clínica."
      >
        <Field label="Nombre" htmlFor="clinic-name">
          <Input
            id="clinic-name"
            required
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>

        <Field
          label="URL"
          htmlFor="clinic-slug"
          hint="Identificador único. Cambiarlo puede romper enlaces existentes."
        >
          <div className="flex items-center rounded-md border bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="pl-3 text-sm text-muted-foreground">/</span>
            <Input
              id="clinic-slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Solo minúsculas, números y guiones"
              value={values.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              className="border-0 pl-1 shadow-none focus-visible:ring-0"
            />
          </div>
        </Field>

        <Field
          label="Logo"
          htmlFor="clinic-logo"
          hint="URL de una imagen. Opcional."
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
              {values.logo.trim() ? (
                <img
                  src={values.logo}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-4 text-primary" />
              )}
            </span>
            <Input
              id="clinic-logo"
              type="url"
              placeholder="https://…/logo.png"
              value={values.logo}
              onChange={(e) => set("logo", e.target.value)}
            />
          </div>
        </Field>
      </Section>

      <Section
        title="Estado y visibilidad"
        description="Controla si la clínica está operativa y si aparece públicamente."
      >
        <Field label="Estado" htmlFor="clinic-status">
          <NativeSelect
            id="clinic-status"
            value={values.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full sm:w-56"
          >
            {statusOptions.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
            {!statusIsKnown && (
              <NativeSelectOption value={values.status}>{values.status}</NativeSelectOption>
            )}
          </NativeSelect>
        </Field>

        <div className="flex items-start gap-3 sm:col-start-2">
          <Checkbox
            id="clinic-public"
            checked={values.isPublic}
            onCheckedChange={(checked) => set("isPublic", checked === true)}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="clinic-public">Clínica pública</Label>
            <p className="text-xs text-muted-foreground">
              Los pacientes podrán encontrarla y ver su información.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Datos del sistema"
        description="Generados automáticamente."
      >
        <ReadOnlyField label="ID" value={clinic.id} copyable mono />
        <ReadOnlyField
          label="Fecha de alta"
          value={dateFormat.format(new Date(clinic.createdAt))}
        />
      </Section>

      {/* Save bar: only meaningful once something changed.
          Success and error are shown as toasts */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {isDirty && (
          <span className="text-sm text-muted-foreground sm:mr-auto">
            Tienes cambios sin guardar.
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={!isDirty || updateClinic.isPending}
          onClick={() => setValues(initial)}
        >
          Descartar
        </Button>
        <Button
          type="submit"
          className="rounded-full"
          disabled={!isDirty || updateClinic.isPending}
        >
          {updateClinic.isPending ? (
            <>
              <Loader2 className="animate-spin" /> Guardando…
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}

// Card with a title on the left and fields on the right (stacked on phones)
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  copyable = false,
  mono = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: nothing to do
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate text-sm text-muted-foreground ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copiado" : `Copiar ${label}`}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

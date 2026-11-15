import { useState, type FormEvent, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  downloadClinicDocument,
  type ClinicDocument,
  type ClinicDocumentType,
  type ClinicFeature,
  type ClinicLegal,
} from "@/adapters/api";
import {
  useClinicLegal,
  useDeleteClinicDocument,
  useUpdateClinicLegal,
  useUploadClinicDocument,
} from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  clinicDocumentTypes,
  DOCUMENT_ACCEPT,
  formatFileSize,
  MAX_DOCUMENT_BYTES,
  requiredLegalFields,
} from "@/lib/clinicDocuments";

type Props = {
  clinicId: string;
  // The clinic's optional features: some documents are only needed with one
  features: ClinicFeature[];
};

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });
// "2026-11-16" -> "16 nov 2026"
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFormat.format(new Date(y!, m! - 1, d!));
};

// Superadmin: what Kineflow needs from the clinic, in one place. Its legal
// details (who signs, who to tell about data protection) and its signed
// documents, with what's still missing on top
export default function ClinicDocumentation({ clinicId, features }: Props) {
  const { data, isPending, error } = useClinicLegal(clinicId);

  if (isPending) {
    return (
      <div className="flex justify-center rounded-[1.75rem] border bg-card py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        No se pudo cargar la documentación: {error.message}
      </div>
    );
  }

  const { legal, documents } = data;
  const isRequired = (t: (typeof clinicDocumentTypes)[number]) =>
    t.required || (!!t.requiredWith && features.includes(t.requiredWith));

  const missingFields = requiredLegalFields.filter((f) => !legal[f.key]).map((f) => f.label);
  const missingDocuments = clinicDocumentTypes
    .filter((t) => isRequired(t) && !documents.some((d) => d.type === t.key))
    .map((t) => t.label);
  const complete = missingFields.length === 0 && missingDocuments.length === 0;

  return (
    <>
      <Section
        title="Datos legales"
        description="Quién firma los contratos y a quién avisar en temas de protección de datos."
        aside={
          <div
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
              complete
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            }`}
          >
            {complete ? (
              <>
                <CircleCheck className="mt-0.5 size-3.5 shrink-0" />
                Documentación completa.
              </>
            ) : (
              <>
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Falta: {[...missingFields, ...missingDocuments.map((d) => d.toLowerCase())].join(", ")}.
                </span>
              </>
            )}
          </div>
        }
      >
        {/* key: start from the saved data again after each save */}
        <LegalForm key={JSON.stringify(legal)} clinicId={clinicId} legal={legal} />
      </Section>

      <Section
        title="Documentos"
        description="Los contratos firmados por la clínica. PDF, JPG o PNG, hasta 10 MB."
      >
        <ul className="flex flex-col divide-y">
          {clinicDocumentTypes.map((type) => (
            <DocumentType
              key={type.key}
              clinicId={clinicId}
              type={type}
              required={isRequired(type)}
              documents={documents.filter((d) => d.type === type.key)}
            />
          ))}
        </ul>
      </Section>
    </>
  );
}

// ---------- Datos legales ----------

const legalFields: {
  key: keyof ClinicLegal;
  label: string;
  placeholder?: string;
  wide?: boolean;
  type?: string;
}[] = [
  { key: "legalName", label: "Titular (razón social o autónomo)", wide: true },
  { key: "taxId", label: "NIF" },
  { key: "signerName", label: "Firmante", placeholder: "Quién firma por la clínica" },
  { key: "address", label: "Domicilio", wide: true },
  { key: "postalCode", label: "Código postal" },
  { key: "city", label: "Localidad" },
  { key: "privacyContactName", label: "Contacto de protección de datos" },
  { key: "privacyContactEmail", label: "Email de ese contacto", type: "email" },
  { key: "privacyContactPhone", label: "Teléfono de ese contacto", type: "tel" },
  { key: "dpoContact", label: "Delegado de protección de datos", placeholder: "Si tiene" },
];

function LegalForm({ clinicId, legal }: { clinicId: string; legal: ClinicLegal }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(Object.entries(legal).map(([key, value]) => [key, value ?? ""])) as Record<
      keyof ClinicLegal,
      string
    >,
  );
  const update = useUpdateClinicLegal();
  const set = (key: keyof ClinicLegal, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Only the fields that changed
  const changes = Object.fromEntries(
    (Object.keys(form) as (keyof ClinicLegal)[])
      .filter((key) => form[key].trim() !== (legal[key] ?? ""))
      .map((key) => [key, form[key].trim() || null]),
  ) as Partial<ClinicLegal>;
  const isDirty = Object.keys(changes).length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDirty) return;
    update.mutate(
      { clinicId, changes },
      {
        onSuccess: () => toast.success("Datos legales guardados"),
        onError: (error) =>
          toast.error("No se pudieron guardar los datos legales", { description: error.message }),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-x-3 gap-y-5 sm:grid-cols-2">
        {legalFields.map((f) => (
          <div key={f.key} className={`flex min-w-0 flex-col gap-2 ${f.wide ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={`legal-${f.key}`}>{f.label}</Label>
            <Input
              id={`legal-${f.key}`}
              type={f.type}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="legal-notes">Notas</Label>
          <Textarea
            id="legal-notes"
            rows={2}
            maxLength={2000}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={!isDirty || update.isPending}>
          {update.isPending && <Loader2 className="animate-spin" />}
          Guardar datos legales
        </Button>
      </div>
    </form>
  );
}

// ---------- Documentos ----------

// One kind of document: whether it's there, the files uploaded, and a form to
// add another (e.g. a renewed contract; older ones stay as history)
function DocumentType({
  clinicId,
  type,
  required,
  documents,
}: {
  clinicId: string;
  type: (typeof clinicDocumentTypes)[number];
  required: boolean;
  documents: ClinicDocument[];
}) {
  const [adding, setAdding] = useState(false);
  const done = documents.length > 0;

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        {done ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : required ? (
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : (
          <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">
            {type.label}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {done ? "" : required ? "Pendiente" : "Opcional"}
            </span>
          </span>
          <p className="text-xs text-muted-foreground">{type.description}</p>
        </div>
        {!adding && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => setAdding(true)}
          >
            <Upload /> Subir
          </Button>
        )}
      </div>

      {documents.length > 0 && (
        <ul className="ml-7 flex flex-col gap-1.5">
          {documents.map((d) => (
            <DocumentRow key={d.id} clinicId={clinicId} document={d} />
          ))}
        </ul>
      )}

      {adding && (
        <UploadForm
          clinicId={clinicId}
          type={type.key}
          // "Otros" need a description to tell them apart
          titleRequired={type.key === "other"}
          onDone={() => setAdding(false)}
        />
      )}
    </li>
  );
}

function DocumentRow({ clinicId, document }: { clinicId: string; document: ClinicDocument }) {
  const [opening, setOpening] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useDeleteClinicDocument();
  const ref = { clinicId, documentId: document.id };

  // The file needs the session cookie, so it's fetched and shown from memory.
  // The tab is opened first: browsers block tabs opened after waiting
  const open = async () => {
    const tab = window.open("", "_blank");
    setOpening(true);
    try {
      const url = URL.createObjectURL(await downloadClinicDocument(ref));
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      tab?.close();
      toast.error("No se pudo abrir el documento", { description: (error as Error).message });
    } finally {
      setOpening(false);
    }
  };

  return (
    <li className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
      {opening ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <FileText className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={open}
          disabled={opening}
          className="truncate text-left text-sm underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground"
        >
          {document.title ?? document.fileName}
        </button>
        <span className="truncate text-xs text-muted-foreground">
          {[
            document.signedAt ? `Firmado el ${formatDate(document.signedAt)}` : "Sin fecha de firma",
            formatFileSize(document.fileSize),
            `subido el ${dateFormat.format(new Date(document.createdAt))}`,
            document.uploadedByName && `por ${document.uploadedByName}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
        onClick={() => setConfirmDelete(true)}
        aria-label={`Eliminar ${document.fileName}`}
      >
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar este documento?"
        description={`«${document.title ?? document.fileName}» se borrará de la plataforma. No se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() =>
          remove.mutate(ref, {
            onSuccess: () => toast.success("Documento eliminado"),
            onError: (error) => {
              toast.error("No se pudo eliminar el documento", { description: error.message });
              setConfirmDelete(false);
            },
          })
        }
        pending={remove.isPending}
      />
    </li>
  );
}

function UploadForm({
  clinicId,
  type,
  titleRequired,
  onDone,
}: {
  clinicId: string;
  type: ClinicDocumentType;
  titleRequired: boolean;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [signedAt, setSignedAt] = useState("");
  const [title, setTitle] = useState("");
  // "2026-11-16": a signature can't be in the future
  const [today] = useState(() => new Date().toLocaleDateString("sv-SE"));
  const upload = useUploadClinicDocument();

  const tooBig = !!file && file.size > MAX_DOCUMENT_BYTES;
  const valid = !!file && !tooBig && (!titleRequired || !!title.trim());

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || !file) return;
    upload.mutate(
      { clinicId, file, type, signedAt, title: title.trim() },
      {
        onSuccess: () => {
          toast.success("Documento subido");
          onDone();
        },
        onError: (error) =>
          toast.error("No se pudo subir el documento", { description: error.message }),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="ml-7 flex flex-col gap-3 rounded-xl border p-3">
      <Input
        type="file"
        required
        accept={DOCUMENT_ACCEPT}
        aria-label="Archivo"
        disabled={upload.isPending}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {tooBig && <p className="text-xs text-destructive">El archivo pesa más de 10 MB.</p>}
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`doc-signed-${type}`} className="text-xs">
            Fecha de firma
          </Label>
          <Input
            id={`doc-signed-${type}`}
            type="date"
            max={today}
            value={signedAt}
            disabled={upload.isPending}
            onChange={(e) => setSignedAt(e.target.value)}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`doc-title-${type}`} className="text-xs">
            Descripción{!titleRequired && " (opcional)"}
          </Label>
          <Input
            id={`doc-title-${type}`}
            maxLength={150}
            required={titleRequired}
            placeholder="Versión 2026, renovación…"
            value={title}
            disabled={upload.isPending}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          disabled={upload.isPending}
          onClick={onDone}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" className="rounded-full" disabled={!valid || upload.isPending}>
          {upload.isPending && <Loader2 className="animate-spin" />}
          Subir documento
        </Button>
      </div>
    </form>
  );
}

// Card with a title on the left and content on the right (stacked on phones)
function Section({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {aside}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

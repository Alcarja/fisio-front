import { useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import type { ClinicalLogEntry } from "@/adapters/api";
import { useClinicalLog, useMe } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { backgroundFields } from "../clinicalFormat";

type Props = { patientId: string };

// How many entries show before "Ver todo"
const SHORT_LIST = 8;

const timeFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

const fieldLabels: Record<string, string> = {
  ...Object.fromEntries(backgroundFields.map((f) => [f.key, f.label])),
  title: "Título",
  bodyRegion: "Zona",
  side: "Lado",
  status: "Estado",
  physioId: "Fisio responsable",
  reason: "Motivo de consulta",
  diagnosis: "Valoración y diagnóstico",
  plan: "Objetivos y plan",
  onsetDate: "Inicio de la lesión",
  openedAt: "Apertura",
  closedAt: "Cierre",
  closeOutcome: "Resultado",
  closeNotes: "Comentario de cierre",
  date: "Fecha",
  painLevel: "Dolor",
  text: "Texto",
  frequency: "Frecuencia",
  notes: "Indicaciones",
  items: "Ejercicios",
};
const label = (field: string) => fieldLabels[field] ?? field;

const things: Record<ClinicalLogEntry["entity"], string> = {
  record: "la historia clínica",
  background: "los antecedentes",
  case: "un expediente",
  note: "una nota de evolución",
  clinic: "los datos de la clínica",
  program: "los ejercicios para casa",
};
const verbs: Record<ClinicalLogEntry["action"], string> = {
  view: "Vio",
  create: "Añadió",
  update: "Cambió",
  delete: "Eliminó",
  export: "Exportó",
};

// "Cambió un expediente: Objetivos y plan"
const describe = (entry: ClinicalLogEntry) =>
  `${verbs[entry.action]} ${things[entry.entity]}` +
  (entry.fields?.length ? `: ${entry.fields.map(label).join(", ")}` : "");

// Owners and admins: who saw, changed or exported this patient's clinical
// history, newest first. A change opens to show what it said before, so
// nothing written in the history is ever lost
export default function ClinicalLog({ patientId }: Props) {
  const { data: me } = useMe();
  const { data: entries, isPending, error } = useClinicalLog(
    me?.activeClinic?.clinicId,
    patientId,
    true,
  );
  const [showAll, setShowAll] = useState(false);

  if (isPending) {
    return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  }
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        No se pudo cargar el registro: {error.message}
      </p>
    );
  }
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía nadie ha abierto esta historia.</p>;
  }

  const visible = showAll ? entries : entries.slice(0, SHORT_LIST);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y">
        {visible.map((entry) => {
          const previous = Object.entries(entry.previous ?? {});
          return (
            <li key={entry.id} className="flex flex-col gap-1 py-2.5 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span>
                  <span className="font-medium">{entry.userName}</span> ·{" "}
                  {describe(entry).replace(/^./, (c) => c.toLowerCase())}
                </span>
                <time className="text-xs text-muted-foreground tabular-nums">
                  {timeFormat.format(new Date(entry.at))}
                </time>
              </div>
              {previous.length > 0 && (
                <details className="text-muted-foreground">
                  <summary className="w-fit cursor-pointer text-xs hover:text-foreground">
                    Ver lo que decía antes
                  </summary>
                  <dl className="mt-1.5 flex flex-col gap-1.5 border-l pl-3">
                    {previous.map(([field, value]) => (
                      <div key={field}>
                        <dt className="text-xs font-medium text-foreground">{label(field)}</dt>
                        <dd className="whitespace-pre-wrap">
                          {value === null || value === "" ? "(vacío)" : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </li>
          );
        })}
      </ul>
      {!showAll && entries.length > SHORT_LIST && (
        <Button
          variant="outline"
          size="sm"
          className="w-fit rounded-full"
          onClick={() => setShowAll(true)}
        >
          Ver todo ({entries.length})
        </Button>
      )}
    </div>
  );
}

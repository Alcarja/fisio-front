import { useState, type ReactNode } from "react";
import { CircleAlert, FolderOpen, FolderPlus, Loader2, Pencil, TriangleAlert } from "lucide-react";
import { useMe, usePatientClinical } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { hasAccess, teamAccess } from "@/lib/roles";
import { backgroundFields } from "../clinicalFormat";
import BackgroundDialog from "./BackgroundDialog";
import CaseCard from "./CaseCard";
import CaseDialog from "./CaseDialog";

type Props = { patientId: string };

// Historia clínica of a patient: the clinical alert on top, the expedientes
// (open ones first, closed ones below) and the antecedentes.
// Health data: render it only for clinical roles (clinicalAccess in lib/roles.ts);
// the backend refuses everyone else
export default function ClinicalRecord({ patientId }: Props) {
  const { data: me } = useMe();
  const { data: clinical, isPending, error } = usePatientClinical(
    me?.activeClinic?.clinicId,
    patientId,
    true,
  );
  const [dialog, setDialog] = useState<"case" | "background" | null>(null);

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
        No se pudo cargar la historia clínica: {error.message}
      </div>
    );
  }

  const { background, cases, professionals } = clinical;
  const open = cases.filter((c) => c.status === "open");
  const closed = cases.filter((c) => c.status === "closed");
  const hasBackground = backgroundFields.some((f) => background[f.key]);
  const cardProps = {
    patientId,
    professionals,
    myUserId: me?.user.id,
    // Owners and admins can correct anyone's notes
    canManage: hasAccess(me, teamAccess),
  };

  return (
    <>
      {background.clinicalAlert && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-medium">Aviso clínico:</strong> {background.clinicalAlert}
          </span>
        </div>
      )}

      <Section
        title="Expedientes"
        description={
          cases.length === 0
            ? "Uno por lesión o motivo de consulta."
            : `${open.length} ${open.length === 1 ? "abierto" : "abiertos"} · ${closed.length} ${closed.length === 1 ? "cerrado" : "cerrados"}`
        }
        action={
          <Button size="sm" className="w-fit rounded-full" onClick={() => setDialog("case")}>
            <FolderPlus /> Abrir expediente
          </Button>
        }
      >
        {cases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <FolderOpen className="size-5" />
            Este paciente no tiene expedientes. Abre uno para la lesión que viene a tratarse.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {open.length > 0 && (
              <Group title="Abiertos">
                {open.map((c, index) => (
                  // The most recent open one starts unfolded: it's usually today's
                  <CaseCard key={c.id} patientCase={c} defaultExpanded={index === 0} {...cardProps} />
                ))}
              </Group>
            )}
            {closed.length > 0 && (
              <Group title="Cerrados">
                {closed.map((c) => (
                  <CaseCard key={c.id} patientCase={c} {...cardProps} />
                ))}
              </Group>
            )}
          </div>
        )}
      </Section>

      <Section
        title="Antecedentes"
        description="Datos de salud que valen para todos los expedientes."
        action={
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-full"
            onClick={() => setDialog("background")}
          >
            <Pencil /> Editar
          </Button>
        }
      >
        {hasBackground ? (
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {backgroundFields
              .filter((f) => background[f.key])
              .map((f) => (
                <div
                  key={f.key}
                  className={`flex min-w-0 flex-col gap-1 ${f.long ? "sm:col-span-2" : ""}`}
                >
                  <dt className="text-sm font-medium">{f.label}</dt>
                  <dd className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {background[f.key]}
                  </dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin antecedentes anotados: alergias, medicación, operaciones, profesión…
          </p>
        )}
      </Section>

      {dialog === "case" && (
        <CaseDialog
          patientId={patientId}
          professionals={professionals}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "background" && (
        <BackgroundDialog
          patientId={patientId}
          background={background}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Card with a title (and an action) on the left and content on the right
function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

import { generatePath, Link } from "react-router";
import { ChevronRight, CircleAlert, Dumbbell, Loader2 } from "lucide-react";
import { useActivePrograms, useMe } from "@/adapters/hook";
import { paths } from "@/routes/paths";
import { formatDate } from "../../Patients/clinicalFormat";

// Who has exercises for home right now, newest first. Each row opens the
// patient's ficha, where the exercises are shown, edited or finished
export default function ActivePrograms() {
  const { data: me } = useMe();
  const { data: programs, isPending, error } = useActivePrograms(me?.activeClinic?.clinicId);

  if (isPending) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error.message}
      </p>
    );
  }
  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[1.75rem] border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
        <Dumbbell className="size-6 text-primary" />
        <span className="font-medium text-foreground">Nadie tiene ejercicios en curso</span>
        Se pautan desde el expediente de cada paciente, o desde una tabla con «Pautar a un paciente».
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {programs.length === 1 ? "1 paciente tiene" : `${programs.length} pacientes tienen`} ejercicios para casa en curso.
      </p>
      <ul className="flex flex-col divide-y overflow-hidden rounded-[1.75rem] border bg-card">
        {programs.map((p) => (
          <li key={p.id}>
            <Link
              to={generatePath(paths.adminPatient, { patientId: p.patientId })}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                {`${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">
                  {p.firstName} {p.lastName}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {p.caseTitle} · {p.itemCount} {p.itemCount === 1 ? "ejercicio" : "ejercicios"}:{" "}
                  {p.itemNames.join(", ")}
                  {p.itemCount > p.itemNames.length && "…"}
                </span>
              </span>
              <span className="hidden shrink-0 flex-col items-end text-xs text-muted-foreground sm:flex">
                <span>Desde el {formatDate(p.startDate)}</span>
                {p.createdByName && <span>{p.createdByName}</span>}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

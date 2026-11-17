import { useState } from "react";
import { generatePath, Link } from "react-router";
import { BookUser, ChevronRight, FolderOpen, Loader2, Search } from "lucide-react";
import type { ExerciseTemplate, Patient } from "@/adapters/api";
import { useMe, usePatientClinical, usePatients, usePrograms } from "@/adapters/hook";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounced } from "@/lib/useDebounced";
import { paths } from "@/routes/paths";
import ProgramDialog from "../../Patients/components/ProgramDialog";
import { regionAndSide } from "../../Patients/clinicalFormat";

// "Pautar a un paciente" from a tabla: choose the patient, then the open
// expediente, then adjust it in the usual builder
export default function AssignTemplateDialog({ template, onClose }: { template: ExerciseTemplate; onClose: () => void }) {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim());
  const [chosen, setChosen] = useState<Patient | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const { data: found, isPending: searching } = usePatients(clinicId, { search, limit: 8 }, !chosen);
  const { data: clinical, isPending: loadingClinical } = usePatientClinical(clinicId, chosen?.id, !!chosen);
  const { data: programs = [] } = usePrograms(clinicId, chosen?.id);
  const openCases = clinical?.cases.filter((c) => c.status === "open") ?? [];
  const activeIn = (id: string) => programs.find((p) => p.caseId === id && p.status === "active");

  // Patient and expediente chosen: the builder, with the tabla
  if (chosen && caseId) {
    const active = activeIn(caseId);
    return (
      <ProgramDialog
        patientId={chosen.id}
        caseId={caseId}
        mode={active ? "phase" : "new"}
        current={active}
        template={template}
        patientName={`${chosen.firstName} ${chosen.lastName}`}
        onClose={onClose}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pautar «{template.name}»</DialogTitle>
          <DialogDescription>
            {chosen
              ? `¿En qué expediente de ${chosen.firstName} ${chosen.lastName}?`
              : "¿A qué paciente? Después podrás ajustar los ejercicios a su caso."}
          </DialogDescription>
        </DialogHeader>

        {!chosen ? (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono o NIF"
                aria-label="Buscar paciente"
                className="pl-9"
              />
            </div>
            <ul className="flex flex-col divide-y rounded-xl border">
              {searching ? (
                <li className="flex justify-center p-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </li>
              ) : (found?.patients ?? []).length === 0 ? (
                <li className="p-4 text-center text-sm text-muted-foreground">Ningún paciente coincide.</li>
              ) : (
                found!.patients.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setChosen(p)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <BookUser className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">
                        {p.firstName} {p.lastName}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : loadingClinical ? (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        ) : openCases.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <FolderOpen className="size-5" />
            Este paciente no tiene expedientes abiertos. Los ejercicios se pautan dentro de un expediente.
            <Link
              to={generatePath(paths.adminPatient, { patientId: chosen.id })}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Abrir su ficha
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {openCases.map((c) => {
              const active = activeIn(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setCaseId(c.id)}
                    className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary hover:bg-secondary/40"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {regionAndSide(c)}
                        {active && " · ya tiene ejercicios: se pautará como nueva fase"}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {chosen && (
          <button type="button" onClick={() => setChosen(null)} className="w-fit text-xs text-muted-foreground hover:text-foreground">
            ← Elegir otro paciente
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}

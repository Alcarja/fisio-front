import { useState } from "react";
import { generatePath, Link, useNavigate } from "react-router";
import {
  BookUser,
  ChevronRight,
  CircleAlert,
  Download,
  Loader2,
  Plus,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getClinicExport } from "@/adapters/api";
import { useMe, usePatients } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasAccess, teamAccess } from "@/lib/roles";
import { useDebounced } from "@/lib/useDebounced";
import { paths } from "@/routes/paths";
import PatientDialog from "./components/PatientDialog";
import { downloadJson, fileSlug } from "./patientExport";

// How many patients each "Cargar más" adds (same as the backend's default)
const PAGE_SIZE = 50;

const initials = (p: { firstName: string; lastName: string }) =>
  `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();

// Every clinic role: the active clinic's patients, by surname, with a search.
// Protected in the router (bookingsAccess) and in the backend (requireActiveClinic)
export default function PatientsPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const activeClinic = me?.activeClinic;

  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [creating, setCreating] = useState(false);

  const search = useDebounced(query.trim());
  const { data, isPending, error, isPlaceholderData } = usePatients(activeClinic?.clinicId, {
    search,
    limit,
  });
  const patients = data?.patients ?? [];
  const total = data?.total ?? 0;

  // Owners and admins: every ficha, clinical history and appointment in one
  // file, for the clinic's own copy or to take its data elsewhere
  const [exporting, setExporting] = useState(false);
  const exportAll = async () => {
    setExporting(true);
    try {
      const data = await getClinicExport();
      downloadJson(
        `${fileSlug(data.clinic.name)}-pacientes-${new Date().toLocaleDateString("sv-SE")}.json`,
        data,
      );
    } catch (error) {
      toast.error("No se pudieron exportar los datos", { description: (error as Error).message });
    } finally {
      setExporting(false);
    }
  };

  // A new search starts again from the first page
  const changeQuery = (value: string) => {
    setQuery(value);
    setLimit(PAGE_SIZE);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-coral">
            {activeClinic?.clinicName ?? "Clínica"}
          </span>
          <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">
            Pacientes
          </h1>
          <p className="text-muted-foreground">
            La ficha de cada paciente, con sus datos y sus citas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasAccess(me, teamAccess) && (
            <Button
              variant="outline"
              className="w-fit rounded-full"
              onClick={exportAll}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="animate-spin" /> : <Download />} Exportar todo
            </Button>
          )}
          <Button className="w-fit rounded-full" onClick={() => setCreating(true)}>
            <Plus /> Nuevo paciente
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-5 rounded-[1.75rem] border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono, email o NIF"
              aria-label="Buscar pacientes"
              className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => changeQuery("")}
                aria-label="Borrar búsqueda"
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {data && (
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {total === 1 ? "1 paciente" : `${total} pacientes`}
            </span>
          )}
        </div>

        {isPending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error.message}
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {search ? (
              <>
                <SearchX className="size-5" />
                Ningún paciente coincide con «{search}».
              </>
            ) : (
              <>
                <BookUser className="size-5" />
                Todavía no hay pacientes. Crea el primero con «Nuevo paciente».
              </>
            )}
          </div>
        ) : (
          <>
            <ul className="flex flex-col divide-y">
              {patients.map((p) => (
                <li key={p.id}>
                  <Link
                    to={generatePath(paths.adminPatient, { patientId: p.id })}
                    className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                      {initials(p)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {p.lastName}, {p.firstName}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {[p.phone, p.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                      </span>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>

            {patients.length < total && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Mostrando {patients.length} de {total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={isPlaceholderData}
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                >
                  {isPlaceholderData && <Loader2 className="animate-spin" />}
                  Cargar más
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {creating && (
        <PatientDialog
          onClose={() => setCreating(false)}
          onCreated={(p) => navigate(generatePath(paths.adminPatient, { patientId: p.id }))}
        />
      )}
    </div>
  );
}

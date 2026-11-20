import { generatePath, Link, useSearchParams } from "react-router";
import {
  Building2,
  ChevronRight,
  CircleAlert,
  Loader2,
  Search,
} from "lucide-react";
import { useGetAllClinics } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { paths } from "@/routes/paths";
import CreateClinicDialog from "./components/CreateClinicDialog";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

// Lower case and without accents: "Clínica" is found typing "clinica"
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

// Superadmin only: every clinic on the platform
export default function ClinicsPage() {
  const { data: clinics, isPending, error } = useGetAllClinics();
  // In the URL (?q=): still there when coming back from a clinic
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const setSearch = (q: string) => setParams(q ? { q } : {}, { replace: true });
  const words = normalize(search).split(/\s+/).filter(Boolean);
  const visible = (clinics ?? []).filter((c) => {
    const text = normalize(`${c.name} ${c.slug}`);
    return words.every((w) => text.includes(w));
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-coral">Plataforma</span>
          <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">
            Clínicas
          </h1>
          <p className="text-muted-foreground">
            Todas las clínicas registradas en Kineflow.
          </p>
        </div>
        <CreateClinicDialog />
      </header>

      {isPending ? (
        <div className="flex justify-center py-16">
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
      ) : clinics.length === 0 ? (
        <section className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
            <Building2 className="size-5 text-primary" />
          </span>
          <h2 className="font-display text-3xl tracking-tight">
            Todavía no hay clínicas
          </h2>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o dirección"
                aria-label="Buscar clínica"
                className="pl-9"
              />
            </div>
            <span
              className="text-sm text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              {words.length
                ? `${visible.length} de ${clinics.length}`
                : `${clinics.length} ${clinics.length === 1 ? "clínica" : "clínicas"}`}
            </span>
          </div>
          {visible.length === 0 ? (
            <p className="rounded-[1.75rem] border border-dashed p-8 text-center text-sm text-muted-foreground">
              Ninguna clínica coincide con «{search.trim()}».{" "}
              <button
                type="button"
                onClick={() => setSearch("")}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Ver todas
              </button>
            </p>
          ) : (
            <ul className="flex flex-col divide-y overflow-hidden rounded-[1.75rem] border bg-card">
              {visible.map((clinic) => (
                <li key={clinic.id}>
                  <Link
                    to={generatePath(paths.adminClinic, {
                      clinicId: clinic.id,
                    })}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                      {clinic.logo ? (
                        <img
                          src={clinic.logo}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Building2 className="size-4 text-primary" />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {clinic.name}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        /{clinic.slug}
                      </span>
                    </div>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                      {dateFormat.format(new Date(clinic.createdAt))}
                    </span>
                    <Badge
                      variant={
                        clinic.status === "active" ? "secondary" : "outline"
                      }
                    >
                      {clinic.status ?? "—"}
                    </Badge>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

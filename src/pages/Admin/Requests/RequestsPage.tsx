import { useState } from "react";
import { CircleAlert, Inbox, Loader2 } from "lucide-react";
import { useContactRequests } from "@/adapters/hook";
import { cn } from "@/lib/utils";
import RequestCard from "./components/RequestCard";

type Filter = "pending" | "handled" | "all";

const filters: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "handled", label: "Respondidas" },
  { value: "all", label: "Todas" },
];

const emptyText: Record<Filter, string> = {
  pending: "Estás al día: no hay solicitudes sin responder.",
  handled: "Todavía no has marcado ninguna como respondida.",
  all: "Todavía no ha escrito nadie desde la web.",
};

// Superadmin only: what clinics interested in Kineflow sent from the website's
// /contacto form. Protected in the router (superadminAccess) and in the backend
export default function RequestsPage() {
  const { data: requests, isPending, error } = useContactRequests();
  const [filter, setFilter] = useState<Filter>("pending");

  const all = requests ?? [];
  const counts: Record<Filter, number> = {
    pending: all.filter((r) => !r.handled).length,
    handled: all.filter((r) => r.handled).length,
    all: all.length,
  };
  const visible =
    filter === "all" ? all : all.filter((r) => r.handled === (filter === "handled"));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">Plataforma</span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">
          Solicitudes
        </h1>
        <p className="text-muted-foreground">
          Clínicas interesadas que han escrito desde la web.
        </p>
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
      ) : (
        <div className="flex flex-col gap-4">
          <nav aria-label="Filtrar solicitudes" className="flex">
            <div className="flex gap-1 rounded-full border bg-card p-1">
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    filter === f.value
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      f.value === "pending" && counts.pending > 0
                        ? "font-medium text-coral"
                        : "text-muted-foreground",
                    )}
                  >
                    {counts[f.value]}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {visible.length === 0 ? (
            <section className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed p-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                <Inbox className="size-5 text-primary" />
              </span>
              <p className="max-w-xs text-sm text-muted-foreground">{emptyText[filter]}</p>
            </section>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

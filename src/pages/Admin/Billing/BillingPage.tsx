import { useState } from "react";
import { Building2, CircleAlert, Loader2 } from "lucide-react";
import { useBilling } from "@/adapters/hook";
import { cn } from "@/lib/utils";
import MonthPicker from "../Reports/components/MonthPicker";
import { monthKey } from "../Reports/reportUtils";
import { byAttention, monthToDate, shiftMonth, stateOf, type MonthState } from "./billingUtils";
import ClinicPaymentRow from "./components/ClinicPaymentRow";

type Filter = "all" | "pending" | "paid" | "exempt";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagadas" },
  { value: "exempt", label: "No pagan" },
];

// Superadmin only: manual record of which clinics have paid each month.
// Kineflow doesn't charge anyone; this is only the notebook. Protected in the
// router (superadminAccess) and in the backend (requireSuperAdmin)
export default function BillingPage() {
  // null = this month (known once the backend answers, in Spain's time zone)
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const today = monthKey(new Date());
  const { data, isPending, isPlaceholderData, error } = useBilling(selected ?? today);

  const month = data?.month ?? selected ?? today;
  const currentMonth = data?.currentMonth ?? today;
  const clinics = [...(data?.clinics ?? [])].sort(byAttention(month));

  const count = (state: MonthState) => clinics.filter((c) => stateOf(c, month) === state).length;
  const paid = count("paid");
  const pending = count("pending");
  const exempt = count("exempt");
  const owed = paid + pending;
  const counts: Record<Filter, number> = {
    all: clinics.length,
    pending,
    paid,
    exempt,
  };
  const visible = filter === "all" ? clinics : clinics.filter((c) => stateOf(c, month) === filter);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">Plataforma</span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Pagos</h1>
        <p className="text-muted-foreground">Marca qué clínicas han pagado cada mes.</p>
      </header>

      <MonthPicker
        month={monthToDate(month)}
        isCurrent={month === currentMonth}
        onPrevious={() => setSelected(shiftMonth(month, -1))}
        onNext={() => setSelected(shiftMonth(month, 1))}
        onCurrent={() => setSelected(null)}
        nextDisabled={month >= currentMonth}
      />

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
          <h2 className="font-display text-3xl tracking-tight">Todavía no hay clínicas</h2>
        </section>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-6 transition-opacity",
            isPlaceholderData && "pointer-events-none opacity-50",
          )}
        >
          {/* The month in one line: how many of the clinics that have to pay already did */}
          <section className="flex flex-col gap-4 rounded-[1.75rem] bg-secondary/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-5xl leading-none tracking-tight tabular-nums">
                  {paid}
                </span>
                <span className="text-muted-foreground">
                  de {owed} {owed === 1 ? "clínica ha" : "clínicas han"} pagado
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {pending > 0 ? (
                  <span className="font-medium text-coral">
                    {pending} {pending === 1 ? "pendiente" : "pendientes"}
                  </span>
                ) : owed > 0 ? (
                  <span className="font-medium text-primary">Todas al día</span>
                ) : null}
                {exempt > 0 && (
                  <>
                    {(pending > 0 || owed > 0) && " · "}
                    {exempt} {exempt === 1 ? "no paga" : "no pagan"}
                  </>
                )}
              </p>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-background"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={owed}
              aria-valuenow={paid}
              aria-label="Clínicas que han pagado este mes"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${owed > 0 ? (paid / owed) * 100 : 0}%` }}
              />
            </div>
          </section>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav
                aria-label="Filtrar clínicas"
                className="-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
              >
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
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {counts[f.value]}
                      </span>
                    </button>
                  ))}
                </div>
              </nav>
              <Legend />
            </div>

            {visible.length === 0 ? (
              <p className="rounded-[1.75rem] border border-dashed p-8 text-center text-sm text-muted-foreground">
                Ninguna clínica en este grupo.
              </p>
            ) : (
              <ul className="flex flex-col divide-y overflow-hidden rounded-[1.75rem] border bg-card">
                {visible.map((clinic) => (
                  <ClinicPaymentRow key={clinic.id} clinic={clinic} month={month} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// What the squares of the history mean
function Legend() {
  const items = [
    { label: "Pagado", className: "bg-primary" },
    { label: "Sin pagar", className: "border border-coral bg-coral/15" },
    { label: "No paga", className: "bg-muted-foreground/25" },
  ];
  return (
    <ul className="hidden items-center gap-4 text-xs text-muted-foreground md:flex">
      <li>Últimos 12 meses:</li>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={cn("h-3.5 w-4 rounded-[4px]", i.className)} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

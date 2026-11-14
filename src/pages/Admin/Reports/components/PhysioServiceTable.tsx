import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, CircleAlert, Loader2 } from "lucide-react";
import { useMe, useMonthlyReport } from "@/adapters/hook";
import MemberAvatar from "@/components/MemberAvatar";
import { cn } from "@/lib/utils";
import {
  buildReportFromCells,
  formatHours,
  monthKey,
  formatPercent,
  share,
  type MonthReport,
  type PhysioRow,
  type Totals,
} from "../reportUtils";

// ── What the cells show ──────────────────────────────────────────────────

type Metric = "appointments" | "minutes" | "patients";

const metrics: Record<
  Metric,
  { label: string; unit: (n: number) => string; get: (t: Totals) => number }
> = {
  appointments: {
    label: "Citas",
    unit: (n) => `${n} cita${n === 1 ? "" : "s"}`,
    get: (t) => t.appointments,
  },
  minutes: { label: "Horas", unit: formatHours, get: (t) => t.minutes },
  patients: {
    label: "Pacientes",
    unit: (n) => `${n} paciente${n === 1 ? "" : "s"}`,
    get: (t) => t.patients,
  },
};

const formatValue = (metric: Metric, n: number) =>
  metric === "minutes" ? formatHours(n) : n.toLocaleString("es-ES");

const noShowRate = (t: Totals) => share(t.noShows, t.appointments);

// Heat: one hue (primary), stronger the bigger the cell. Capped so the
// text on top stays readable in both themes
const MAX_HEAT = 38;
const heat = (value: number, max: number) =>
  value > 0
    ? `color-mix(in oklch, var(--primary) ${Math.round(6 + (value / max) * (MAX_HEAT - 6))}%, transparent)`
    : undefined;

// ── Sorting ──────────────────────────────────────────────────────────────

// "name", a service id, or one of the summary columns
type SortKey = string;
type Sort = { key: SortKey; desc: boolean };

function sortValue(
  p: PhysioRow,
  key: SortKey,
  metric: Metric,
  report: MonthReport,
): number | string {
  switch (key) {
    case "name":
      return p.name;
    case "total":
      return metrics[metric].get(p.totals);
    case "minutes":
      return p.totals.minutes;
    case "patients":
      return p.totals.patients;
    case "noShows":
      return noShowRate(p.totals);
    case "cancelled":
      return p.totals.cancelled;
    default: {
      const cell = report.matrix[p.id]?.[key];
      return cell ? metrics[metric].get(cell) : 0;
    }
  }
}

// ── Component ────────────────────────────────────────────────────────────

const TITLE = "Desglose por fisio y servicio";

// The breakdown of one month, with its own data:
// GET /clinic/reports/monthly?month=YYYY-MM (the backend counts each
// physio × service pair). While another month loads, the previous one stays
// on screen, dimmed
export default function PhysioServiceTable({ month }: { month: Date }) {
  const { data: me } = useMe();
  const report = useMonthlyReport(me?.activeClinic?.clinicId, monthKey(month));

  if (report.isPending || !report.data) {
    return (
      <section className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5 sm:p-6">
        <h2 className="font-medium">{TITLE}</h2>
        {report.isError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {report.error.message || "No se pudo cargar el desglose"}
          </div>
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </section>
    );
  }

  return (
    <div
      className={cn("transition-opacity", report.isPlaceholderData && "opacity-50")}
      aria-busy={report.isPlaceholderData}
    >
      <MonthTable report={buildReportFromCells(report.data)} />
    </div>
  );
}

// The table itself: one row per physio and one column per service, shaded by
// value, plus a summary per physio (hours, patients, no-shows,
// cancellations). Every column sorts. On phones the table scrolls sideways
// inside the card, with the physio column pinned
function MonthTable({ report }: { report: MonthReport }) {
  const [metric, setMetric] = useState<Metric>("appointments");
  const [sort, setSort] = useState<Sort>({ key: "total", desc: true });

  // Only services with appointments this month, so the table stays narrow
  const services = report.byService.filter((s) => s.totals.appointments > 0);
  const m = metrics[metric];

  const physios = [...report.byPhysio].sort((a, b) => {
    const va = sortValue(a, sort.key, metric, report);
    const vb = sortValue(b, sort.key, metric, report);
    const order =
      typeof va === "string"
        ? va.localeCompare(String(vb), "es")
        : va - (vb as number);
    return sort.desc ? -order : order;
  });

  const maxCell = Math.max(
    1,
    ...report.byPhysio.flatMap((p) =>
      services.map((s) => m.get(report.matrix[p.id]?.[s.id] ?? zero)),
    ),
  );
  const monthTotal = m.get(report.totals);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" },
    );

  const num = "px-2.5 py-2.5 text-right tabular-nums whitespace-nowrap";
  const sticky = "sticky left-0 z-10 bg-card";
  const edgeL = "pl-5 sm:pl-6";
  const edgeR = "pr-5 sm:pr-6";

  return (
    <section className="flex flex-col gap-6 rounded-[1.75rem] border bg-card p-5 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">{TITLE}</h2>
          <p className="text-sm text-muted-foreground">
            Qué hace cada profesional y cuánto. Sin contar las citas canceladas.
          </p>
        </div>

        {/* What the cells count: the same rows and columns, another measure */}
        <div
          role="radiogroup"
          aria-label="Qué mostrar en la tabla"
          className="flex rounded-full border bg-background p-1"
        >
          {(Object.keys(metrics) as Metric[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={metric === key}
              onClick={() => setMetric(key)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                metric === key
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {metrics[key].label}
            </button>
          ))}
        </div>
      </header>

      {services.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay citas este mes.
        </p>
      ) : (
        <>
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <SortHeader
                    sort={sort}
                    onSort={toggleSort}
                    k="name"
                    className={cn(sticky, edgeL, "z-20 text-left")}
                  >
                    Fisio
                  </SortHeader>
                  {services.map((s) => (
                    <SortHeader
                      key={s.id}
                      sort={sort}
                      onSort={toggleSort}
                      k={s.id}
                      className="text-right"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                        aria-hidden
                      />
                      <span className="max-w-28 truncate" title={s.name}>
                        {s.name}
                      </span>
                    </SortHeader>
                  ))}
                  <SortHeader
                    sort={sort}
                    onSort={toggleSort}
                    k="total"
                    className="border-l text-right"
                  >
                    Total
                  </SortHeader>
                  {metric !== "minutes" && (
                    <SortHeader
                      sort={sort}
                      onSort={toggleSort}
                      k="minutes"
                      className="text-right"
                    >
                      Horas
                    </SortHeader>
                  )}
                  {metric !== "patients" && (
                    <SortHeader
                      sort={sort}
                      onSort={toggleSort}
                      k="patients"
                      className="text-right"
                    >
                      Pacientes
                    </SortHeader>
                  )}
                  <SortHeader
                    sort={sort}
                    onSort={toggleSort}
                    k="noShows"
                    className="text-right"
                  >
                    Ausencias
                  </SortHeader>
                  <SortHeader
                    sort={sort}
                    onSort={toggleSort}
                    k="cancelled"
                    className={cn(edgeR, "text-right")}
                  >
                    Canceladas
                  </SortHeader>
                </tr>
              </thead>

              <tbody>
                {physios.map((p) => {
                  const row = report.matrix[p.id] ?? {};
                  const rowTotal = m.get(p.totals);
                  return (
                    <tr key={p.id} className="group">
                      <th
                        scope="row"
                        className={cn(
                          sticky,
                          edgeL,
                          "border-b py-2.5 pr-3 text-left font-medium group-hover:bg-muted",
                        )}
                      >
                        <span className="flex max-w-44 items-center gap-2.5">
                          <MemberAvatar member={p} />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{p.name}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {formatPercent(share(rowTotal, monthTotal))} del
                              mes
                            </span>
                          </span>
                        </span>
                      </th>

                      {services.map((s) => {
                        const value = m.get(row[s.id] ?? zero);
                        return (
                          <td
                            key={s.id}
                            className="border-b p-1 group-hover:bg-muted/40"
                          >
                            <div
                              className={cn(
                                "flex min-w-16 flex-col items-end rounded-lg px-2.5 py-1.5 tabular-nums",
                                value === 0 && "text-muted-foreground/50",
                              )}
                              style={{ backgroundColor: heat(value, maxCell) }}
                              title={
                                value > 0
                                  ? `${p.name} · ${s.name}: ${m.unit(value)} (${formatPercent(share(value, rowTotal))} de su ${metric === "minutes" ? "tiempo" : "agenda"})`
                                  : `${p.name} no tuvo citas de ${s.name}`
                              }
                            >
                              <span className={cn(value > 0 && "font-medium")}>
                                {value === 0 ? "·" : formatValue(metric, value)}
                              </span>
                              {value > 0 && (
                                <span className="text-[11px] text-muted-foreground">
                                  {formatPercent(share(value, rowTotal))}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td
                        className={cn(
                          num,
                          "border-b border-l font-medium group-hover:bg-muted/40",
                        )}
                      >
                        {formatValue(metric, rowTotal)}
                      </td>
                      {metric !== "minutes" && (
                        <td
                          className={cn(
                            num,
                            "border-b group-hover:bg-muted/40",
                          )}
                        >
                          {formatHours(p.totals.minutes)}
                        </td>
                      )}
                      {metric !== "patients" && (
                        <td
                          className={cn(
                            num,
                            "border-b group-hover:bg-muted/40",
                          )}
                        >
                          {p.totals.patients}
                        </td>
                      )}
                      <td
                        className={cn(num, "border-b group-hover:bg-muted/40")}
                      >
                        {p.totals.noShows === 0 ? (
                          <span className="text-muted-foreground/50">·</span>
                        ) : (
                          <>
                            {p.totals.noShows}
                            <span className="text-muted-foreground">
                              {" "}
                              · {formatPercent(noShowRate(p.totals))}
                            </span>
                          </>
                        )}
                      </td>
                      <td
                        className={cn(
                          num,
                          edgeR,
                          "border-b group-hover:bg-muted/40",
                        )}
                      >
                        {p.totals.cancelled === 0 ? (
                          <span className="text-muted-foreground/50">·</span>
                        ) : (
                          p.totals.cancelled
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="font-medium">
                  <th
                    scope="row"
                    className={cn(sticky, edgeL, "py-3 pr-3 text-left")}
                  >
                    Total clínica
                  </th>
                  {services.map((s) => {
                    const value = m.get(s.totals);
                    return (
                      <td key={s.id} className={cn(num, "px-3")}>
                        {formatValue(metric, value)}
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          {formatPercent(share(value, monthTotal))}
                        </span>
                      </td>
                    );
                  })}
                  <td className={cn(num, "border-l")}>
                    {formatValue(metric, monthTotal)}
                  </td>
                  {metric !== "minutes" && (
                    <td className={num}>
                      {formatHours(report.totals.minutes)}
                    </td>
                  )}
                  {metric !== "patients" && (
                    <td className={num}>{report.totals.patients}</td>
                  )}
                  <td className={num}>
                    {report.totals.noShows}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {formatPercent(noShowRate(report.totals))}
                    </span>
                  </td>
                  <td className={cn(num, edgeR)}>{report.totals.cancelled}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* How to read the shading */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              Menos
              <span
                className="h-2 w-24 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${heat(0.01, 1)}, ${heat(1, 1)})`,
                }}
                aria-hidden
              />
              Más
            </span>
            <span>
              El porcentaje de cada celda es la parte de la{" "}
              {metric === "minutes" ? "jornada" : "agenda"} de ese fisio. Pulsa
              una columna para ordenar.
            </span>
          </div>
        </>
      )}
    </section>
  );
}

// Column header that sorts the table (click again to reverse)
function SortHeader({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k: SortKey;
  sort: Sort;
  onSort: (key: SortKey) => void;
  children: ReactNode;
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
      className={cn("border-b px-2.5 py-2 font-medium", className)}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          active && "text-foreground",
        )}
      >
        {children}
        {active && sort.desc && <ArrowDown className="size-3 shrink-0" />}
        {active && !sort.desc && <ArrowUp className="size-3 shrink-0" />}
      </button>
    </th>
  );
}

const zero: Totals = {
  appointments: 0,
  minutes: 0,
  patients: 0,
  noShows: 0,
  cancelled: 0,
};

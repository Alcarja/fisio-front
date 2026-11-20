import { useState, type ReactNode } from "react";
import { generatePath, Link } from "react-router";
import { Check, ChevronRight, CircleAlert, Loader2, Minus, Plus, Search, TriangleAlert, Users } from "lucide-react";
import type { ClinicContract, ClinicFeature, ContractsOverview } from "@/adapters/api";
import { useContracts } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { clinicFeatures } from "@/lib/features";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { cycleLabel } from "../Plans/planUtils";
import { formatPrice } from "../Settings/Services/serviceFormat";
import { changeText, formatChangeDay, overrideText, ReviewButton } from "./components/ProfessionalChanges";

type Row = ContractsOverview["clinics"][number];
type FeatureState = ClinicContract["features"][number];

// Short names for the columns
const SHORT: Record<ClinicFeature, string> = {
  invoicing: "Cobros",
  clinical_history: "Historia",
  online_booking: "Reserva",
  reminders: "Recordat.",
  website: "Web",
};

// Who counts for the income: has a plan, has to pay and isn't deactivated
const paying = (r: Row) => !!r.contract.plan && !r.contract.exempt && r.status !== "inactive";
const differences = (c: ClinicContract) => c.features.filter((f) => !!f.contracted !== f.active).length;
// Its team changed the fee (not reviewed yet) or outgrew the professionals fixed by hand
const hasAlert = (r: Row) => r.professionalAlerts.unreviewed > 0 || r.professionalAlerts.overrideBelow;

// Suscripciones → Contratos (superadmin only): what every clinic has
// contracted, what it has active and what it pays, in one table. Each clinic's
// contract is changed in its page (Plan y precio). Shown inside
// SubscriptionsPage; protected in the router and in the backend
export default function ContractsTab() {
  const { data, isPending, error } = useContracts();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [onlyDiffs, setOnlyDiffs] = useState(false);
  const [onlyAlerts, setOnlyAlerts] = useState(false);

  const rows = data?.clinics ?? [];
  const planNames = [...new Set(rows.flatMap((r) => (r.contract.plan ? [r.contract.plan.name] : [])))].sort();
  const words = search.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (!words || r.name.toLowerCase().includes(words)) &&
      (plan === "all" || (plan === "none" ? !r.contract.plan : r.contract.plan?.name === plan)) &&
      (!onlyDiffs || differences(r.contract) > 0) &&
      (!onlyAlerts || hasAlert(r)),
  );

  const payingRows = rows.filter(paying);
  const monthly = payingRows.reduce((n, r) => n + r.contract.quote.monthlyCents, 0);
  const withoutPlan = rows.filter((r) => !r.contract.plan && r.status !== "inactive").length;
  const withDiffs = rows.filter((r) => differences(r.contract) > 0).length;
  const alerted = rows.filter(hasAlert);

  return (
    <div className="flex flex-col gap-8">

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error.message}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Tile label="Ingresos al mes" value={formatPrice(monthly)} note={`${payingRows.length} ${payingRows.length === 1 ? "clínica paga" : "clínicas pagan"} · ${formatPrice(monthly * 12)} al año`} />
            <Tile
              label="Por plan"
              value={String(rows.filter((r) => r.contract.plan).length)}
              note={planNames.map((n) => `${n} ${rows.filter((r) => r.contract.plan?.name === n).length}`).join(" · ") || "Ninguna con plan"}
            />
            <Tile label="Sin plan asignado" value={String(withoutPlan)} note="Activas, sin contrato" warn={withoutPlan > 0} onClick={() => { setPlan("none"); setOnlyDiffs(false); }} />
            <Tile label="Con diferencias" value={String(withDiffs)} note="Contratado ≠ activo" warn={withDiffs > 0} onClick={() => { setOnlyDiffs(true); setPlan("all"); }} />
          </div>

          {alerted.length > 0 && <ToReview rows={alerted} />}

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1 sm:max-w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clínica" aria-label="Buscar clínica" className="pl-9" />
            </div>
            <NativeSelect aria-label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} className="w-44">
              <NativeSelectOption value="all">Todos los planes</NativeSelectOption>
              {planNames.map((n) => (
                <NativeSelectOption key={n} value={n}>
                  {n}
                </NativeSelectOption>
              ))}
              <NativeSelectOption value="none">Sin plan</NativeSelectOption>
            </NativeSelect>
            <button
              type="button"
              aria-pressed={onlyDiffs}
              onClick={() => setOnlyDiffs((v) => !v)}
              className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", onlyDiffs ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              Solo con diferencias
            </button>
            {alerted.length > 0 && (
              <button
                type="button"
                aria-pressed={onlyAlerts}
                onClick={() => setOnlyAlerts((v) => !v)}
                className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", onlyAlerts ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                Solo con avisos
              </button>
            )}
            <Legend />
          </div>

          {visible.length === 0 ? (
            <p className="rounded-[1.75rem] border bg-card px-6 py-10 text-center text-sm text-muted-foreground">Ninguna clínica coincide.</p>
          ) : (
            <>
              {/* Wide screens: a table, a column per feature */}
              <div className="hidden overflow-x-auto rounded-[1.75rem] border bg-card lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Clínica</th>
                      <th className="px-3 py-3 font-medium">Plan</th>
                      {clinicFeatures.map((f) => (
                        <th key={f.key} className="px-2 py-3 text-center font-medium" title={f.label}>
                          {SHORT[f.key]}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right font-medium">Paga</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visible.map((r) => (
                      <tr key={r.id} className={cn("group", r.status === "inactive" && "bg-muted/30 text-muted-foreground")}>
                        <td className="px-5 py-3">
                          <ClinicName row={r} />
                        </td>
                        <td className="px-3 py-3">
                          <PlanCell contract={r.contract} />
                        </td>
                        {r.contract.features.map((f) => (
                          <td key={f.feature} className="px-2 py-3 text-center">
                            <StateIcon state={f} contract={r.contract} />
                          </td>
                        ))}
                        <td className="px-3 py-3 text-right">
                          <Price contract={r.contract} />
                        </td>
                        <td className="pr-4">
                          <Link to={generatePath(paths.adminClinic, { clinicId: r.id })} aria-label={`Ver ${r.name}`} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                            <ChevronRight className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phones and tablets: a card per clinic */}
              <ul className="flex flex-col gap-3 lg:hidden">
                {visible.map((r) => (
                  <li key={r.id}>
                    <Link to={generatePath(paths.adminClinic, { clinicId: r.id })} className={cn("flex flex-col gap-3 rounded-[1.5rem] border bg-card p-4", r.status === "inactive" && "opacity-70")}>
                      <div className="flex items-start justify-between gap-3">
                        <ClinicName row={r} />
                        <Price contract={r.contract} />
                      </div>
                      <PlanCell contract={r.contract} />
                      <ul className="flex flex-wrap gap-1.5">
                        {r.contract.features.map((f) => (
                          <li key={f.feature} className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs">
                            <StateIcon state={f} contract={r.contract} />
                            {SHORT[f.feature]}
                          </li>
                        ))}
                      </ul>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

// Clinics whose team changed what they pay: until the super-admin says they've
// seen it (the price itself already follows the team, from the next month)
function ToReview({ rows }: { rows: Row[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-[1.75rem] border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
          <Users className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="font-medium">Cambios de profesionales por revisar</h2>
          <p className="text-sm text-muted-foreground">
            El precio ya se ajusta solo desde el mes siguiente al cambio; esto es para que lo sepas (y lo hables con la clínica si hace falta).
          </p>
        </div>
      </div>
      <ul className="flex flex-col divide-y rounded-2xl border bg-card">
        {rows.map((r) => {
          const a = r.professionalAlerts;
          const last = a.changes.find((c) => c.tierChanged && !c.reviewed);
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="flex min-w-0 flex-1 basis-64 flex-col gap-0.5">
                <Link to={generatePath(paths.adminClinic, { clinicId: r.id })} className="truncate text-sm font-medium hover:underline">
                  {r.name}
                </Link>
                {last && (
                  <span className="text-xs text-muted-foreground">
                    {changeText(last)} · {formatChangeDay(last.changedAt)}
                    {a.unreviewed > 1 && ` (y ${a.unreviewed - 1} ${a.unreviewed === 2 ? "cambio más" : "cambios más"})`}
                  </span>
                )}
                {a.overrideBelow && (
                  <span className="text-xs text-amber-800 dark:text-amber-300">
                    {overrideText(r.contract.professionalsCounted, r.contract.professionalsOverride)} · cámbialo en su ficha si no es lo pactado
                  </span>
                )}
              </div>
              {a.unreviewed > 0 ? (
                <ReviewButton clinicId={r.id} name={r.name} />
              ) : (
                <Link to={generatePath(paths.adminClinic, { clinicId: r.id })} className="text-sm font-medium text-primary hover:underline">
                  Ver contrato
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Tile({ label, value, note, warn, onClick }: { label: string; value: string; note: string; warn?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn("flex min-w-0 flex-col gap-1 rounded-[1.5rem] border bg-card p-4 text-left sm:p-5", onClick && "transition-colors hover:bg-muted/50")}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-2xl font-medium tabular-nums sm:text-3xl", warn && "text-amber-700 dark:text-amber-400")}>{value}</span>
      <span className="truncate text-xs text-muted-foreground">{note}</span>
    </Tag>
  );
}

function ClinicName({ row }: { row: Row }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="font-medium">{row.name}</span>
      <span className="flex flex-wrap gap-1">
        {row.status === "inactive" && <Badge variant="outline" className="text-[11px]">Inactiva</Badge>}
        {row.contract.exempt && <Badge variant="outline" className="text-[11px]">No paga</Badge>}
        {row.professionalAlerts.unreviewed > 0 && (
          <Badge variant="outline" className="border-amber-300 text-[11px] text-amber-800 dark:border-amber-800 dark:text-amber-300">
            Cambió de tramo
          </Badge>
        )}
        {row.professionalAlerts.overrideBelow && (
          <Badge variant="outline" className="border-amber-300 text-[11px] text-amber-800 dark:border-amber-800 dark:text-amber-300">
            Tiene {row.contract.professionalsCounted}, paga por {row.contract.professionalsOverride}
          </Badge>
        )}
      </span>
    </div>
  );
}

function PlanCell({ contract: c }: { contract: ClinicContract }) {
  if (!c.plan) return <span className="text-sm text-amber-700 dark:text-amber-400">Sin plan</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">
        {c.plan.name}
        {c.plan.archived && <span className="ml-1 text-xs font-normal text-muted-foreground">(archivado)</span>}
      </span>
      <span className="text-xs text-muted-foreground">
        {cycleLabel[c.cycle]} · {c.professionals} prof.
        {c.professionalsOverride !== null && " (fijado)"}
        {c.discountPercent > 0 && ` · −${c.discountPercent} %`}
      </span>
    </div>
  );
}

function Price({ contract: c }: { contract: ClinicContract }) {
  if (!c.plan && c.quote.periodCents === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className={cn("flex flex-col items-end gap-0.5", c.exempt && "text-muted-foreground line-through")}>
      <span className="font-medium tabular-nums">
        {formatPrice(c.quote.periodCents)}
        <span className="font-normal text-muted-foreground">/{c.cycle === "annual" ? "año" : "mes"}</span>
      </span>
      {c.cycle === "annual" && <span className="text-xs text-muted-foreground no-underline">{formatPrice(c.quote.monthlyCents)}/mes</span>}
    </div>
  );
}

// What each feature is for this clinic, with a tooltip that says it in words
function StateIcon({ state: f, contract }: { state: FeatureState; contract: ClinicContract }) {
  const label = clinicFeatures.find((x) => x.key === f.feature)?.label ?? f.feature;
  const addon = contract.quote.addons.find((a) => a.feature === f.feature);
  const extra = addon ? ` (${formatPrice(addon.cents)}/mes)` : "";
  const [title, icon] =
    f.contracted && f.active
      ? f.contracted === "plan"
        ? [`${label}: en el plan, activa`, <Check key="i" className="size-4 text-primary" />]
        : [`${label}: extra${extra}, activa`, <Plus key="i" className="size-4 text-coral" strokeWidth={2.6} />]
      : f.contracted && !f.active
        ? [`${label}: contratada${f.contracted === "addon" ? ` como extra${extra}` : ""}, pero desactivada`, <TriangleAlert key="i" className="size-4 text-amber-600" />]
        : f.active
          ? [`${label}: activa sin contratar (¿prueba o regalo?)`, <span key="i" className="block size-2.5 rounded-full bg-amber-500" />]
          : [`${label}: no contratada`, <Minus key="i" className="size-4 text-muted-foreground/40" />];
  return (
    <span title={title} className="inline-flex size-6 items-center justify-center" role="img" aria-label={title}>
      {icon}
    </span>
  );
}

function Legend() {
  const item = (icon: ReactNode, text: string) => (
    <span className="flex items-center gap-1.5">
      {icon}
      {text}
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground lg:ml-auto">
      {item(<Check className="size-3.5 text-primary" />, "En el plan")}
      {item(<Plus className="size-3.5 text-coral" strokeWidth={2.6} />, "Extra")}
      {item(<TriangleAlert className="size-3.5 text-amber-600" />, "Contratada, desactivada")}
      {item(<span className="block size-2 rounded-full bg-amber-500" />, "Activa sin contratar")}
      {item(<Minus className="size-3.5 text-muted-foreground/40" />, "No")}
    </div>
  );
}

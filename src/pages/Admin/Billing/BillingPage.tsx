import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Building2, ChevronDown, CircleAlert, Loader2, Search } from "lucide-react";
import type { ClinicBilling } from "@/adapters/api";
import { useBilling } from "@/adapters/hook";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import MonthPicker from "../Reports/components/MonthPicker";
import { monthKey } from "../Reports/reportUtils";
import { formatPrice } from "../Settings/Services/serviceFormat";
import { amountOf, monthToDate, overdue, shiftMonth, stateOf } from "./billingUtils";
import ClinicPaymentRow from "./components/ClinicPaymentRow";

// Suscripciones → Pagos (superadmin only): manual record of which clinics have
// paid each month, with what each one pays (its contract, Plan y precio).
// Kineflow doesn't charge anyone; this is only the notebook.
//   - the month in euros: collected out of expected, pending, overdue
//   - the clinics in order of attention: to collect (most overdue first),
//     collected, and folded at the bottom those that don't pay and inactive ones
// Shown inside SubscriptionsPage; protected in the router (superadminAccess)
// and in the backend (requireSuperAdmin)
export default function BillingTab() {
  // null = this month (known once the backend answers, in Spain's time zone)
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const today = monthKey(new Date());
  const { data, isPending, isPlaceholderData, error } = useBilling(selected ?? today);

  const month = data?.month ?? selected ?? today;
  const currentMonth = data?.currentMonth ?? today;
  const all = data?.clinics ?? [];
  const words = search.trim().toLowerCase();
  const clinics = words ? all.filter((c) => c.name.toLowerCase().includes(words)) : all;

  // Inactive clinics don't count for the month (their history stays)
  const active = all.filter((c) => c.status !== "inactive");
  const owing = active.filter((c) => ["paid", "pending"].includes(stateOf(c, month)));
  const sum = (list: ClinicBilling[]) => list.reduce((n, c) => n + (amountOf(c, month) ?? 0), 0);
  const paidList = owing.filter((c) => stateOf(c, month) === "paid");
  const pendingList = owing.filter((c) => stateOf(c, month) === "pending");
  const expected = sum(owing);
  const collected = sum(paidList);
  const pendingCents = sum(pendingList);
  const lateClinics = active.filter((c) => !c.exempt && overdue(c, month).months.length > 0);
  const lateCents = lateClinics.reduce((n, c) => n + (overdue(c, month).cents ?? 0), 0);
  const noPlan = owing.filter((c) => amountOf(c, month) === null).length;

  const byLateness = (a: ClinicBilling, b: ClinicBilling) =>
    overdue(b, month).months.length - overdue(a, month).months.length || a.name.localeCompare(b.name, "es");
  const groups = {
    toCollect: clinics.filter((c) => c.status !== "inactive" && stateOf(c, month) === "pending").sort(byLateness),
    collected: clinics.filter((c) => c.status !== "inactive" && stateOf(c, month) === "paid").sort((a, b) => a.name.localeCompare(b.name, "es")),
    notPaying: clinics.filter((c) => c.status !== "inactive" && ["exempt", "notYet"].includes(stateOf(c, month))),
    inactive: clinics.filter((c) => c.status === "inactive"),
  };
  const rows = (list: ClinicBilling[]) => (
    <ul className="flex flex-col divide-y overflow-hidden rounded-[1.75rem] border bg-card">
      {list.map((c) => (
        <ClinicPaymentRow key={c.id} clinic={c} month={month} currentMonth={currentMonth} />
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthPicker
          month={monthToDate(month)}
          isCurrent={month === currentMonth}
          onPrevious={() => setSelected(shiftMonth(month, -1))}
          onNext={() => setSelected(shiftMonth(month, 1))}
          onCurrent={() => setSelected(null)}
          nextDisabled={month >= currentMonth}
        />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clínica" aria-label="Buscar clínica" className="pl-9" />
        </div>
      </div>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error.message}
        </div>
      ) : all.length === 0 ? (
        <section className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
            <Building2 className="size-5 text-primary" />
          </span>
          <h2 className="font-display text-3xl tracking-tight">Todavía no hay clínicas</h2>
        </section>
      ) : (
        <div className={cn("flex flex-col gap-8 transition-opacity", isPlaceholderData && "pointer-events-none opacity-50")}>
          {/* The month in euros */}
          <section className="grid gap-3 lg:grid-cols-[2fr_3fr]">
            <div className="flex flex-col gap-3 rounded-[1.5rem] bg-secondary/60 p-5">
              <span className="text-sm text-muted-foreground">Cobrado este mes</span>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-4xl leading-none tracking-tight tabular-nums">{formatPrice(collected)}</span>
                <span className="text-muted-foreground">de {formatPrice(expected)}</span>
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuemin={0} aria-valuemax={expected} aria-valuenow={collected} aria-label="Cobrado del mes">
                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${expected > 0 ? Math.min(100, (collected / expected) * 100) : 0}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {paidList.length} de {owing.length} {owing.length === 1 ? "clínica ha" : "clínicas han"} pagado
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
            <Stat label="Pendiente" value={formatPrice(pendingCents)} note={
                pendingList.length
                  ? `${pendingList.length} ${pendingList.length === 1 ? "clínica" : "clínicas"}${
                      pendingList.some((c) => amountOf(c, month) === null) ? ` (${pendingList.filter((c) => amountOf(c, month) === null).length} sin plan: importe desconocido)` : ""
                    }`
                  : "Todas al día"
              } tone={pendingList.length ? "coral" : "ok"} />
            <Stat label="Atrasado" value={formatPrice(lateCents)} note={lateClinics.length ? `${lateClinics.length} ${lateClinics.length === 1 ? "clínica debe" : "clínicas deben"} meses anteriores` : "Nada de meses anteriores"} tone={lateClinics.length ? "coral" : "ok"} />
            <Stat
              label="Sin plan"
              value={String(noPlan)}
              note={noPlan ? <Link to={paths.adminBilling} className="underline underline-offset-2">Asígnalo en Contratos: sin plan no se sabe cuánto deben</Link> : "Todas con plan"}
              tone={noPlan ? "warn" : "ok"}
            />
            </div>
          </section>

          {clinics.length === 0 && <p className="rounded-[1.75rem] border border-dashed p-8 text-center text-sm text-muted-foreground">Ninguna clínica coincide.</p>}

          {groups.toCollect.length > 0 && (
            <Group title="Por cobrar" count={groups.toCollect.length} extra={pendingCents > 0 ? formatPrice(pendingCents) : undefined}>
              {rows(groups.toCollect)}
            </Group>
          )}
          {groups.collected.length > 0 && (
            <Group title="Cobradas" count={groups.collected.length} extra={collected > 0 ? formatPrice(collected) : undefined}>
              {rows(groups.collected)}
            </Group>
          )}
          {groups.notPaying.length > 0 && (
            <Folded title="No pagan este mes" note="Marcadas como «no tiene que pagar», o aún no existían" count={groups.notPaying.length}>
              {rows(groups.notPaying)}
            </Folded>
          )}
          {groups.inactive.length > 0 && (
            <Folded title="Inactivas" note="No cuentan en los totales; su historial se mantiene" count={groups.inactive.length}>
              {rows(groups.inactive)}
            </Folded>
          )}

          <p className="text-xs text-muted-foreground">
            Importes sin IVA. Cada mes se calcula con los profesionales que tenía la clínica el día 1 (un alta a mitad de mes cuenta desde el
            siguiente) y, al marcarlo pagado, se guarda lo cobrado: cambiar precios después no lo reescribe. Las de pago anual cuentan su parte
            de cada mes. Pulsa un mes del historial para marcarlo pagado o pendiente.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note: ReactNode; tone: "coral" | "warn" | "ok" }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[1.5rem] border bg-card p-3.5 sm:p-5">
      <span className="text-xs text-muted-foreground sm:text-sm">{label}</span>
      <span className={cn("text-lg font-medium tabular-nums sm:text-3xl", tone === "coral" && "text-coral", tone === "warn" && "text-amber-700 dark:text-amber-400")}>{value}</span>
      <span className="hidden text-xs text-muted-foreground sm:block">{note}</span>
    </div>
  );
}

function Group({ title, count, extra, children }: { title: string; count: number; extra?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-baseline gap-2 text-sm font-medium">
        {title}
        <span className="text-muted-foreground tabular-nums">{count}</span>
        {extra && <span className="ml-auto font-normal text-muted-foreground tabular-nums">{extra}</span>}
      </h2>
      {children}
    </section>
  );
}

// Folded by default: what doesn't need attention
function Folded({ title, note, count, children }: { title: string; note: string; count: number; children: ReactNode }) {
  return (
    <details className="group flex flex-col gap-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        {title}
        <span className="text-muted-foreground tabular-nums">{count}</span>
        <span className="hidden text-xs font-normal text-muted-foreground sm:inline">· {note}</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

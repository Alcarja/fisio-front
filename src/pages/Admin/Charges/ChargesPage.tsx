import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CalendarClock,
  Plus,
  Loader2,
  Search,
  Settings,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Bono, ChargeSession, SessionState } from "@/adapters/api";
import {
  useBonos,
  useChargeSessions,
  useMarkSessionOutcome,
  useMe,
  usePendingSessions,
  useRemoveSessionBono,
  useUnwaiveSession,
} from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { chargesManagerAccess, hasAccess, patientsAccess } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import MonthPicker from "../Reports/components/MonthPicker";
import { addMonths, isSameMonth, monthKey, monthRange, startOfMonth } from "../Reports/reportUtils";
import ExportButton from "./components/ExportButton";
import { CancelBonoDialog, PayBonoDialog, SellBonoDialog } from "./components/BonoDialogs";
import BonosView from "./components/BonosView";
import ChargeDialog from "./components/ChargeDialog";
import MovementsView from "./components/MovementsView";
import UseBonoDialog from "./components/UseBonoDialog";
import { CancelManualDialog, ManualSessionDialog } from "./components/ManualSessionDialogs";
import PaymentDialog from "./components/PaymentDialog";
import PendingView from "./components/PendingView";
import { PriceDialog, WaiveDialog } from "./components/SessionEditDialogs";
import SessionsList, { PeopleList, type GroupBy, type SessionActions } from "./components/SessionsList";
import {
  filterSessions,
  isChargeable,
  isOwed,
  formatLongDate,
  formatPrice,
  physiosOf,
  sessionTotals,
  stateInfo,
  stateOrder,
  type SessionFilters,
} from "./chargesUtils";

type Tab = "pending" | "register" | "movements" | "bonos";

// How each list is grouped, remembered in this browser (best effort)
const GROUP_KEY = "charges.groupBy";
function loadGroupBy(): Record<"pending" | "register", GroupBy> {
  const fallback = { pending: "person", register: "day" } as const;
  try {
    const saved = JSON.parse(localStorage.getItem(GROUP_KEY) ?? "{}");
    return {
      pending: saved.pending === "day" || saved.pending === "person" ? saved.pending : fallback.pending,
      register: saved.register === "day" || saved.register === "person" ? saved.register : fallback.register,
    };
  } catch {
    return fallback;
  }
}
const NO_FILTERS: SessionFilters = { physioId: "", state: "", search: "" };

// Cobros of the active clinic (COBROS.md). Two views:
// - Pendientes: who owes what since the start date, and payments to review
// - Registro: every session of a month, with its state
// Owners, admins and reception, "invoicing" feature (router: chargesAccess).
// Backend: /clinic/charges (back/src/routes/charge.routes.ts)
export default function ChargesPage() {
  const { data: me } = useMe();
  const clinicId = me?.activeClinic?.clinicId;
  const isManager = hasAccess(me, chargesManagerAccess);
  const linkPatients = hasAccess(me, patientsAccess);
  const [tab, setTab] = useState<Tab>("pending");
  const [now] = useState(() => new Date());
  const [month, setMonth] = useState(() => startOfMonth(now));
  const [filters, setFilters] = useState<SessionFilters>(NO_FILTERS);

  const range = monthRange(month);
  const monthQuery = useChargeSessions(clinicId, range);
  const pendingQuery = usePendingSessions(clinicId);
  const unwaive = useUnwaiveSession();
  const bonosQuery = useBonos(clinicId);
  const [selling, setSelling] = useState(false);
  const [payingBono, setPayingBono] = useState<Bono | null>(null);
  const [cancellingBono, setCancellingBono] = useState<Bono | null>(null);
  const [viewingPaymentId, setViewingPaymentId] = useState<string | null>(null);
  const [usingBono, setUsingBono] = useState<ChargeSession | null>(null);
  const removeBono = useRemoveSessionBono();
  const markOutcome = useMarkSessionOutcome();
  const [groupBy, setGroupByState] = useState(loadGroupBy);
  const setGroupBy = (list: "pending" | "register", value: GroupBy) =>
    setGroupByState((current) => {
      const next = { ...current, [list]: value };
      try {
        localStorage.setItem(GROUP_KEY, JSON.stringify(next));
      } catch {
        // Not saved: it only lasts this visit
      }
      return next;
    });

  // Selected sessions (to charge together) and the open dialogs
  const [selected, setSelected] = useState<Map<string, ChargeSession>>(new Map());
  const [charging, setCharging] = useState<ChargeSession[] | null>(null);
  const [pricing, setPricing] = useState<ChargeSession | null>(null);
  const [waiving, setWaiving] = useState<ChargeSession | null>(null);
  const [viewing, setViewing] = useState<ChargeSession | null>(null);
  const [adding, setAdding] = useState(false);
  const [cancelling, setCancelling] = useState<ChargeSession | null>(null);

  const selectedIds = [...selected.keys()];
  const actions: SessionActions = {
    selected: new Set(selectedIds),
    onToggle: (s) =>
      setSelected((current) => {
        const next = new Map(current);
        if (next.has(s.id)) next.delete(s.id);
        else next.set(s.id, s);
        return next;
      }),
    onCharge: (s) => setCharging([s]),
    onPrice: setPricing,
    onWaive: setWaiving,
    onPayment: setViewing,
    onCancelManual: setCancelling,
    onUseBono: setUsingBono,
    onRemoveBono: (s) =>
      removeBono.mutate(s.id, {
        onSuccess: () => toast.success("Sesión quitada del bono: vuelve a estar pendiente"),
        onError: (error) => toast.error("No se pudo quitar", { description: error.message }),
      }),
    onOutcome: (s, outcome) =>
      markOutcome.mutate(
        { sessionId: s.id, outcome },
        {
          onSuccess: () =>
            toast.success(outcome === "came" ? "Marcada como realizada" : "Marcada como falta"),
          onError: (error) => toast.error("No se pudo marcar", { description: error.message }),
        },
      ),
    onUnwaive: (s) =>
      unwaive.mutate(s.id, {
        onSuccess: () => toast.success("La sesión vuelve a estar pendiente de cobro"),
        onError: (error) => toast.error("No se pudo deshacer", { description: error.message }),
      }),
  };

  const monthSessions = useMemo(() => monthQuery.data?.sessions ?? [], [monthQuery.data]);
  const pendingSessions = useMemo(() => pendingQuery.data?.sessions ?? [], [pendingQuery.data]);
  const pendingBonos = pendingQuery.data?.bonos ?? [];
  const pendingCount =
    pendingSessions.filter((s) => isOwed(s) || s.state === "review").length + pendingBonos.length;
  // Sessions a payment to review could move to: unpaid ones of this month and
  // everything pending
  const candidates = useMemo(() => {
    const byId = new Map([...pendingSessions, ...monthSessions].map((s) => [s.id, s]));
    return [...byId.values()];
  }, [pendingSessions, monthSessions]);

  // The selection with fresh data: a session paid, waived or cancelled since
  // it was ticked drops out on its own
  const selectedList = [...selected.keys()].flatMap((id) => {
    const fresh = candidates.find((s) => s.id === id) ?? selected.get(id)!;
    return isChargeable(fresh) ? [fresh] : [];
  });
  const startsOn = pendingQuery.data?.settings.startsOn ?? monthQuery.data?.settings.startsOn;
  const selectedTotal = selectedList.reduce((sum, s) => sum + s.priceCents, 0);
  const switchTab = (next: Tab) => {
    setTab(next);
    setSelected(new Map());
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">
          {me?.activeClinic?.clinicName ?? "Clínica"}
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Cobros</h1>
          <div className="flex gap-2">
            {isManager && (
              <Button asChild variant="outline" className="rounded-full">
                <Link to={paths.adminSettingsCharges}>
                  <Settings /> Ajustes
                </Link>
              </Button>
            )}
            <Button variant="outline" className="rounded-full" onClick={() => setAdding(true)} disabled={!startsOn}>
              <Plus /> Añadir sesión
            </Button>
            <Button className="rounded-full" onClick={() => setSelling(true)}>
              <Plus /> Vender bono
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Lo que cobras por cada sesión de la agenda. No son facturas.
        </p>
      </header>

      <div className="flex w-fit gap-1 rounded-full border bg-card p-1" role="tablist">
        {(
          [
            ["pending", "Pendientes", pendingCount],
            ["register", "Sesiones", 0],
            ["movements", "Movimientos", 0],
            ["bonos", "Bonos", 0],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => switchTab(key)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
              tab === key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-medium text-white tabular-nums">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "movements" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthPicker
              month={month}
              isCurrent={isSameMonth(month, now)}
              onPrevious={() => setMonth((m) => addMonths(m, -1))}
              onNext={() => setMonth((m) => addMonths(m, 1))}
              onCurrent={() => setMonth(startOfMonth(now))}
            />
            {isManager && <ExportButton month={monthKey(month)} clinicName={me?.activeClinic?.clinicName ?? "clinica"} />}
          </div>
          <MovementsView month={monthKey(month)} onOpen={setViewingPaymentId} />
        </>
      ) : tab === "bonos" ? (
        bonosQuery.isPending ? (
          <Spinner />
        ) : bonosQuery.error ? (
          <ErrorBox message={bonosQuery.error.message} />
        ) : (
          <BonosView
            bonos={bonosQuery.data}
            linkPatients={linkPatients}
            onSell={() => setSelling(true)}
            actions={{ onPay: setPayingBono, onCancel: setCancellingBono, onPayment: setViewingPaymentId }}
          />
        )
      ) : tab === "pending" ? (
        pendingQuery.isPending ? (
          <Spinner />
        ) : pendingQuery.error ? (
          <ErrorBox message={pendingQuery.error.message} />
        ) : (
          <>
            <PendingSummary
              sessions={pendingSessions}
              bonos={pendingBonos}
              startsOn={pendingQuery.data.settings.startsOn}
            />
            {pendingSessions.some((s) => s.state !== "review") && (
              <GroupToggle value={groupBy.pending} onChange={(v) => setGroupBy("pending", v)} />
            )}
            <PendingView
              groupBy={groupBy.pending}
              sessions={pendingSessions}
              bonos={pendingBonos}
              onPayBono={setPayingBono}
              actions={actions}
              linkPatients={linkPatients}
              onChargeMany={setCharging}
            />
          </>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthPicker
              month={month}
              isCurrent={isSameMonth(month, now)}
              onPrevious={() => setMonth((m) => addMonths(m, -1))}
              onNext={() => setMonth((m) => addMonths(m, 1))}
              onCurrent={() => setMonth(startOfMonth(now))}
            />
            <div className="flex items-center gap-3">
              {monthQuery.isFetching && !monthQuery.isPending && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Cargando" />
              )}
              {isManager && (
                <ExportButton month={monthKey(month)} clinicName={me?.activeClinic?.clinicName ?? "clinica"} />
              )}
            </div>
          </div>
          {monthQuery.isPending ? (
            <Spinner />
          ) : monthQuery.error ? (
            <ErrorBox message={monthQuery.error.message} />
          ) : (
            <Register
              sessions={monthSessions}
              startsOn={monthQuery.data.settings.startsOn}
              range={range}
              filters={filters}
              onFilters={setFilters}
              actions={actions}
              linkPatients={linkPatients}
              isManager={isManager}
              groupBy={groupBy.register}
              onGroupBy={(v) => setGroupBy("register", v)}
              onChargeMany={setCharging}
            />
          )}
        </>
      )}

      {/* Selected sessions: charge them together */}
      {selectedList.length > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-full border bg-card p-2 pl-5 shadow-lg">
          <span className="min-w-0 flex-1 truncate text-sm">
            {selectedList.length} sesi{selectedList.length === 1 ? "ón" : "ones"} ·{" "}
            <strong className="tabular-nums">{formatPrice(selectedTotal)}</strong>
          </span>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Quitar selección" onClick={() => setSelected(new Map())}>
            <X />
          </Button>
          <Button className="rounded-full" onClick={() => setCharging(selectedList)}>
            Cobrar
          </Button>
        </div>
      )}

      <ChargeDialog
        sessions={charging}
        onClose={() => setCharging(null)}
        onCharged={() => setSelected(new Map())}
      />
      <PriceDialog session={pricing} onClose={() => setPricing(null)} />
      <WaiveDialog session={waiving} onClose={() => setWaiving(null)} />
      <PaymentDialog
        session={viewing}
        paymentId={viewingPaymentId}
        candidates={candidates}
        onClose={() => {
          setViewing(null);
          setViewingPaymentId(null);
        }}
      />
      <SellBonoDialog open={selling} onClose={() => setSelling(false)} />
      <PayBonoDialog bono={payingBono} onClose={() => setPayingBono(null)} />
      <CancelBonoDialog bono={cancellingBono} onClose={() => setCancellingBono(null)} />
      <UseBonoDialog session={usingBono} onClose={() => setUsingBono(null)} onSell={() => setSelling(true)} />
      {startsOn && (
        <ManualSessionDialog
          open={adding}
          onClose={() => setAdding(false)}
          startsOn={startsOn}
          onChargeNow={(s) => setCharging([s])}
        />
      )}
      <CancelManualDialog session={cancelling} onClose={() => setCancelling(null)} />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}

function PendingSummary({ sessions, bonos, startsOn }: { sessions: ChargeSession[]; bonos: Bono[]; startsOn: string }) {
  const t = sessionTotals(sessions);
  const bonoCents = bonos.reduce((sum, b) => sum + b.priceCents, 0);
  const owed = sessions.filter(isOwed).length;
  const parts = [
    owed > 0 ? `${owed} sesi${owed === 1 ? "ón" : "ones"}` : null,
    bonos.length > 0 ? `${bonos.length} bono${bonos.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return (
    <div className="flex flex-col gap-3">
      <Tiles
        tiles={[
          {
            icon: Wallet,
            label: "Pendiente de cobro",
            value: formatPrice(t.pendingCents + t.toConfirmCents + bonoCents),
            detail: parts.length ? parts.join(" y ") : "Nada",
            accent: owed + bonos.length > 0,
          },
          {
            icon: CircleHelp,
            label: "Sin marcar",
            value: String(t.toConfirm),
            detail: "Ya pasaron: al cobrarlas quedan como realizadas",
          },
        ]}
        className="lg:grid-cols-2"
      />
      <p className="px-1 text-xs text-muted-foreground">Desde el {formatLongDate(startsOn)}.</p>
    </div>
  );
}

function Register({
  sessions,
  startsOn,
  range,
  filters,
  onFilters,
  actions,
  linkPatients,
  isManager,
  groupBy,
  onGroupBy,
  onChargeMany,
}: {
  groupBy: GroupBy;
  onGroupBy: (value: GroupBy) => void;
  onChargeMany: (sessions: ChargeSession[]) => void;
  sessions: ChargeSession[];
  startsOn: string;
  range: { from: string; to: string };
  filters: SessionFilters;
  onFilters: (f: SessionFilters) => void;
  actions: SessionActions;
  linkPatients: boolean;
  isManager: boolean;
}) {
  const physios = useMemo(() => physiosOf(sessions), [sessions]);
  const totals = useMemo(() => sessionTotals(sessions), [sessions]);
  const owedCount = sessions.filter(isOwed).length;
  const visible = useMemo(() => filterSessions(sessions, filters), [sessions, filters]);
  const filtering = !!(filters.physioId || filters.state || filters.search.trim());
  const beforeStart = range.to < startsOn;

  return (
    <>
      <Tiles
        tiles={[
          {
            icon: Wallet,
            label: "Pendiente de cobro",
            // Unmarked sessions count: charging them marks them as done
            value: formatPrice(totals.pendingCents + totals.toConfirmCents),
            detail: `${owedCount} sesi${owedCount === 1 ? "ón" : "ones"}`,
            accent: owedCount > 0,
          },
          {
            icon: CircleCheck,
            label: "Sesiones cobradas",
            value: formatPrice(totals.paidCents),
            detail: `${totals.paid} cobrada${totals.paid === 1 ? "" : "s"}${totals.withBono ? ` · ${totals.withBono} con bono` : ""}`,
          },
          {
            icon: CircleHelp,
            label: "Sin marcar",
            value: String(totals.toConfirm),
            detail: "Ya pasaron: cóbralas o marca si vino",
          },
          {
            icon: CalendarClock,
            label: "Próximas",
            value: String(totals.upcoming),
            detail: "Lo que queda del mes",
          },
        ]}
      />

      {startsOn > range.from && (
        <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
          Las sesiones cuentan desde el {formatLongDate(startsOn)}
          {beforeStart ? ": este mes no tiene ninguna." : ". Las anteriores no aparecen."}
          {isManager && (
            <>
              {" "}
              <Link to={paths.adminSettingsCharges} className="text-foreground underline underline-offset-4">
                Cambiar
              </Link>
            </>
          )}
        </p>
      )}

      {sessions.length > 0 && (
        <div className="flex flex-col gap-3">
          <Filters filters={filters} onChange={onFilters} physios={physios} />
          <GroupToggle value={groupBy} onChange={onGroupBy} />
        </div>
      )}

      {visible.length > 0 ? (
        groupBy === "person" ? (
          <PeopleList
            sessions={visible}
            actions={actions}
            linkPatients={linkPatients}
            onChargeMany={onChargeMany}
            order="name"
          />
        ) : (
          <SessionsList sessions={visible} actions={actions} linkPatients={linkPatients} />
        )
      ) : (
        !beforeStart && (
          <div className="flex flex-col items-center gap-2 rounded-[1.75rem] border bg-card px-6 py-14 text-center">
            <Wallet className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filtering ? "Ninguna sesión coincide con los filtros." : "No hay sesiones este mes."}
            </p>
            {filtering && (
              <Button variant="ghost" className="rounded-full" onClick={() => onFilters(NO_FILTERS)}>
                Quitar filtros
              </Button>
            )}
          </div>
        )
      )}
    </>
  );
}

// "Por persona" / "Por día"
function GroupToggle({ value, onChange }: { value: GroupBy; onChange: (value: GroupBy) => void }) {
  return (
    <div className="flex w-fit gap-1 rounded-full border bg-card p-1 text-sm" role="radiogroup" aria-label="Agrupar">
      {(
        [
          ["person", "Por persona"],
          ["day", "Por día"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors",
            value === key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type Tile = { icon: LucideIcon; label: string; value: string; detail: string; accent?: boolean };

function Tiles({ tiles, className }: { tiles: Tile[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {tiles.map(({ icon: Icon, label, value, detail, accent }) => (
        <div key={label} className="flex flex-col gap-1 rounded-[1.5rem] border bg-card p-4 sm:p-5">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className={accent ? "size-4 text-coral" : "size-4 text-primary"} aria-hidden />
            {label}
          </dt>
          <dd className="text-2xl font-medium tracking-tight sm:text-3xl">{value}</dd>
          <dd className="text-xs text-muted-foreground">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function Filters({
  filters,
  onChange,
  physios,
}: {
  filters: SessionFilters;
  onChange: (filters: SessionFilters) => void;
  physios: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar paciente"
          placeholder="Buscar paciente"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>
      <NativeSelect
        aria-label="Estado"
        value={filters.state}
        onChange={(e) => onChange({ ...filters, state: e.target.value as SessionState | "" })}
        className="w-full sm:w-52"
      >
        <NativeSelectOption value="">Todos los estados</NativeSelectOption>
        {stateOrder.map((state) => (
          <NativeSelectOption key={state} value={state}>
            {stateInfo[state].label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {physios.length > 1 && (
        <NativeSelect
          aria-label="Fisio"
          value={filters.physioId}
          onChange={(e) => onChange({ ...filters, physioId: e.target.value })}
          className="w-full sm:w-52"
        >
          <NativeSelectOption value="">Todos los fisios</NativeSelectOption>
          {physios.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}
    </div>
  );
}

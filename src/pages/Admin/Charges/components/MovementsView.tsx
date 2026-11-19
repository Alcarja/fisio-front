import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CircleAlert, Loader2, Wallet } from "lucide-react";
import type { Movement, PaymentMethod } from "@/adapters/api";
import { useMe, useMovements } from "@/adapters/hook";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatDay, formatPrice, formatTime, methodLabels, methodOrder } from "../chargesUtils";

type Props = {
  month: string; // "YYYY-MM"
  // Opens a payment (refunds open the payment they gave back)
  onOpen: (paymentId: string) => void;
};

type GroupBy = "day" | "person";

const kindLabel: Record<Movement["kind"], string> = { sessions: "Sesiones", bono: "Bono", refund: "Devolución" };

// Movimientos: all the money of a month (payments of sessions, bonos sold,
// refunds), grouped by day or by patient. The same rows as the accountant's
// CSV. Sessions paid with a bono don't appear: their money came in when the
// bono was sold
export default function MovementsView({ month, onOpen }: Props) {
  const { data: me } = useMe();
  const [showVoided, setShowVoided] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const { data, isPending, error, isFetching } = useMovements(me?.activeClinic?.clinicId, month, showVoided);

  const groups = useMemo(() => {
    const map = new Map<string, { title: string; items: Movement[] }>();
    for (const m of data?.movements ?? []) {
      const key = groupBy === "day" ? m.day : (m.patientId ?? `name:${m.payer}`);
      const title = groupBy === "day" ? formatDay(m.day) : m.payer;
      map.set(key, { title, items: [...(map.get(key)?.items ?? []), m] });
    }
    const list = [...map].map(([key, g]) => ({
      key,
      ...g,
      net: g.items.filter((m) => !m.voided).reduce((t, m) => t + m.amountCents, 0),
    }));
    return groupBy === "day"
      ? list.sort((a, b) => b.key.localeCompare(a.key)).map((g) => ({ ...g, items: [...g.items].reverse() }))
      : list.sort((a, b) => b.net - a.net || a.title.localeCompare(b.title, "es"));
  }, [data, groupBy]);

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        {error.message}
      </div>
    );
  }

  const t = data.totals;
  const methods = methodOrder.filter((m) => t.byMethod[m]);

  return (
    <div className={cn("flex flex-col gap-6 transition-opacity", isFetching && "opacity-60")}>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={ArrowDownLeft} label="Cobrado" value={formatPrice(t.charged)} detail="Sesiones y bonos" />
        <Tile icon={ArrowUpRight} label="Devuelto" value={formatPrice(Math.abs(t.refunded))} detail="Sale de la caja" />
        <Tile icon={Wallet} label="Neto del mes" value={formatPrice(t.net)} detail="Cobrado menos devuelto" accent />
        <div className="flex flex-col gap-1 rounded-[1.5rem] border bg-card p-4 sm:p-5">
          <dt className="text-sm text-muted-foreground">Por forma de pago</dt>
          {methods.length === 0 ? (
            <dd className="text-sm text-muted-foreground">—</dd>
          ) : (
            methods.map((m: PaymentMethod) => (
              <dd key={m} className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{methodLabels[m]}</span>
                <span className="tabular-nums">{formatPrice(t.byMethod[m] ?? 0)}</span>
              </dd>
            ))
          )}
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border bg-card p-1 text-sm">
          {(
            [
              ["day", "Por día"],
              ["person", "Por paciente"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setGroupBy(value)}
              aria-pressed={groupBy === value}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                groupBy === value ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={showVoided} onCheckedChange={(v) => setShowVoided(v === true)} />
          Ver anulados
        </label>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[1.75rem] border bg-card px-6 py-14 text-center">
          <Wallet className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hay cobros este mes.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.key} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between px-1">
                <h3 className="text-sm font-medium text-muted-foreground first-letter:uppercase">{g.title}</h3>
                <span className="text-sm font-medium tabular-nums">{formatPrice(g.net)}</span>
              </div>
              <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card">
                {g.items.map((m) => (
                  <MovementRow key={m.id} movement={m} showDate={groupBy === "person"} onOpen={onOpen} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[1.5rem] border bg-card p-4 sm:p-5">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={accent ? "size-4 text-coral" : "size-4 text-primary"} aria-hidden />
        {label}
      </dt>
      <dd className="text-2xl font-medium tracking-tight sm:text-3xl">{value}</dd>
      <dd className="text-xs text-muted-foreground">{detail}</dd>
    </div>
  );
}

function MovementRow({
  movement: m,
  showDate,
  onOpen,
}: {
  movement: Movement;
  showDate: boolean;
  onOpen: (paymentId: string) => void;
}) {
  const refund = m.kind === "refund";
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(m.refundOfId ?? m.id)}
        className={cn(
          "grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/50 md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.6fr)_7rem_6.5rem]",
          m.voided && "opacity-50",
        )}
      >
        <span className="text-sm tabular-nums text-muted-foreground">
          {showDate ? m.day.slice(8, 10) + "/" + m.day.slice(5, 7) : formatTime(m.paidAt)}
        </span>
        <span className={cn("truncate font-medium", m.voided && "line-through")}>
          {showDate ? (m.kind === "refund" ? "Devolución" : m.kind === "bono" ? "Bono" : "Sesiones") : m.payer}
        </span>
        <span className="col-start-2 row-start-2 truncate text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:text-sm">
          {!showDate && <span className="mr-1.5 rounded-full border px-1.5 py-px text-[11px]">{kindLabel[m.kind]}</span>}
          {m.concept}
          {m.voided ? ` · Anulado: ${m.voided.reason ?? ""}` : ""}
        </span>
        <span className="hidden truncate text-sm text-muted-foreground md:block">
          {methodLabels[m.method]}
          {m.recordedByName ? ` · ${m.recordedByName}` : ""}
        </span>
        <span
          className={cn(
            "col-start-3 row-span-2 row-start-1 text-right tabular-nums md:col-start-auto md:row-span-1 md:row-start-auto",
            refund && "text-destructive",
            m.voided && "line-through",
          )}
        >
          {formatPrice(m.amountCents)}
        </span>
      </button>
    </li>
  );
}

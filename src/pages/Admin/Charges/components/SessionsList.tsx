import { generatePath, Link } from "react-router";
import { MoreHorizontal } from "lucide-react";
import type { ChargeSession } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import {
  formatDay,
  formatPrice,
  formatShortDay,
  formatTime,
  groupByDay,
  groupByPerson,
  isChargeable,
  isEditable,
  methodLabels,
  stateInfo,
} from "../chargesUtils";

// What can be done with a session, wired by the page
export type SessionActions = {
  selected: Set<string>;
  onToggle: (session: ChargeSession) => void;
  onCharge: (session: ChargeSession) => void;
  onPrice: (session: ChargeSession) => void;
  onWaive: (session: ChargeSession) => void;
  onUnwaive: (session: ChargeSession) => void;
  onPayment: (session: ChargeSession) => void;
  onCancelManual: (session: ChargeSession) => void;
  onUseBono: (session: ChargeSession) => void;
  onRemoveBono: (session: ChargeSession) => void;
  // Came / didn't come, for a calendar session nobody marked
  onOutcome: (session: ChargeSession, outcome: "came" | "no_show") => void;
};

// How a list of sessions is grouped
export type GroupBy = "person" | "day";

type Props = {
  sessions: ChargeSession[];
  actions: SessionActions;
  // Patient names link to their ficha (clinics with Pacientes)
  linkPatients: boolean;
};

// Sessions grouped by day (most recent first)
export default function SessionsList({ sessions, actions, linkPatients }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {groupByDay(sessions).map(({ day, sessions: list }) => (
        <section key={day} className="flex flex-col gap-2">
          <h3 className="px-1 text-sm font-medium text-muted-foreground first-letter:uppercase">
            {formatDay(day)}
          </h3>
          <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card">
            {list.map((s) => (
              <SessionRow key={s.id} session={s} actions={actions} linkPatients={linkPatients} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// Sessions grouped by person, each with a button that charges what they owe
// (`owes`). Rows show the date instead of the person
export function PeopleList({
  sessions,
  actions,
  linkPatients,
  onChargeMany,
  owes,
  order,
}: Props & {
  onChargeMany: (sessions: ChargeSession[]) => void;
  owes?: (s: ChargeSession) => boolean;
  order?: "owed" | "name";
}) {
  return (
    <div className="flex flex-col gap-6">
      {groupByPerson(sessions, { owes, order }).map((person) => (
        <section key={person.key} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h3 className="font-medium">
              {linkPatients && person.patientId ? (
                <Link
                  to={generatePath(paths.adminPatient, { patientId: person.patientId })}
                  className="underline-offset-4 hover:underline"
                >
                  {person.name}
                </Link>
              ) : (
                person.name
              )}
              {!person.patientId && <span className="ml-2 text-xs font-normal text-muted-foreground">sin ficha</span>}
            </h3>
            {person.owed.length > 0 && (
              <Button size="sm" className="rounded-full" onClick={() => onChargeMany(person.owed)}>
                Cobrar {formatPrice(person.owedCents)}
              </Button>
            )}
          </div>
          <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card">
            {person.sessions.map((s) => (
              <SessionRow key={s.id} session={s} actions={actions} linkPatients={linkPatients} showDate hidePatient />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// One session: tick box (if it can be charged), time or date, patient,
// service, physio, price, state and its menu. A table row on wide screens,
// stacked on phones. `showDate`: the pending view mixes days
export function SessionRow({
  session: s,
  actions,
  linkPatients,
  showDate = false,
  hidePatient = false,
}: {
  session: ChargeSession;
  actions: SessionActions;
  linkPatients: boolean;
  showDate?: boolean;
  hidePatient?: boolean;
}) {
  const state = stateInfo[s.state];
  const name = `${s.firstName} ${s.lastName}`;
  const chargeable = isChargeable(s);
  const checked = actions.selected.has(s.id);
  const when = showDate ? formatShortDay(s.startsAt) : formatTime(s.startsAt);
  const detail =
    s.state === "paid" && s.payment
      ? methodLabels[s.payment.method]
      : s.state === "waived"
        ? s.waivedReason
        : s.state === "bono"
          ? s.bono?.name
          : s.bonoProblem
            ? `${s.bono?.name}: ${s.bonoProblem}`
            : null;

  return (
    <li
      className={cn(
        "grid grid-cols-[1.25rem_5.25rem_1fr_auto_2rem] items-center gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[1.25rem_5.25rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_5.5rem_10rem_2rem]",
        checked && "bg-secondary/50",
      )}
    >
      {chargeable ? (
        <Checkbox
          checked={checked}
          onCheckedChange={() => actions.onToggle(s)}
          aria-label={`Seleccionar la sesión de ${name}`}
        />
      ) : (
        <span />
      )}
      <span className="text-sm whitespace-nowrap tabular-nums text-muted-foreground first-letter:uppercase">{when}</span>

      <div className="flex min-w-0 flex-col">
        {hidePatient ? (
          <span className="truncate text-sm">{s.serviceName}</span>
        ) : linkPatients && s.patientId ? (
          <Link
            to={generatePath(paths.adminPatient, { patientId: s.patientId })}
            className="truncate font-medium underline-offset-4 hover:underline"
          >
            {name}
          </Link>
        ) : (
          <span className="truncate font-medium">{name}</span>
        )}
        {s.source === "manual" && (
          <span className="w-fit truncate text-xs text-muted-foreground" title={s.note ?? undefined}>
            Fuera de agenda{s.note ? ` · ${s.note}` : ""}
          </span>
        )}
        {/* Phones: service and physio under the name */}
        <span className="truncate text-xs text-muted-foreground md:hidden">
          {hidePatient ? s.physioName : `${s.serviceName} · ${s.physioName ?? "—"}`}
        </span>
      </div>

      <span className="hidden min-w-0 items-center gap-2 text-sm md:flex">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.serviceColor }} />
        <span className="truncate">{hidePatient ? (s.physioName ?? "—") : s.serviceName}</span>
        {s.isGroup && !hidePatient && <span className="shrink-0 text-xs text-muted-foreground">grupo</span>}
      </span>
      <span className="hidden truncate text-sm text-muted-foreground md:block">
        {hidePatient ? "" : (s.physioName ?? "—")}
      </span>

      <span
        className={cn("text-right text-sm tabular-nums", s.priceChanged && "underline decoration-dotted underline-offset-4")}
        title={s.priceChanged ? "Precio cambiado para esta sesión" : undefined}
      >
        {formatPrice(s.priceCents)}
      </span>

      <div className="col-start-3 flex min-w-0 flex-wrap items-center gap-1.5 md:col-start-auto md:justify-end">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
            state.className,
          )}
        >
          {state.label}
        </span>
        {detail && <span className="max-w-[9rem] truncate text-xs text-muted-foreground" title={detail}>{detail}</span>}
      </div>

      <SessionMenu session={s} actions={actions} />
    </li>
  );
}

function SessionMenu({ session: s, actions }: { session: ChargeSession; actions: SessionActions }) {
  const chargeable = isChargeable(s);
  const editable = isEditable(s);
  const hasPayment = (s.state === "paid" || s.state === "review") && !!s.payment;
  const waived = s.state === "waived";
  const cancellable = s.source === "manual" && s.state !== "review";
  // Also a session its bono no longer covers (to review): take it off
  const withBono = !!s.bono && (s.state === "bono" || s.state === "review");
  const unmarked = s.state === "to_confirm" && s.source === "calendar" && !!s.appointmentPatientId;
  if (!chargeable && !editable && !hasPayment && !waived && !cancellable && !withBono && !unmarked) {
    return <span />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={s.state === "review" ? "outline" : "ghost"}
          size="icon"
          className="size-8 rounded-full row-start-1 col-start-5 md:col-start-auto md:row-start-auto"
          aria-label={`Acciones de la sesión de ${s.firstName}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {chargeable && <DropdownMenuItem onSelect={() => actions.onCharge(s)}>Cobrar</DropdownMenuItem>}
        {chargeable && <DropdownMenuItem onSelect={() => actions.onUseBono(s)}>Pagar con bono</DropdownMenuItem>}
        {unmarked && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => actions.onOutcome(s, "came")}>Vino (cobrar más tarde)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onOutcome(s, "no_show")}>No vino</DropdownMenuItem>
          </>
        )}
        {withBono && (
          <DropdownMenuItem onSelect={() => actions.onRemoveBono(s)}>Quitar del bono «{s.bono?.name}»</DropdownMenuItem>
        )}
        {hasPayment && (
          <DropdownMenuItem onSelect={() => actions.onPayment(s)}>
            {s.state === "review" ? "Resolver cobro" : "Ver cobro"}
          </DropdownMenuItem>
        )}
        {editable && (
          <>
            {chargeable && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => actions.onPrice(s)}>Cambiar precio</DropdownMenuItem>
            {s.state !== "free" && (
              <DropdownMenuItem onSelect={() => actions.onWaive(s)}>No cobrar esta sesión</DropdownMenuItem>
            )}
          </>
        )}
        {waived && <DropdownMenuItem onSelect={() => actions.onUnwaive(s)}>Volver a cobrarla</DropdownMenuItem>}
        {cancellable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => actions.onCancelManual(s)}>
              Anular sesión
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

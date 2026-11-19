import { CircleCheck, TriangleAlert } from "lucide-react";
import type { Bono, ChargeSession } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import { bonoValidity, formatPrice, isChargeable } from "../chargesUtils";
import SessionsList, { PeopleList, SessionRow, type GroupBy, type SessionActions } from "./SessionsList";

type Props = {
  // pending, to_confirm and review since the start date, and today's still to come
  sessions: ChargeSession[];
  bonos: Bono[]; // sold as pending
  onPayBono: (bono: Bono) => void;
  actions: SessionActions;
  linkPatients: boolean;
  onChargeMany: (sessions: ChargeSession[]) => void;
  groupBy: GroupBy;
};

// Who owes what, by person (whoever owes most first) or by day. Sessions nobody
// marked count too: charging them marks them as done. Payments to review go on
// top, apart
export default function PendingView({ sessions, bonos, onPayBono, actions, linkPatients, onChargeMany, groupBy }: Props) {
  const review = sessions.filter((s) => s.state === "review");
  const toCharge = sessions.filter((s) => s.state !== "review");

  if (sessions.length === 0 && bonos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[1.75rem] border bg-card px-6 py-14 text-center">
        <CircleCheck className="size-6 text-primary" />
        <p className="font-medium">Todo cobrado</p>
        <p className="text-sm text-muted-foreground">No hay sesiones pendientes de cobro ni sin marcar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {review.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 px-1 text-sm font-medium text-destructive">
            <TriangleAlert className="size-4" />
            Cobros a revisar
          </h3>
          <p className="px-1 text-sm text-muted-foreground">
            Sesiones pagadas cuya cita se canceló o en la que el paciente ya no está (pasa el cobro a otra sesión o
            devuélvelo), y sesiones con bono que el bono ya no cubre porque la cita cambió (quítalas del bono: vuelven a
            estar pendientes).
          </p>
          <ul className="divide-y overflow-hidden rounded-[1.5rem] border border-destructive/30 bg-card">
            {review.map((s) => (
              <SessionRow key={s.id} session={s} actions={actions} linkPatients={linkPatients} showDate />
            ))}
          </ul>
        </section>
      )}

      {bonos.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="px-1 font-medium">Bonos sin cobrar</h3>
          <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card">
            {bonos.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {b.firstName} {b.lastName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {b.name} · {bonoValidity(b)}
                  </span>
                </div>
                <Button size="sm" className="rounded-full" onClick={() => onPayBono(b)}>
                  Cobrar {formatPrice(b.priceCents)}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {groupBy === "person" ? (
        <PeopleList
          sessions={toCharge}
          actions={actions}
          linkPatients={linkPatients}
          onChargeMany={onChargeMany}
          owes={isChargeable}
        />
      ) : (
        <SessionsList sessions={toCharge} actions={actions} linkPatients={linkPatients} />
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { generatePath, Link } from "react-router";
import { MoreHorizontal, Search, Ticket } from "lucide-react";
import type { Bono } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { bonoBalance, bonoStatusInfo, bonoValidity, formatPrice, methodLabels } from "../chargesUtils";

export type BonoActions = {
  onPay: (bono: Bono) => void;
  onCancel: (bono: Bono) => void;
  onPayment: (paymentId: string) => void;
};

const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// The bonos sold: in use first (active and upcoming), then the rest
export default function BonosView({
  bonos,
  actions,
  linkPatients,
  onSell,
}: {
  bonos: Bono[];
  actions: BonoActions;
  linkPatients: boolean;
  onSell: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const visible = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    return bonos.filter(
      (b) =>
        (showAll || b.status === "active" || b.status === "upcoming") &&
        words.every((w) => normalize(`${b.firstName} ${b.lastName} ${b.name}`).includes(w)),
    );
  }, [bonos, showAll, search]);
  const unpaid = bonos.filter((b) => !b.payment && b.status !== "cancelled").length;

  if (bonos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border bg-card px-6 py-14 text-center">
        <Ticket className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Todavía no has vendido ningún bono.</p>
        <Button className="rounded-full" onClick={onSell}>
          Vender bono
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar bono o paciente"
            placeholder="Buscar paciente o bono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {unpaid > 0 && <span className="text-muted-foreground">{unpaid} sin cobrar</span>}
          <div className="flex gap-1 rounded-full border bg-card p-1">
            {(
              [
                [false, "En uso"],
                [true, "Todos"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                onClick={() => setShowAll(value)}
                aria-pressed={showAll === value}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  showAll === value ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[1.5rem] border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {search ? "Ningún bono coincide con la búsqueda." : "No hay bonos en uso."}
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-[1.5rem] border bg-card">
          {visible.map((b) => (
            <BonoRow key={b.id} bono={b} actions={actions} linkPatients={linkPatients} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BonoRow({ bono: b, actions, linkPatients }: { bono: Bono; actions: BonoActions; linkPatients: boolean }) {
  const status = bonoStatusInfo[b.status];
  const name = `${b.firstName} ${b.lastName}`;
  const cancelled = b.status === "cancelled";
  return (
    <li className={cn("grid grid-cols-[1fr_auto_2rem] items-center gap-x-4 gap-y-1.5 px-4 py-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_6rem_11rem_2rem]", cancelled && "opacity-60")}>
      <div className="flex min-w-0 flex-col">
        {linkPatients && b.patientId ? (
          <Link to={generatePath(paths.adminPatient, { patientId: b.patientId })} className="truncate font-medium underline-offset-4 hover:underline">
            {name}
          </Link>
        ) : (
          <span className="truncate font-medium">{name}</span>
        )}
        <span className="truncate text-xs text-muted-foreground">{b.patientId ? "" : `Sin ficha · ${b.contact ?? ""}`}</span>
      </div>
      <div className="col-span-2 col-start-1 row-start-2 flex min-w-0 flex-col md:col-span-1 md:col-start-auto md:row-start-auto">
        <span className="truncate text-sm">{b.name}</span>
        <span className="truncate text-xs text-muted-foreground">{b.serviceName} · {bonoBalance(b)}</span>
      </div>
      <span className="hidden text-sm text-muted-foreground md:block">{bonoValidity(b)}</span>
      <span className="col-start-2 row-start-1 text-right text-sm tabular-nums md:col-start-auto md:row-start-auto">
        {formatPrice(b.priceCents)}
      </span>
      <div className="col-span-2 col-start-1 row-start-3 flex flex-wrap gap-1.5 md:col-span-1 md:col-start-auto md:row-start-auto md:justify-end">
        <span className={cn("inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium", status.className)}>
          {status.label}
        </span>
        {!cancelled &&
          (b.payment ? (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              {methodLabels[b.payment.method]}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-coral/15 px-2.5 py-0.5 text-xs font-medium">Sin cobrar</span>
          ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="col-start-3 row-start-1 size-8 rounded-full md:col-start-auto md:row-start-auto" aria-label={`Acciones del bono de ${b.firstName}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!b.payment && !cancelled && <DropdownMenuItem onSelect={() => actions.onPay(b)}>Cobrar</DropdownMenuItem>}
          {b.payment && <DropdownMenuItem onSelect={() => actions.onPayment(b.payment!.id)}>Ver cobro</DropdownMenuItem>}
          {!cancelled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => actions.onCancel(b)}>
                Anular bono
              </DropdownMenuItem>
            </>
          )}
          {cancelled && <DropdownMenuItem disabled>Anulado: {b.cancelReason}</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

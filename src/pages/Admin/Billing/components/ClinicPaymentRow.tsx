import { generatePath, Link } from "react-router";
import { BadgeCheck, Check, CheckCheck, CircleSlash, Ellipsis, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicBilling } from "@/adapters/api";
import { useSetBillingExempt, useSetPayment, useSetPayments } from "@/adapters/hook";
import ClinicAvatar from "@/components/ClinicAvatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { formatPrice } from "../../Settings/Services/serviceFormat";
import { allUnpaid, amountOf, formatDay, formatShortMonth, overdue, stateOf } from "../billingUtils";
import PaymentHistory from "./PaymentHistory";

type Props = { clinic: ClinicBilling; month: string; currentMonth: string };

// One clinic in the selected month: what it pays, whether it paid, what it
// owes from before, and its last 12 months (each one clickable). Every change
// can be undone from the toast
export default function ClinicPaymentRow({ clinic, month, currentMonth }: Props) {
  const setPayment = useSetPayment();
  const setPayments = useSetPayments();
  const setExempt = useSetBillingExempt();
  const busy = setPayment.isPending || setPayments.isPending;
  const state = stateOf(clinic, month);
  const amount = amountOf(clinic, month);
  const late = overdue(clinic, month);
  const unpaid = allUnpaid(clinic, month);
  const clinicPath = generatePath(paths.adminClinic, { clinicId: clinic.id });

  const changeMonth = (m: string, paid: boolean, undo = true) =>
    setPayment.mutate(
      { clinicId: clinic.id, month: m, paid },
      {
        onSuccess: () => {
          if (!undo) return;
          toast.success(`${clinic.name}: ${formatShortMonth(m)} ${paid ? "pagado" : "pendiente"}`, {
            action: { label: "Deshacer", onClick: () => changeMonth(m, !paid, false) },
          });
        },
        onError: (error) => toast.error("No se pudo guardar", { description: error.message }),
      },
    );

  const payAll = () =>
    setPayments.mutate(
      { clinicId: clinic.id, months: unpaid, paid: true },
      {
        onSuccess: () =>
          toast.success(`${clinic.name}: ${unpaid.length} ${unpaid.length === 1 ? "mes pagado" : "meses pagados"}`, {
            description: unpaid.every((m) => amountOf(clinic, m) !== null)
              ? `${formatPrice(unpaid.reduce((n, m) => n + (amountOf(clinic, m) ?? 0), 0))} en total`
              : undefined,
            action: {
              label: "Deshacer",
              onClick: () => setPayments.mutate({ clinicId: clinic.id, months: unpaid, paid: false }),
            },
          }),
        onError: (error) => toast.error("No se pudieron guardar todos", { description: error.message }),
      },
    );

  const changeExempt = (exempt: boolean) =>
    setExempt.mutate(
      { clinicId: clinic.id, exempt },
      {
        onSuccess: () => toast.success(exempt ? `${clinic.name} ya no tiene que pagar` : `${clinic.name} vuelve a pagar`),
        onError: (error) => toast.error("No se pudo guardar", { description: error.message }),
      },
    );

  const status =
    state === "paid"
      ? clinic.payment
        ? `Pagado el ${formatDay(clinic.payment.paidAt)}${clinic.payment.recordedByName ? ` · marcó ${clinic.payment.recordedByName}` : ""}`
        : "Pagado"
      : state === "exempt"
        ? "No tiene que pagar"
        : state === "notYet"
          ? "Aún no existía este mes"
          : "Pendiente de pago";

  return (
    <li className={cn("flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4", (state === "exempt" || state === "notYet" || clinic.status === "inactive") && "bg-muted/30")}>
      <ClinicAvatar clinicId={clinic.id} name={clinic.name} />

      <div className="flex min-w-0 flex-1 basis-[calc(100%-4rem)] flex-col gap-0.5 lg:basis-0">
        <Link to={clinicPath} className="truncate text-sm font-medium hover:underline">
          {clinic.name}
        </Link>
        <span className="truncate text-xs text-muted-foreground">
          {clinic.contract?.planName ? (
            <>
              {clinic.contract.planName}
              {clinic.contract.cycle === "annual" ? ` · anual, ${formatPrice(clinic.contract.periodCents)}/año` : ""}
              {/* Phones: the amount (wider screens have its own column) */}
              {amount !== null && clinic.contract.cycle !== "annual" && <span className="sm:hidden"> · {formatPrice(amount)}/mes</span>}
            </>
          ) : clinic.exempt ? (
            "Sin plan"
          ) : (
            <Link to={clinicPath} className="font-medium text-amber-700 hover:underline dark:text-amber-400">
              Sin plan · asignar plan
            </Link>
          )}
        </span>
        <span className={cn("truncate text-xs", state === "pending" ? "font-medium text-coral" : "text-muted-foreground")}>
          {status}
          {clinic.upcoming && month === currentMonth && (
            <span className="font-medium text-amber-700 dark:text-amber-400">
              {" "}
              · desde el mes que viene {formatPrice(clinic.upcoming.monthlyCents)} ({clinic.upcoming.professionals} prof.)
            </span>
          )}
          {late.months.length > 0 && !clinic.exempt && (
            <span className="font-medium text-coral">
              {" "}
              · {late.months.length} {late.months.length === 1 ? "mes atrasado" : "meses atrasados"}
              {late.cents !== null && ` (${formatPrice(late.cents)})`}
            </span>
          )}
        </span>
      </div>

      {/* Under the name until there's room for it in its own column */}
      <div className="w-full sm:ml-14 sm:w-auto lg:ml-0">
        <PaymentHistory clinic={clinic} month={month} currentMonth={currentMonth} busy={busy} onToggle={(m, paid) => changeMonth(m, paid)} />
      </div>

      {/* What this month is worth */}
      <div className="hidden w-24 flex-col items-end sm:flex">
        {amount !== null && state !== "exempt" && state !== "notYet" ? (
          <>
            <span className={cn("text-sm font-medium tabular-nums", state === "paid" && "text-muted-foreground")}>{formatPrice(amount)}</span>
            <span className="text-[11px] text-muted-foreground">{clinic.contract?.cycle === "annual" ? "parte del mes" : "este mes"}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {(state === "pending" || state === "paid") && (
          <Button
            type="button"
            size="sm"
            variant={state === "paid" ? "secondary" : "default"}
            aria-pressed={state === "paid"}
            disabled={busy}
            onClick={() => changeMonth(month, state !== "paid")}
            className={cn("h-9 w-36 rounded-full", state === "paid" && "text-primary hover:bg-secondary/70")}
            title={state === "paid" ? "Volver a dejarlo pendiente" : undefined}
          >
            {setPayment.isPending ? <Loader2 className="animate-spin" /> : state === "paid" ? <Check /> : null}
            {state === "paid" ? "Pagado" : "Marcar pagado"}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label={`Más opciones de ${clinic.name}`}>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
            {unpaid.length > 1 && (
              <DropdownMenuItem className="gap-2 rounded-lg" disabled={busy} onSelect={payAll}>
                <CheckCheck /> Marcar pagados los {unpaid.length} meses pendientes
              </DropdownMenuItem>
            )}
            {clinic.exempt ? (
              <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => changeExempt(false)}>
                <BadgeCheck /> Tiene que pagar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => changeExempt(true)}>
                <CircleSlash /> No tiene que pagar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="gap-2 rounded-lg">
              <Link to={clinicPath}>
                <ExternalLink /> Ver clínica y su plan
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

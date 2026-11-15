import { generatePath, Link } from "react-router";
import { BadgeCheck, Check, CircleSlash, Ellipsis, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicBilling } from "@/adapters/api";
import { useSetBillingExempt, useSetPayment } from "@/adapters/hook";
import ClinicAvatar from "@/components/ClinicAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { formatDay, formatShortMonth, stateOf, unpaidBefore } from "../billingUtils";
import PaymentHistory from "./PaymentHistory";

type Props = { clinic: ClinicBilling; month: string };

// One clinic in the selected month: its state, the last 12 months, and a
// one-click toggle. Every change can be undone from the toast
export default function ClinicPaymentRow({ clinic, month }: Props) {
  const setPayment = useSetPayment();
  const setExempt = useSetBillingExempt();
  const state = stateOf(clinic, month);
  const monthName = formatShortMonth(month);
  const behind = unpaidBefore(clinic, month);

  const changePayment = (paid: boolean, undo = true) =>
    setPayment.mutate(
      { clinicId: clinic.id, month, paid },
      {
        onSuccess: () => {
          if (!undo) return;
          toast.success(
            paid ? `${clinic.name}: ${monthName} pagado` : `${clinic.name}: ${monthName} pendiente`,
            { action: { label: "Deshacer", onClick: () => changePayment(!paid, false) } },
          );
        },
        onError: (error) => toast.error("No se pudo guardar", { description: error.message }),
      },
    );

  const changeExempt = (exempt: boolean) =>
    setExempt.mutate(
      { clinicId: clinic.id, exempt },
      {
        onSuccess: () =>
          toast.success(
            exempt ? `${clinic.name} ya no tiene que pagar` : `${clinic.name} vuelve a pagar`,
          ),
        onError: (error) => toast.error("No se pudo guardar", { description: error.message }),
      },
    );

  const detail =
    state === "paid" && clinic.payment
      ? `Pagado el ${formatDay(clinic.payment.paidAt)}${
          clinic.payment.recordedByName ? ` · marcó ${clinic.payment.recordedByName}` : ""
        }`
      : state === "paid"
        ? "Pagado"
        : state === "exempt"
          ? "No tiene que pagar"
          : state === "notYet"
            ? "Aún no existía este mes"
            : "Pendiente de pago";

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4",
        (state === "exempt" || state === "notYet") && "bg-muted/30",
      )}
    >
      <ClinicAvatar clinicId={clinic.id} name={clinic.name} />

      <div className="flex min-w-0 flex-1 basis-[calc(100%-4rem)] flex-col gap-0.5 lg:basis-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{clinic.name}</span>
          {clinic.status === "inactive" && (
            <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
              Inactiva
            </span>
          )}
        </div>
        <span
          className={cn(
            "truncate text-xs",
            state === "pending" ? "font-medium text-coral" : "text-muted-foreground",
          )}
        >
          {detail}
          {behind.length > 0 && state !== "exempt" && (
            <span className="font-medium text-coral">
              {" "}
              · {behind.length} {behind.length === 1 ? "mes anterior" : "meses anteriores"} sin
              pagar
            </span>
          )}
        </span>
      </div>

      {/* Under the name until there's room for it in its own column. Phones:
          full width (it doesn't fit next to the button) */}
      <div className="w-full sm:ml-14 sm:w-auto lg:ml-0">
        <PaymentHistory clinic={clinic} month={month} />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {(state === "pending" || state === "paid") && (
          <Button
            type="button"
            size="sm"
            variant={state === "paid" ? "secondary" : "outline"}
            aria-pressed={state === "paid"}
            disabled={setPayment.isPending}
            onClick={() => changePayment(state !== "paid")}
            className={cn(
              "h-9 w-36 rounded-full",
              state === "paid" && "text-primary hover:bg-secondary/70",
            )}
            title={state === "paid" ? "Volver a marcar como pendiente" : undefined}
          >
            {setPayment.isPending ? (
              <Loader2 className="animate-spin" />
            ) : state === "paid" ? (
              <Check />
            ) : null}
            {state === "paid" ? "Pagado" : "Marcar pagado"}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={`Más opciones de ${clinic.name}`}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
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
              <Link to={generatePath(paths.adminClinic, { clinicId: clinic.id })}>
                <ExternalLink /> Ver clínica
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

import type { ClinicBilling } from "@/adapters/api";
import { cn } from "@/lib/utils";
import { formatShortMonth, lastMonths, stateOf, type MonthState } from "../billingUtils";

const look: Record<MonthState, string> = {
  paid: "bg-primary",
  pending: "border border-coral bg-coral/15",
  exempt: "bg-muted-foreground/25",
  notYet: "border border-dashed border-border",
};

const label: Record<MonthState, string> = {
  paid: "pagado",
  pending: "sin pagar",
  exempt: "no tiene que pagar",
  notYet: "aún no existía",
};

// "2026-11" -> "nov" (always three letters, so every column has the same width)
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const monthAbbr = (month: string) => MONTHS[Number(month.slice(5, 7)) - 1];

// The last 12 months at a glance, oldest on the left. The selected month (the
// last square) is a bit taller. Each square says its month and state on hover
export default function PaymentHistory({
  clinic,
  month,
}: {
  clinic: ClinicBilling;
  month: string;
}) {
  const months = lastMonths(month);
  const paid = months.filter((m) => stateOf(clinic, m) === "paid").length;
  const owed = months.filter((m) => ["paid", "pending"].includes(stateOf(clinic, m))).length;

  return (
    <div
      className="flex items-end gap-[3px]"
      role="img"
      aria-label={`${paid} de ${owed} meses pagados en el último año`}
    >
      {months.map((m) => {
        const state = stateOf(clinic, m);
        const selected = m === month;
        return (
          <span
            key={m}
            title={`${formatShortMonth(m)}: ${label[state]}`}
            className="flex w-5 flex-col items-center gap-1"
          >
            {/* "nov"; the year and the state are in the tooltip */}
            <span
              aria-hidden
              className={cn(
                "text-[10px] leading-none",
                selected ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {monthAbbr(m)}
            </span>
            <span
              className={cn("w-full rounded-[4px]", selected ? "h-6" : "h-5", look[state])}
            />
          </span>
        );
      })}
    </div>
  );
}

import type { ClinicBilling } from "@/adapters/api";
import { cn } from "@/lib/utils";
import { canMark, formatShortMonth, lastMonths, stateOf, type MonthState } from "../billingUtils";

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

// The last 12 months, oldest on the left; the selected one a bit taller.
// Each month that can be marked is a button: one click marks it paid, or back
// to pending (catching up without going month by month)
export default function PaymentHistory({
  clinic,
  month,
  currentMonth,
  busy,
  onToggle,
}: {
  clinic: ClinicBilling;
  month: string;
  currentMonth: string;
  busy: boolean;
  onToggle: (month: string, paid: boolean) => void;
}) {
  const months = lastMonths(month);
  return (
    <div className="flex items-end gap-[3px]" role="group" aria-label={`Últimos 12 meses de ${clinic.name}`}>
      {months.map((m) => {
        const state = stateOf(clinic, m);
        const selected = m === month;
        const clickable = canMark(clinic, m, currentMonth) && (state === "paid" || state === "pending");
        const title = `${formatShortMonth(m)}: ${label[state]}${clickable ? (state === "paid" ? " · pulsa para dejarlo pendiente" : " · pulsa para marcarlo pagado") : ""}`;
        const box = <span className={cn("w-full rounded-[4px] transition-transform", selected ? "h-6" : "h-5", look[state], clickable && "group-hover:scale-y-110")} />;
        return (
          <span key={m} className="flex w-5 flex-col items-center gap-1">
            <span aria-hidden className={cn("text-[10px] leading-none", selected ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {monthAbbr(m)}
            </span>
            {clickable ? (
              <button
                type="button"
                title={title}
                aria-label={title}
                aria-pressed={state === "paid"}
                disabled={busy}
                onClick={() => onToggle(m, state !== "paid")}
                className="group flex w-full cursor-pointer rounded-[4px] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
              >
                {box}
              </button>
            ) : (
              <span title={title} className="flex w-full">
                {box}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

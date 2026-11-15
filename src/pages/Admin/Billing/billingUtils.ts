// Pagos: month keys ("2026-11") and what each clinic owes. Pure functions
import type { ClinicBilling } from "@/adapters/api";

// "2026-11", -1 -> "2026-10"
export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y!, m! - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// "2026-11" -> the 1st of that month, for the month picker
export const monthToDate = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y!, m! - 1, 1);
};

// The 12 months ending in `month`, oldest first
export const lastMonths = (month: string, count = 12) =>
  Array.from({ length: count }, (_, i) => shiftMonth(month, i - count + 1));

const shortFormat = new Intl.DateTimeFormat("es-ES", { month: "short", year: "numeric" });
// "2026-11" -> "nov 2026"
export const formatShortMonth = (month: string) =>
  shortFormat.format(monthToDate(month)).replace(".", "");

const dayFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
// ISO date -> "3 nov"
export const formatDay = (iso: string) => dayFormat.format(new Date(iso)).replace(".", "");

// What a clinic is in one month
export type MonthState =
  | "paid"
  | "pending" // owed and not paid
  | "exempt" // doesn't have to pay
  | "notYet"; // the clinic didn't exist yet

export function stateOf(clinic: ClinicBilling, month: string): MonthState {
  if (clinic.paidMonths.includes(month)) return "paid";
  if (month < clinic.startMonth) return "notYet";
  if (clinic.exempt) return "exempt";
  return "pending";
}

// Earlier months (within the history) owed and not paid
export const unpaidBefore = (clinic: ClinicBilling, month: string) =>
  lastMonths(month)
    .slice(0, -1)
    .filter((m) => stateOf(clinic, m) === "pending");

// List order: what needs attention first
const order: Record<MonthState, number> = { pending: 0, paid: 1, exempt: 2, notYet: 3 };

export const byAttention = (month: string) => (a: ClinicBilling, b: ClinicBilling) =>
  order[stateOf(a, month)] - order[stateOf(b, month)] || a.name.localeCompare(b.name, "es");

import type { TimeRange, Weekday } from "@/adapters/api";

// ISO weekdays, Monday first
export const weekdays: { value: Weekday; label: string; short: string }[] = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 7, label: "Domingo", short: "Dom" },
];

// "HH:MM" strings compare correctly as text
export const sortRanges = <T extends TimeRange>(ranges: T[]) =>
  [...ranges].sort((a, b) => a.startTime.localeCompare(b.startTime));

// Problem with a day's slots, or null if they're fine:
// every slot must start before it ends, and slots can't overlap
export function rangesError(ranges: TimeRange[]): string | null {
  if (ranges.some((r) => !r.startTime || !r.endTime)) return "Completa todas las horas.";
  if (ranges.some((r) => r.startTime >= r.endTime)) {
    return "Cada franja debe empezar antes de terminar.";
  }
  const sorted = sortRanges(ranges);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.startTime < sorted[i - 1]!.endTime) return "Las franjas no pueden solaparse.";
  }
  return null;
}

// "09:00–14:00 · 16:00–20:00"
export const formatRanges = (ranges: TimeRange[]) =>
  sortRanges(ranges)
    .map((r) => `${r.startTime}–${r.endTime}`)
    .join(" · ");

// Dates are "YYYY-MM-DD" (no time zone): build them as local dates to format
const toLocalDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

// "mié, 24 dic 2026" or "lun, 3 ago 2026 – dom, 30 ago 2026"
export const formatDateRange = (startDate: string, endDate: string) =>
  startDate === endDate
    ? dateFormat.format(toLocalDate(startDate))
    : `${dateFormat.format(toLocalDate(startDate))} – ${dateFormat.format(toLocalDate(endDate))}`;

// Today as "YYYY-MM-DD" in the browser's local time
export const todayIso = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

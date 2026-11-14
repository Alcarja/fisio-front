// Date and grid helpers for the bookings calendar
import type { OpeningHours, ScheduleException, TimeRange } from "@/adapters/api";

// Visible hours when the clinic has no schedule yet
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 21;
// Height of one hour in the grid, in pixels
export const HOUR_HEIGHT = 64;

// Empty hours shown before the first opening and after the last closing, so
// the first and last slots never touch the edges of the calendar. They're
// drawn as closed (striped), so they don't look bookable
export const MARGIN_HOURS = 1;

// The grid's first and last hour: from the earliest opening to the latest
// closing in the weekly hours and the visible exceptions, plus the margin
// (never before 00:00 or after 24:00)
export function visibleHours(weeklyHours: OpeningHours[], exceptions: ScheduleException[]) {
  const ranges: TimeRange[] = [...weeklyHours, ...exceptions.flatMap((e) => e.hours)];
  if (ranges.length === 0) return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  const start = Math.min(...ranges.map((r) => toMinutes(r.startTime)));
  const end = Math.max(...ranges.map((r) => toMinutes(r.endTime)));
  return {
    startHour: Math.max(0, Math.floor(start / 60) - MARGIN_HOURS),
    endHour: Math.min(24, Math.ceil(end / 60) + MARGIN_HOURS),
  };
}

// "YYYY-MM-DD" in local time (how the clinic's dates are stored)
export function toIsoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ISO weekday: 1 = Monday … 7 = Sunday
export const isoWeekday = (date: Date) => ((date.getDay() + 6) % 7) + 1;

export type DayOpening = {
  ranges: TimeRange[]; // when the clinic is open that day (empty = closed)
  exception: ScheduleException | null; // the exception that applies, if any
};

// Is the clinic open on `date`, and when? Same rule as the backend will use:
// an exception covering the date wins; otherwise, that weekday's hours
export function openingFor(
  date: Date,
  weeklyHours: OpeningHours[],
  exceptions: ScheduleException[],
): DayOpening {
  const iso = toIsoDate(date);
  const weekday = isoWeekday(date);
  const exception = exceptions.find((e) => e.startDate <= iso && iso <= e.endDate) ?? null;

  if (exception) {
    const ranges =
      exception.type === "closed"
        ? []
        : exception.hours.filter((h) => h.weekday === null || h.weekday === weekday);
    return { ranges, exception };
  }
  return { ranges: weeklyHours.filter((h) => h.weekday === weekday), exception: null };
}

// Does an appointment fit fully inside the opening hours?
export const fitsIn = (startTime: string, durationMinutes: number, ranges: TimeRange[]) => {
  const start = toMinutes(startTime);
  const end = start + durationMinutes;
  return ranges.some((r) => toMinutes(r.startTime) <= start && end <= toMinutes(r.endTime));
};

// Monday of the week that contains `date`, at 00:00
export function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (d.getDay() + 6) % 7; // Monday = 0 … Sunday = 6
  d.setDate(d.getDate() - weekday);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// "09:30" -> minutes since midnight
export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
};

// Vertical position and height of something in the grid, in pixels.
// `startHour` is the grid's first hour
export function blockPosition(startTime: string, durationMinutes: number, startHour: number) {
  const top = ((toMinutes(startTime) - startHour * 60) / 60) * HOUR_HEIGHT;
  const height = (durationMinutes / 60) * HOUR_HEIGHT;
  return { top, height };
}

// "09:30" + 45 -> "10:15"
export function endTime(startTime: string, durationMinutes: number) {
  const total = toMinutes(startTime) + durationMinutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const dayName = new Intl.DateTimeFormat("es-ES", { weekday: "short" });
const dayNameLong = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
const monthYear = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
const dayMonth = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

// "lun" (column header)
export const formatDayName = (date: Date) => dayName.format(date).replace(".", "");

// "lunes, 16 de noviembre"
export const formatDayLong = (date: Date) => dayNameLong.format(date);

// "16 – 21 nov 2026" or "30 nov – 5 dic 2026" (toolbar title)
export function formatWeekRange(monday: Date, days: number) {
  const last = addDays(monday, days - 1);
  const sameMonth = monday.getMonth() === last.getMonth();
  const start = sameMonth ? String(monday.getDate()) : dayMonth.format(monday);
  return `${start} – ${dayMonth.format(last)} ${last.getFullYear()}`;
}

// "noviembre de 2026"
export const formatMonthYear = (date: Date) => monthYear.format(date);

// Side-by-side layout for appointments that overlap in the same day.
// Each item gets a column and the number of columns of its group, so two
// appointments at the same time are drawn next to each other, not on top
export function layoutOverlaps<T extends { startTime: string; durationMinutes: number }>(
  items: T[],
): { item: T; column: number; columns: number }[] {
  const sorted = [...items].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  const result: { item: T; column: number; columns: number }[] = [];

  // Groups of appointments that overlap each other (directly or in a chain)
  let group: { item: T; column: number; end: number }[] = [];
  let groupEnd = -1;

  const closeGroup = () => {
    const columns = Math.max(1, ...group.map((g) => g.column + 1));
    for (const g of group) result.push({ item: g.item, column: g.column, columns });
    group = [];
  };

  for (const item of sorted) {
    const start = toMinutes(item.startTime);
    const end = start + item.durationMinutes;
    if (group.length > 0 && start >= groupEnd) closeGroup();
    // First column that's free at this start time
    let column = 0;
    while (group.some((g) => g.column === column && g.end > start)) column++;
    group.push({ item, column, end });
    groupEnd = Math.max(groupEnd, end);
  }
  if (group.length > 0) closeGroup();
  return result;
}

// "Ana Morales"
export const patientName = (p: { firstName: string; lastName: string }) =>
  `${p.firstName} ${p.lastName}`;

// "Ana Morales", or "Pilates · 4/6" for group sessions
export function bookingTitle(appointment: {
  service: { name: string; isGroup: boolean; maxPatients: number };
  patients: { firstName: string; lastName: string }[];
}) {
  if (appointment.service.isGroup) {
    return `${appointment.service.name} · ${appointment.patients.length}/${appointment.service.maxPatients}`;
  }
  const first = appointment.patients[0];
  return first ? patientName(first) : "Sin paciente";
}

// Appointment statuses in Spanish
export const statusLabels = {
  booked: "Reservada",
  confirmed: "Confirmada",
  completed: "Realizada",
  no_show: "No se presentó",
  cancelled: "Cancelada",
} as const;

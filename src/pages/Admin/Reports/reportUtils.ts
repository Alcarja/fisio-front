// Monthly report helpers: the month range and the breakdowns, computed from the
// appointments of the month. Pure functions, so the page only renders.
//
// For now everything is calculated in the browser from
// GET /clinic/calendar/appointments?from&to. If a month gets too heavy, a
// backend endpoint can return this same MonthReport shape and the page stays as is.
import type { Appointment, CalendarConfig, MonthlyReport } from "@/adapters/api";
import { toIsoDate } from "../Bookings/calendarUtils";

// ── Month range ──────────────────────────────────────────────────────────

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

// Both days included, like the appointments endpoint
export function monthRange(month: Date) {
  const first = startOfMonth(month);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
}

const monthFormat = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
// "noviembre de 2026"
export const formatMonth = (month: Date) => monthFormat.format(month);

// "2026-11", the month parameter of the reports endpoint
export const monthKey = (month: Date) => toIsoDate(month).slice(0, 7);

export const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// ── Breakdown ────────────────────────────────────────────────────────────

// Totals for one group (a service, a physio, a cell of the table…)
export type Totals = {
  appointments: number; // not cancelled
  minutes: number; // session time of those appointments
  patients: number; // patient places (a group session counts each patient)
  noShows: number; // appointments marked "no se presentó"
  cancelled: number;
};

const emptyTotals = (): Totals => ({
  appointments: 0,
  minutes: 0,
  patients: 0,
  noShows: 0,
  cancelled: 0,
});

function add(totals: Totals, appointment: Appointment) {
  if (appointment.status === "cancelled") {
    totals.cancelled += 1;
    return;
  }
  totals.appointments += 1;
  totals.minutes += appointment.durationMinutes;
  totals.patients += appointment.patients.length;
  if (appointment.status === "no_show") totals.noShows += 1;
}

export type ServiceRow = { id: string; name: string; color: string; totals: Totals };
export type PhysioRow = { id: string; name: string; image: string | null; totals: Totals };

export type MonthReport = {
  totals: Totals;
  byService: ServiceRow[]; // most appointments first
  byPhysio: PhysioRow[]; // most appointments first
  // Physio × service: matrix[physioId][serviceId]
  matrix: Record<string, Record<string, Totals>>;
};

// Services and professionals come from the clinic config, so the ones with no
// appointments this month still show (with 0). Appointments for services or
// physios that are no longer active are added from the appointment itself.
export function buildMonthReport(appointments: Appointment[], config: CalendarConfig): MonthReport {
  const totals = emptyTotals();
  const services = new Map<string, ServiceRow>();
  const physios = new Map<string, PhysioRow>();
  const matrix: MonthReport["matrix"] = {};

  for (const s of config.services) {
    services.set(s.id, { id: s.id, name: s.name, color: s.color, totals: emptyTotals() });
  }
  for (const p of config.professionals) {
    physios.set(p.userId, { id: p.userId, name: p.name, image: p.image, totals: emptyTotals() });
  }

  for (const a of appointments) {
    const service =
      services.get(a.service.id) ??
      services
        .set(a.service.id, {
          id: a.service.id,
          name: a.service.name,
          color: a.service.color,
          totals: emptyTotals(),
        })
        .get(a.service.id)!;
    // Class sessions without a physio yet go in their own row
    const physioId = a.physio?.userId ?? "sin-fisio";
    const physio =
      physios.get(physioId) ??
      physios
        .set(physioId, {
          id: physioId,
          name: a.physio?.name ?? "Sin fisio asignado",
          image: null,
          totals: emptyTotals(),
        })
        .get(physioId)!;

    const row = (matrix[physio.id] ??= {});
    const cell = (row[service.id] ??= emptyTotals());

    add(totals, a);
    add(service.totals, a);
    add(physio.totals, a);
    add(cell, a);
  }

  const byMost = <T extends { name: string; totals: Totals }>(a: T, b: T) =>
    b.totals.appointments - a.totals.appointments || a.name.localeCompare(b.name, "es");

  return {
    totals,
    byService: [...services.values()].sort(byMost),
    byPhysio: [...physios.values()].sort(byMost),
    matrix,
  };
}

// From GET /clinic/reports/monthly: the backend already counted each
// physio × service pair, so here they're only added up into the same shape
export function buildReportFromCells(data: MonthlyReport): MonthReport {
  const totals = emptyTotals();
  const services = new Map<string, ServiceRow>();
  const physios = new Map<string, PhysioRow>();
  const matrix: MonthReport["matrix"] = {};

  for (const s of data.services) {
    services.set(s.id, { id: s.id, name: s.name, color: s.color, totals: emptyTotals() });
  }
  for (const p of data.professionals) {
    physios.set(p.userId, { id: p.userId, name: p.name, image: p.image, totals: emptyTotals() });
  }

  const sum = (target: Totals, cell: Totals) => {
    target.appointments += cell.appointments;
    target.minutes += cell.minutes;
    target.patients += cell.patients;
    target.noShows += cell.noShows;
    target.cancelled += cell.cancelled;
  };

  for (const { physioId, serviceId, ...cell } of data.cells) {
    // Inactive services or former members still count; they come without
    // details in the lists, so they get a placeholder name
    let service = services.get(serviceId);
    if (!service) {
      service = { id: serviceId, name: "Servicio desactivado", color: "#a3a3a3", totals: emptyTotals() };
      services.set(serviceId, service);
    }
    let physio = physios.get(physioId);
    if (!physio) {
      physio = { id: physioId, name: "Antiguo miembro", image: null, totals: emptyTotals() };
      physios.set(physioId, physio);
    }

    const row = (matrix[physioId] ??= {});
    sum((row[serviceId] ??= emptyTotals()), cell);
    sum(service.totals, cell);
    sum(physio.totals, cell);
    sum(totals, cell);
  }

  const byMost = <T extends { name: string; totals: Totals }>(a: T, b: T) =>
    b.totals.appointments - a.totals.appointments || a.name.localeCompare(b.name, "es");

  return {
    totals,
    byService: [...services.values()].sort(byMost),
    byPhysio: [...physios.values()].sort(byMost),
    matrix,
  };
}

// ── Formatting ───────────────────────────────────────────────────────────

// 90 -> "1,5 h", 45 -> "45 min"
export function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours.toLocaleString("es-ES", { maximumFractionDigits: 1 })} h`;
}

// 0.237 -> "24 %"
export const formatPercent = (value: number) =>
  `${Math.round(value * 100).toLocaleString("es-ES")} %`;

export const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);


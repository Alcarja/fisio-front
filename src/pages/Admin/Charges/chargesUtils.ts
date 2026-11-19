// Cobros helpers: labels, filters, totals and grouping. Pure functions, so the
// page and its dialogs only render.
import type { Bono, BonoStatus, ChargeSession, PaymentMethod, SessionState } from "@/adapters/api";

const priceFormat = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
// 4550 -> "45,50 €"
export const formatPrice = (cents: number) => priceFormat.format(cents / 100);

// 4550 -> "45,50" (for an input)
export const centsToInput = (cents: number) =>
  (cents / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

// "45,5" or "45.50" -> 4550. null if it isn't a valid amount
export function inputToCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

// Each state in Spanish, with the classes of its tag. What needs doing
// (pending, review) is in the accent colour
export const stateInfo: Record<SessionState, { label: string; className: string }> = {
  pending: { label: "Pendiente de cobro", className: "bg-coral/15 text-foreground" },
  review: { label: "A revisar", className: "bg-destructive/10 text-destructive" },
  // Already happened, nobody marked it in the calendar. Charging it marks it
  // as done
  to_confirm: {
    label: "Sin marcar",
    className: "border-dashed border-border text-muted-foreground",
  },
  paid: { label: "Cobrada", className: "bg-primary/10 text-primary" },
  bono: { label: "Con bono", className: "bg-primary/10 text-primary" },
  upcoming: { label: "Próxima", className: "bg-secondary text-secondary-foreground" },
  free: { label: "Sin cargo", className: "border-border text-muted-foreground" },
  waived: { label: "Sin cargo", className: "border-border text-muted-foreground" },
  no_charge: { label: "Falta, sin cargo", className: "border-border text-muted-foreground" },
};

// Order of the state filter (waived and free share a label: one entry)
export const stateOrder: SessionState[] = [
  "pending",
  "review",
  "to_confirm",
  "paid",
  "bono",
  "upcoming",
  "free",
  "no_charge",
];

export const methodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  bizum: "Bizum",
  transfer: "Transferencia",
  other: "Otra",
};
export const methodOrder: PaymentMethod[] = ["cash", "card", "bizum", "transfer", "other"];

// Sessions that can be charged now: done, unconfirmed (charging confirms
// them), upcoming (paid in advance) or a no-show the clinic decides to charge
export const isChargeable = (s: ChargeSession) =>
  (s.source === "manual" || !!s.appointmentPatientId) &&
  s.priceCents > 0 &&
  (s.state === "pending" || s.state === "to_confirm" || s.state === "upcoming" || s.state === "no_charge");

// Its price and "sin cargo" can still change (not paid yet)
export const isEditable = (s: ChargeSession) =>
  (s.source === "manual" || !!s.appointmentPatientId) &&
  (s.state === "pending" ||
    s.state === "to_confirm" ||
    s.state === "upcoming" ||
    s.state === "no_charge" ||
    s.state === "free");

// Owed: done (or a no-show that's charged) or happened without being marked,
// with something to charge. What a person's "Cobrar" button adds up
export const isOwed = (s: ChargeSession) =>
  isChargeable(s) && (s.state === "pending" || s.state === "to_confirm");

export type SessionFilters = {
  physioId: string; // "" = everyone
  state: SessionState | ""; // "" = all
  search: string;
};

// "María José" matches "maria jose", "MARÍA" or "jose"
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function filterSessions(sessions: ChargeSession[], filters: SessionFilters) {
  const words = normalize(filters.search).split(/\s+/).filter(Boolean);
  return sessions.filter((s) => {
    if (filters.physioId && s.physioId !== filters.physioId) return false;
    if (filters.state) {
      // "Sin cargo" covers free services and sessions the clinic waived
      const state = s.state === "waived" ? "free" : s.state;
      if (state !== filters.state) return false;
    }
    if (words.length > 0) {
      const name = normalize(`${s.firstName} ${s.lastName}`);
      if (!words.every((w) => name.includes(w))) return false;
    }
    return true;
  });
}

export type SessionTotals = {
  pending: number;
  pendingCents: number;
  paid: number;
  paidCents: number;
  withBono: number;
  toConfirm: number;
  toConfirmCents: number;
  upcoming: number;
  review: number;
};

export function sessionTotals(sessions: ChargeSession[]): SessionTotals {
  const t: SessionTotals = {
    pending: 0,
    pendingCents: 0,
    paid: 0,
    paidCents: 0,
    withBono: 0,
    toConfirm: 0,
    toConfirmCents: 0,
    upcoming: 0,
    review: 0,
  };
  for (const s of sessions) {
    if (s.state === "pending") {
      t.pending++;
      t.pendingCents += s.priceCents;
    }
    if (s.state === "paid") {
      t.paid++;
      t.paidCents += s.priceCents;
    }
    if (s.state === "bono") t.withBono++;
    if (s.state === "to_confirm") {
      t.toConfirm++;
      if (isChargeable(s)) t.toConfirmCents += s.priceCents;
    }
    if (s.state === "upcoming") t.upcoming++;
    if (s.state === "review") t.review++;
  }
  return t;
}

// The physios that appear in the sessions, by name (for the filter)
export function physiosOf(sessions: ChargeSession[]) {
  const byId = new Map<string, string>();
  for (const s of sessions) if (s.physioId) byId.set(s.physioId, s.physioName ?? "");
  return [...byId]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

// Local "YYYY-MM-DD" of an instant (the browser's time zone, like the calendar)
export const localDay = (iso: string | Date) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Most recent day first (today on top); sessions of a day in time order
export function groupByDay(sessions: ChargeSession[]) {
  const days = new Map<string, ChargeSession[]>();
  for (const s of sessions) {
    const day = localDay(s.startsAt);
    days.set(day, [...(days.get(day) ?? []), s]);
  }
  return [...days]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, list]) => ({ day, sessions: list }));
}

// The same person: their ficha, or their name when they have none
export const personKey = (s: { patientId: string | null; firstName: string; lastName: string }) =>
  s.patientId ?? `name:${normalize(`${s.firstName} ${s.lastName}`)}`;

// One group per person. `owes`: which of their sessions their "Cobrar" button
// charges. Whoever owes most first, or by name
export function groupByPerson(
  sessions: ChargeSession[],
  { owes = isOwed, order = "owed" }: { owes?: (s: ChargeSession) => boolean; order?: "owed" | "name" } = {},
) {
  const people = new Map<string, ChargeSession[]>();
  for (const s of sessions) {
    const key = personKey(s);
    people.set(key, [...(people.get(key) ?? []), s]);
  }
  return [...people]
    .map(([key, list]) => ({
      key,
      name: `${list[0]!.firstName} ${list[0]!.lastName}`,
      patientId: list[0]!.patientId,
      sessions: list,
      owed: list.filter(owes),
    }))
    .map((p) => ({ ...p, owedCents: p.owed.reduce((t, s) => t + s.priceCents, 0) }))
    .sort(
      (a, b) =>
        (order === "owed" ? b.owedCents - a.owedCents : 0) || a.name.localeCompare(b.name, "es"),
    );
}

const dayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
// "lunes, 16 de noviembre"
export const formatDay = (day: string) => dayFormat.format(new Date(`${day}T12:00:00`));

const shortDayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" });
// "lun, 16 nov"
export const formatShortDay = (iso: string) => shortDayFormat.format(new Date(iso));

const timeFormat = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
// "09:30"
export const formatTime = (iso: string) => timeFormat.format(new Date(iso));

const longDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });
// "1 de noviembre de 2026"
export const formatLongDate = (day: string) => longDate.format(new Date(`${day}T12:00:00`));

// ── Bonos ────────────────────────────────────────────────────────────────


export const bonoStatusInfo: Record<BonoStatus, { label: string; className: string }> = {
  active: { label: "Activo", className: "bg-primary/10 text-primary" },
  upcoming: { label: "Empieza más adelante", className: "bg-secondary text-secondary-foreground" },
  expired: { label: "Caducado", className: "border-border text-muted-foreground" },
  used_up: { label: "Agotado", className: "border-border text-muted-foreground" },
  cancelled: { label: "Anulado", className: "border-border text-muted-foreground line-through" },
};

// "3 de 10 sesiones usadas" / "2 por semana" / "Sin límite"
export function bonoBalance(b: Bono) {
  if (b.kind === "sessions") return `${b.usedSessions} de ${b.totalSessions} usadas`;
  return b.sessionsPerWeek ? `${b.sessionsPerWeek} por semana` : "Sin límite de sesiones";
}

const shortDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });
const monthName = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
const day = (iso: string) => shortDate.format(new Date(`${iso}T12:00:00`)).replace(".", "");

// "Noviembre de 2026" / "Hasta el 18 may 2027" / "No caduca"
export function bonoValidity(b: Pick<Bono, "kind" | "validFrom" | "validUntil">) {
  if (b.kind === "monthly") {
    const m = monthName.format(new Date(`${b.validFrom}T12:00:00`));
    return m.charAt(0).toUpperCase() + m.slice(1);
  }
  return b.validUntil ? `Hasta el ${day(b.validUntil)}` : "No caduca";
}

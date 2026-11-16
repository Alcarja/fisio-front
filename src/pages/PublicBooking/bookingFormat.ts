import type { PublicCancellation } from "@/adapters/api";

// Dates are "YYYY-MM-DD" in the clinic's time: build them as local dates to format
const toLocalDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

const pad = (n: number) => String(n).padStart(2, "0");

// "2026-11-16" + 7 -> "2026-11-23"
export function addDays(isoDate: string, days: number) {
  const date = toLocalDate(isoDate);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const weekdayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "short" });
const monthFormat = new Intl.DateTimeFormat("es-ES", { month: "short" });
const longFormat = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// The pieces of a day button: "lun", "16", "nov"
export const dayParts = (isoDate: string) => {
  const date = toLocalDate(isoDate);
  return {
    weekday: weekdayFormat.format(date).replace(".", ""),
    day: date.getDate(),
    month: monthFormat.format(date).replace(".", ""),
  };
};

// "lunes, 16 de noviembre"
export const formatLongDate = (isoDate: string) => longFormat.format(toLocalDate(isoDate));

// 60 -> "1 h", 45 -> "45 min", 90 -> "1 h 30 min"
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h > 0 && `${h} h`, m > 0 && `${m} min`].filter(Boolean).join(" ");
}

const priceFormat = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

// 4550 -> "45,50 €"
export const formatPrice = (cents: number) => priceFormat.format(cents / 100);

// 24 -> "24 horas", 1 -> "1 hora", 48 -> "2 días"
export const hoursLabel = (hours: number) =>
  hours % 24 === 0 && hours >= 48
    ? `${hours / 24} días`
    : `${hours} ${hours === 1 ? "hora" : "horas"}`;

// One sentence telling the patient how cancelling works in this clinic
export function cancellationNote({ cancelEnabled, cancelNoticeHours }: PublicCancellation) {
  if (!cancelEnabled) return "Si no puedes venir, avisa a la clínica lo antes posible.";
  return cancelNoticeHours === 0
    ? "Puedes cancelar la cita desde el enlace de tu email hasta su hora de inicio."
    : `Puedes cancelar la cita desde el enlace de tu email hasta ${hoursLabel(cancelNoticeHours)} antes.`;
}

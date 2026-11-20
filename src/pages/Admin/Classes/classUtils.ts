// Dates and labels shared by the Clases page and its dialogs

export const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
export const WEEKDAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const today = () => iso(new Date());

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return iso(d);
};

// "mar 24 nov"
export const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" })
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "");

// "24 nov 2026"
export const shortDate = (date: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "");

// "Martes y jueves"
export function weekdaysLabel(days: number[]) {
  const names = days.map((d) => WEEKDAY_NAMES[d - 1]!);
  const text = names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}` : names[0]!;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const summary = (list: string[]) => list.map(dayLabel).join(", ");

// Formatting helpers for services (prices are stored in cents)

const priceFormat = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

// 4550 -> "45,50 €"
export const formatPrice = (cents: number) => priceFormat.format(cents / 100);

// 4550 -> "45,50" (for the input)
export const centsToInput = (cents: number) =>
  (cents / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

// "45,5" or "45.50" -> 4550. null if it isn't a valid amount
export function inputToCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return 0;
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

// 90 -> "1 h 30 min", 45 -> "45 min"
export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// Calendar colors to choose from (all "#RRGGBB", as the database requires)
export const serviceColors = [
  "#5B8DEF", // blue (default)
  "#2F9E8F", // teal
  "#4CAF50", // green
  "#E0A100", // amber
  "#F07C4A", // coral
  "#E05A7A", // pink
  "#8E6CDB", // purple
  "#6B7280", // grey
];

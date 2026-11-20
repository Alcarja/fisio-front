import { TriangleAlert } from "lucide-react";
import type { PriceChange } from "@/adapters/api";
import { formatPrice } from "../Settings/Services/serviceFormat";

// The clinic's fee when its number of professionals changes (owners, admins
// and physios count; reception is free). The new price counts from the next
// month. Used by the team dialogs

const monthFormat = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
// "2026-12" -> "diciembre de 2026"
export const monthName = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return monthFormat.format(new Date(y!, m! - 1, 1));
};

const per = (c: PriceChange) => (c.cycle === "annual" ? "al año" : "al mes");

// One line for a toast: "Tu cuota pasa a 135,00 € al mes desde diciembre de 2026"
export const priceChangeLine = (c: PriceChange) =>
  `${c.increase ? "Tu cuota pasa" : "Tu cuota baja"} a ${formatPrice(c.toCents)} ${per(c)} desde ${monthName(c.fromMonth)}.`;

// Shown inside the dialog when the server asks to confirm a raise
export function PriceChangeNotice({ change }: { change: PriceChange }) {
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-1.5">
        <p className="font-medium">Este cambio sube la cuota de la clínica</p>
        <p className="text-muted-foreground">
          Pasaríais de {change.fromProfessionals} a {change.toProfessionals} profesionales
          {change.planName ? ` en el plan ${change.planName}` : ""}: la cuota pasa de{" "}
          <strong className="font-medium text-foreground">{formatPrice(change.fromCents)}</strong> a{" "}
          <strong className="font-medium text-foreground">{formatPrice(change.toCents)}</strong> {per(change)}, a partir de{" "}
          {monthName(change.fromMonth)}.
        </p>
        <p className="text-xs text-muted-foreground">Recepción no cuenta como profesional. Las invitaciones pendientes cuentan desde que se envían.</p>
      </div>
    </div>
  );
}

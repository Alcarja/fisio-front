import { Check, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { ProfessionalAlerts, ProfessionalChange } from "@/adapters/api";
import { useReviewProfessionalChanges } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "../../Settings/Services/serviceFormat";

// Professionals of a clinic and its fee: the changes in its team (written by a
// trigger on member, whoever made them), the tier changes the super-admin
// hasn't reviewed yet and the professionals fixed by hand below what it has.
// Rules in back/src/lib/plans.ts (professionalAlerts)

const day = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

// "3 → 5 profesionales · 95 € → 135 €"
export function changeText(c: ProfessionalChange) {
  const pros = `${c.previousCount} → ${c.newCount} ${c.newCount === 1 ? "profesional" : "profesionales"}`;
  return c.tierChanged && c.fromCents !== null && c.toCents !== null ? `${pros} · ${formatPrice(c.fromCents)} → ${formatPrice(c.toCents)}/mes` : pros;
}

export function ReviewButton({ clinicId, name, className }: { clinicId: string; name?: string; className?: string }) {
  const review = useReviewProfessionalChanges();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn("rounded-full", className)}
      disabled={review.isPending}
      onClick={() =>
        review.mutate(clinicId, {
          onSuccess: () => toast.success(name ? `${name}: cambios revisados` : "Cambios revisados"),
          onError: (e) => toast.error("No se pudo guardar", { description: e.message }),
        })
      }
    >
      {review.isPending ? <Loader2 className="animate-spin" /> : <Check />}
      Revisado
    </Button>
  );
}

// "Tiene 5, paga por 3": the price is fixed by hand and the team grew past it
export function overrideText(counted: number, override: number | null) {
  return `Tiene ${counted} ${counted === 1 ? "profesional" : "profesionales"} y paga por ${override ?? "?"} (fijado a mano)`;
}

// The clinic page: the warnings and the history
export function ProfessionalHistory({
  clinicId,
  alerts,
  counted,
  override,
}: {
  clinicId: string;
  alerts: ProfessionalAlerts;
  counted: number;
  override: number | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      {alerts.overrideBelow && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {overrideText(counted, override)}. Si no es lo pactado, quita «Fijar a mano» o sube el número.
        </p>
      )}
      {alerts.unreviewed > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <TriangleAlert className="size-4 shrink-0" />
          <span className="flex-1">
            {alerts.unreviewed === 1 ? "Ha cambiado de tramo" : `Ha cambiado de tramo ${alerts.unreviewed} veces`} desde la última revisión. El precio nuevo se
            cobra desde el mes siguiente al cambio.
          </span>
          <ReviewButton clinicId={clinicId} />
        </div>
      )}
      {alerts.changes.length > 0 && (
        <details className="group text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Historial de profesionales ({alerts.changes.length})</summary>
          <ol className="mt-2 flex flex-col divide-y rounded-xl border">
            {alerts.changes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2">
                <span className={cn(c.tierChanged && !c.reviewed && "font-medium text-amber-800 dark:text-amber-300")}>{changeText(c)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {day(c.changedAt)}
                  {c.tierChanged && (c.reviewed ? " · revisado" : " · sin revisar")}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

export { day as formatChangeDay };

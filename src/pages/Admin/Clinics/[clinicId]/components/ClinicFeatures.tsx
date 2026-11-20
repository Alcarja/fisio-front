import { Loader2, TriangleAlert, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicFeature } from "@/adapters/api";
import { useApplyContract, useContract, useSetClinicFeature } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { clinicFeatures } from "@/lib/features";
import { featureLabel } from "../../../Plans/planUtils";

type Props = {
  clinicId: string;
  // The features switched on for this clinic
  enabled: ClinicFeature[];
};

// Optional features of the clinic: what's active (each one saved as soon as
// it's ticked) next to what's contracted (Plan y precio). Differences are
// warned about, not fixed on their own: a feature may be on as a trial, and
// the historia clínica waits for signed documents. "Aplicar plan" switches on
// what's contracted and still off
export default function ClinicFeatures({ clinicId, enabled }: Props) {
  const setFeature = useSetClinicFeature();
  const { data } = useContract(clinicId);
  const apply = useApplyContract();
  const contracted = new Map(data?.contract.features.map((f) => [f.feature, f.contracted]) ?? []);
  const missing = clinicFeatures.filter((f) => contracted.get(f.key) && !enabled.includes(f.key));

  const toggle = (feature: ClinicFeature, label: string, on: boolean) =>
    setFeature.mutate(
      { clinicId, feature, enabled: on },
      {
        onSuccess: () => toast.success(on ? `${label} activada` : `${label} desactivada`),
        onError: (error) => toast.error("No se pudo cambiar la funcionalidad", { description: error.message }),
      },
    );

  const applyPlan = () =>
    apply.mutate(clinicId, {
      onSuccess: ({ enabled: on, skipped }) => {
        if (on.length) toast.success(`Activadas: ${on.map(featureLabel).join(", ")}`);
        for (const s of skipped) toast.warning(`${featureLabel(s.feature)} sin activar`, { description: s.reason });
        if (!on.length && !skipped.length) toast.info("Ya estaba todo lo contratado activado");
      },
      onError: (e) => toast.error("No se pudo aplicar el plan", { description: e.message }),
    });

  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Funcionalidades</h2>
        <p className="text-sm text-muted-foreground">Lo que está activo en la clínica. Se guarda al marcarlo.</p>
        {missing.length > 0 && (
          <Button variant="outline" size="sm" className="mt-3 w-fit rounded-full" disabled={apply.isPending} onClick={applyPlan}>
            {apply.isPending ? <Loader2 className="animate-spin" /> : <Wand2 />} Aplicar plan
          </Button>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        {clinicFeatures.map(({ key, label, description }) => {
          // While saving, show the value being saved
          const saving = setFeature.isPending && setFeature.variables.feature === key;
          const checked = saving ? setFeature.variables.enabled : enabled.includes(key);
          const source = contracted.get(key) ?? null;
          const warning = data
            ? source && !checked
              ? "Contratada pero desactivada"
              : !source && checked
                ? "Activa sin contratar (¿prueba o regalo?)"
                : null
            : null;
          return (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={`feature-${key}`}
                checked={checked}
                disabled={setFeature.isPending}
                onCheckedChange={(value) => toggle(key, label, value === true)}
                className="mt-0.5"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor={`feature-${key}`}>{label}</Label>
                  {data && (
                    <Badge variant={source ? "secondary" : "outline"} className="text-[11px]">
                      {source === "plan" ? "En el plan" : source === "addon" ? "Extra" : "No contratada"}
                    </Badge>
                  )}
                </div>
                {warning && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <TriangleAlert className="size-3.5" /> {warning}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

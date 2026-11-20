import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicFeature, Plan, PlansData } from "@/adapters/api";
import { useSetFeaturePrice } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { centsToInput, inputToCents } from "../../Settings/Services/serviceFormat";
import { featureLabel } from "../planUtils";

// What each feature costs a month when a clinic contracts it outside its plan.
// A clinic can also get its own price for an extra (in its page)
export default function FeaturePrices({ prices, plans }: { prices: PlansData["featurePrices"]; plans: Plan[] }) {
  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Funcionalidades como extra</h2>
        <p className="text-sm text-muted-foreground">
          Lo que cuesta al mes cada una si una clínica la contrata fuera de su plan. Sin precio: se cuenta como 0 € y se avisa.
        </p>
      </div>
      <ul className="flex min-w-0 flex-col divide-y">
        {prices.map((p) => (
          <PriceRow key={p.feature} feature={p.feature} monthlyCents={p.monthlyCents} includedIn={plans.filter((pl) => pl.features.includes(p.feature)).map((pl) => pl.name)} />
        ))}
      </ul>
    </section>
  );
}

function PriceRow({ feature, monthlyCents, includedIn }: { feature: ClinicFeature; monthlyCents: number | null; includedIn: string[] }) {
  const [value, setValue] = useState(monthlyCents === null ? "" : centsToInput(monthlyCents));
  const setPrice = useSetFeaturePrice();
  const cents = value.trim() === "" ? null : inputToCents(value);
  const changed = cents !== monthlyCents && !(value.trim() !== "" && cents === null);
  const label = featureLabel(feature);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="flex min-w-0 flex-1 basis-56 flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {includedIn.length ? `Incluida en ${includedIn.join(", ")}` : "No la incluye ningún plan"}
        </span>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!changed) return;
          setPrice.mutate(
            { feature, monthlyCents: cents },
            {
              onSuccess: () => toast.success(`${label}: ${cents === null ? "sin precio" : `${centsToInput(cents)} €/mes`} como extra`),
              onError: (err) => toast.error("No se pudo guardar", { description: err.message }),
            },
          );
        }}
      >
        <Input
          aria-label={`Precio de ${label} como extra, al mes`}
          inputMode="decimal"
          placeholder="Sin precio"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={value.trim() !== "" && cents === null}
          className="w-28 text-right"
        />
        <span className="text-sm text-muted-foreground">€/mes</span>
        <Button type="submit" size="icon" variant={changed ? "default" : "ghost"} className="size-8 rounded-full" disabled={!changed || setPrice.isPending} aria-label={`Guardar precio de ${label}`}>
          {setPrice.isPending ? <Loader2 className="animate-spin" /> : <Check />}
        </Button>
      </form>
    </li>
  );
}

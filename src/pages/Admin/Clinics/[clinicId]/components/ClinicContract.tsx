import { useState } from "react";
import { Link } from "react-router";
import { CircleAlert, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { BillingCycle, ClinicContract as Contract, ClinicFeature, PlansData, ProfessionalAlerts } from "@/adapters/api";
import { useContract, usePlans, useSaveContract } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { clinicFeatures } from "@/lib/features";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { ProfessionalHistory } from "../../../Contracts/components/ProfessionalChanges";
import { featureLabel, previewQuote } from "../../../Plans/planUtils";
import { centsToInput, formatPrice, inputToCents } from "../../../Settings/Services/serviceFormat";

// Plan y precio: what the clinic has contracted (plan, monthly or annual,
// professionals, extras outside the plan, discount, agreed price) and what it
// costs. Saving doesn't switch features on or off: that's in Funcionalidades
// ("Aplicar plan"). Rules in back/src/lib/plans.ts
export default function ClinicContract({ clinicId }: { clinicId: string }) {
  const contract = useContract(clinicId);
  const plans = usePlans();
  if (contract.isPending || plans.isPending) {
    return (
      <section className="flex justify-center rounded-[1.75rem] border bg-card p-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </section>
    );
  }
  if (contract.error || plans.error) {
    return (
      <section role="alert" className="flex items-start gap-2 rounded-[1.75rem] border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        {(contract.error ?? plans.error)!.message}
      </section>
    );
  }
  // key: start the form again when the saved contract changes
  return (
    <ContractForm
      key={JSON.stringify(contract.data.contract)}
      clinicId={clinicId}
      contract={contract.data.contract}
      alerts={contract.data.professionalAlerts}
      plans={plans.data}
    />
  );
}

type AddonDraft = { on: boolean; custom: boolean; price: string };

function ContractForm({ clinicId, contract, alerts, plans }: { clinicId: string; contract: Contract; alerts: ProfessionalAlerts; plans: PlansData }) {
  const [planId, setPlanId] = useState(contract.plan?.id ?? "");
  const [cycle, setCycle] = useState<BillingCycle>(contract.cycle);
  const [fixPros, setFixPros] = useState(contract.professionalsOverride !== null);
  const [pros, setPros] = useState(String(contract.professionalsOverride ?? (contract.professionalsCounted || 1)));
  const [discount, setDiscount] = useState(String(contract.discountPercent));
  const [discountNote, setDiscountNote] = useState(contract.discountNote ?? "");
  const [agreed, setAgreed] = useState(contract.priceOverrideCents !== null);
  const [agreedPrice, setAgreedPrice] = useState(contract.priceOverrideCents === null ? "" : centsToInput(contract.priceOverrideCents));
  const [notes, setNotes] = useState(contract.notes ?? "");
  const [addons, setAddons] = useState<Record<ClinicFeature, AddonDraft>>(() =>
    Object.fromEntries(
      clinicFeatures.map((f) => {
        const own = contract.addons.find((a) => a.feature === f.key);
        return [f.key, { on: !!own, custom: own?.priceCents != null, price: own?.priceCents != null ? centsToInput(own.priceCents) : "" }];
      }),
    ) as Record<ClinicFeature, AddonDraft>,
  );
  const save = useSaveContract();

  // Archived plans only for the clinic that already has one
  const options = plans.plans.filter((p) => !p.archived || p.id === contract.plan?.id);
  const plan = plans.plans.find((p) => p.id === planId) ?? null;
  const prices = new Map(plans.featurePrices.map((f) => [f.feature, f.monthlyCents]));
  const professionals = fixPros ? Number(pros) : Math.max(contract.professionalsCounted, 1);
  const discountPercent = Number(discount);
  const agreedCents = agreed ? inputToCents(agreedPrice) : null;
  const addonList = clinicFeatures
    .filter((f) => addons[f.key].on && !plan?.features.includes(f.key))
    .map((f) => ({ feature: f.key, priceCents: addons[f.key].custom ? inputToCents(addons[f.key].price) : null }));

  const errors = [
    fixPros && (!Number.isInteger(professionals) || professionals < 1) && "El número de profesionales no es válido",
    (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) && "El descuento va de 0 a 100 %",
    agreed && agreedCents === null && "El precio pactado no es válido",
    addonList.some((a) => addons[a.feature].custom && a.priceCents === null) && "El precio de algún extra no es válido",
  ].filter(Boolean) as string[];

  const q = errors.length
    ? null
    : previewQuote({ plan, cycle, professionals, discountPercent, priceOverrideCents: agreedCents, addons: addonList, prices });

  const submit = () => {
    if (errors.length) return;
    save.mutate(
      {
        clinicId,
        data: {
          planId: planId || null,
          cycle,
          professionalsOverride: fixPros ? professionals : null,
          discountPercent,
          discountNote: discountNote.trim() || null,
          priceOverrideCents: agreedCents,
          notes: notes.trim() || null,
          addons: addonList,
        },
      },
      {
        onSuccess: (c) =>
          toast.success("Contrato guardado", {
            description: c.features.some((f) => f.contracted && !f.active)
              ? "Hay funcionalidades contratadas sin activar: usa «Aplicar plan» en Funcionalidades."
              : undefined,
          }),
        onError: (e) => toast.error("No se pudo guardar el contrato", { description: e.message }),
      },
    );
  };

  const setAddon = (f: ClinicFeature, change: Partial<AddonDraft>) => setAddons((a) => ({ ...a, [f]: { ...a[f], ...change } }));

  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Plan y precio</h2>
        <p className="text-sm text-muted-foreground">
          Lo que tiene contratado y lo que paga. Precios sin IVA. Los planes se editan en{" "}
          <Link to={`${paths.adminBilling}?tab=planes`} className="underline underline-offset-2">
            Planes
          </Link>
          .
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-plan">Plan</Label>
            <NativeSelect id="contract-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full">
              <NativeSelectOption value="">Sin plan</NativeSelectOption>
              {options.map((p) => (
                <NativeSelectOption key={p.id} value={p.id}>
                  {p.name}
                  {p.archived ? " (archivado)" : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-cycle">Pago</Label>
            <NativeSelect id="contract-cycle" value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)} className="w-full">
              <NativeSelectOption value="monthly">Mensual</NativeSelectOption>
              <NativeSelectOption value="annual">
                Anual{plan && plan.annualMonths < 12 ? ` (${plan.annualMonths} meses por 12)` : ""}
              </NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Profesionales</span>
          <p className="text-sm text-muted-foreground">
            Tiene {contract.professionalsCounted} (propietarios, administradores y fisios; recepción no cuenta). Si cambian, el precio cambia
            solo desde el mes siguiente; las clínicas tienen que confirmarlo al dar de alta a alguien que sube de tramo.
          </p>
          <ProfessionalHistory clinicId={clinicId} alerts={alerts} counted={contract.professionalsCounted} override={contract.professionalsOverride} />
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={fixPros} onCheckedChange={(v) => setFixPros(v === true)} />
            Fijar a mano (p. ej. un propietario que no atiende pacientes)
          </label>
          {fixPros && (
            <Input aria-label="Profesionales que cuentan para el precio" inputMode="numeric" value={pros} onChange={(e) => setPros(e.target.value.replace(/\D/g, ""))} className="w-24" />
          )}
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-sm font-medium">Extras fuera del plan</legend>
          {clinicFeatures.map((f) => {
            const included = !!plan?.features.includes(f.key);
            const a = addons[f.key];
            const listed = prices.get(f.key) ?? null;
            return (
              <div key={f.key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <label className={cn("flex min-w-56 flex-1 items-center gap-2.5", included && "text-muted-foreground")}>
                  <Checkbox checked={included || a.on} disabled={included} onCheckedChange={(v) => setAddon(f.key, { on: v === true })} />
                  {f.label}
                  <span className="text-xs text-muted-foreground">
                    {included ? "· incluida en el plan" : listed === null ? "· sin precio" : `· ${formatPrice(listed)}/mes`}
                  </span>
                </label>
                {!included && a.on && (
                  <span className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox checked={a.custom} onCheckedChange={(v) => setAddon(f.key, { custom: v === true })} />
                      Precio especial
                    </label>
                    {a.custom && (
                      <Input aria-label={`Precio especial de ${f.label}, al mes`} inputMode="decimal" value={a.price} onChange={(e) => setAddon(f.key, { price: e.target.value })} className="h-8 w-20 text-right" />
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-discount">Descuento (%)</Label>
            <Input id="contract-discount" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))} className="w-24" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-discount-note">Motivo del descuento</Label>
            <Input id="contract-discount-note" maxLength={200} placeholder="Segundo centro, fundador…" value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
            Precio pactado del plan (en lugar del de su tramo)
          </label>
          {agreed && (
            <span className="flex items-center gap-2 text-sm">
              <Input aria-label="Precio pactado del plan, al mes" inputMode="decimal" value={agreedPrice} onChange={(e) => setAgreedPrice(e.target.value)} className="w-24 text-right" />
              €/mes
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contract-notes">Notas (opcional)</Label>
          <Input id="contract-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {/* What it costs, as it's being edited */}
        <div className="flex flex-col gap-1.5 rounded-xl bg-muted/40 p-4 text-sm">
          {q ? (
            <>
              <Line label={plan ? `${plan.name} · ${professionals} ${professionals === 1 ? "profesional" : "profesionales"}${agreed ? " (pactado)" : ""}` : "Sin plan"} cents={q.planCents} />
              {q.addons.map((a) => (
                <Line
                  key={a.feature}
                  label={`${featureLabel(a.feature)} (extra)`}
                  cents={a.cents}
                  warn={a.missingPrice ? "sin precio: ponlo en Planes o un precio especial" : undefined}
                />
              ))}
              {q.discountCents > 0 && <Line label={`Descuento ${discountPercent} %`} cents={-q.discountCents} />}
              <div className="mt-1 flex items-baseline justify-between gap-3 border-t pt-2">
                <span className="font-medium">{cycle === "annual" ? `Al año (${q.annualMonths} meses por 12)` : "Al mes"}</span>
                <span className="text-lg font-medium tabular-nums">{formatPrice(q.periodCents)}</span>
              </div>
              {cycle === "annual" && <p className="text-xs text-muted-foreground">Equivale a {formatPrice(q.monthlyCents)} al mes.</p>}
              {contract.exempt && <p className="text-xs text-muted-foreground">Marcada como «no tiene que pagar» en Pagos.</p>}
            </>
          ) : (
            <p className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="size-4" /> {errors[0]}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button className="rounded-full" disabled={errors.length > 0 || save.isPending} onClick={submit}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Guardar contrato
          </Button>
        </div>
      </div>
    </section>
  );
}

function Line({ label, cents, warn }: { label: string; cents: number; warn?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">
        {label}
        {warn && <span className="ml-1.5 text-xs text-amber-700 dark:text-amber-400">· {warn}</span>}
      </span>
      <span className="tabular-nums">{formatPrice(cents)}</span>
    </div>
  );
}

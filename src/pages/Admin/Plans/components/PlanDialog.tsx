import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { ClinicFeature, Plan, PlanInput } from "@/adapters/api";
import { useCreatePlan, useUpdatePlan } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clinicFeatures } from "@/lib/features";
import { centsToInput, inputToCents } from "../../Settings/Services/serviceFormat";

type Props = { plan: Plan | null; nextPosition: number; onClose: () => void };
type TierDraft = { upTo: string; price: string };

// Create or edit a plan: name, what it includes, monthly price by number of
// professionals, the price per professional over the last tier and the
// annual discount
export default function PlanDialog({ plan, nextPosition, onClose }: Props) {
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [features, setFeatures] = useState<ClinicFeature[]>(plan?.features ?? []);
  const [tiers, setTiers] = useState<TierDraft[]>(
    plan?.priceTiers.map((t) => ({ upTo: String(t.upTo), price: centsToInput(t.cents) })) ?? [{ upTo: "1", price: "" }],
  );
  const [extra, setExtra] = useState(plan ? centsToInput(plan.extraProfessionalCents) : "0");
  const [annualMonths, setAnnualMonths] = useState(String(plan?.annualMonths ?? 10));
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const pending = create.isPending || update.isPending;

  // Checked here too, so the button says what's wrong before saving
  const parsedTiers = tiers.map((t) => ({ upTo: Number(t.upTo), cents: inputToCents(t.price) }));
  const tiersOk =
    parsedTiers.length > 0 &&
    parsedTiers.every((t, i) => Number.isInteger(t.upTo) && t.upTo >= 1 && t.cents !== null && (i === 0 || t.upTo > parsedTiers[i - 1]!.upTo));
  const extraCents = inputToCents(extra);
  const months = Number(annualMonths);
  const valid = !!name.trim() && tiersOk && extraCents !== null && Number.isInteger(months) && months >= 1 && months <= 12;

  const save = () => {
    if (!valid) return;
    const data: PlanInput = {
      name: name.trim(),
      description: description.trim() || null,
      position: plan?.position ?? nextPosition,
      priceTiers: parsedTiers.map((t) => ({ upTo: t.upTo, cents: t.cents! })),
      extraProfessionalCents: extraCents!,
      annualMonths: months,
      archived: plan?.archived ?? false,
      features,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(plan ? "Plan guardado" : "Plan creado", {
          description: plan ? "Las clínicas con este plan ven ya los precios nuevos." : undefined,
        });
        onClose();
      },
      onError: (e: Error) => toast.error("No se pudo guardar el plan", { description: e.message }),
    };
    if (plan) update.mutate({ id: plan.id, data }, callbacks);
    else create.mutate(data, callbacks);
  };

  const setTier = (i: number, change: Partial<TierDraft>) => setTiers((list) => list.map((t, n) => (n === i ? { ...t, ...change } : t)));

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? `Editar ${plan.name}` : "Nuevo plan"}</DialogTitle>
          <DialogDescription>Precios al mes y sin IVA.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Nombre</Label>
            <Input id="plan-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-description">Descripción (opcional)</Label>
            <Textarea id="plan-description" rows={2} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 text-sm font-medium">Incluye</legend>
            <p className="-mt-1 text-xs text-muted-foreground">Agenda, clases, equipo, salas, servicios e informes van siempre.</p>
            {clinicFeatures.map((f) => (
              <label key={f.key} className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={features.includes(f.key)}
                  onCheckedChange={(v) => setFeatures((list) => (v === true ? [...list, f.key] : list.filter((x) => x !== f.key)))}
                />
                {f.label}
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Precio al mes por número de profesionales</legend>
            <p className="-mt-1 text-xs text-muted-foreground">Profesionales: propietarios, administradores y fisios. Recepción no cuenta.</p>
            {tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-12 shrink-0 text-muted-foreground">Hasta</span>
                <Input
                  aria-label={`Tramo ${i + 1}: hasta cuántos profesionales`}
                  inputMode="numeric"
                  value={t.upTo}
                  onChange={(e) => setTier(i, { upTo: e.target.value.replace(/\D/g, "") })}
                  className="w-16"
                />
                <span className="shrink-0 text-muted-foreground">prof.</span>
                <Input
                  aria-label={`Tramo ${i + 1}: precio al mes`}
                  inputMode="decimal"
                  value={t.price}
                  placeholder="0"
                  onChange={(e) => setTier(i, { price: e.target.value })}
                  className="w-24 text-right"
                />
                <span className="shrink-0 text-muted-foreground">€/mes</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  disabled={tiers.length === 1}
                  onClick={() => setTiers((list) => list.filter((_, n) => n !== i))}
                  aria-label={`Quitar tramo ${i + 1}`}
                >
                  <X />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit rounded-full"
              disabled={tiers.length >= 10}
              onClick={() => setTiers((list) => [...list, { upTo: String((Number(list[list.length - 1]?.upTo) || 0) + 1), price: "" }])}
            >
              <Plus /> Añadir tramo
            </Button>
            {!tiersOk && <p className="text-xs text-destructive">Cada tramo necesita un precio y más profesionales que el anterior.</p>}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-extra">Por cada profesional de más (€/mes)</Label>
              <Input id="plan-extra" inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} />
              <p className="text-xs text-muted-foreground">Por encima del último tramo.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-annual">Pago anual: meses que se cobran</Label>
              <Input id="plan-annual" inputMode="numeric" value={annualMonths} onChange={(e) => setAnnualMonths(e.target.value.replace(/\D/g, ""))} />
              <p className="text-xs text-muted-foreground">De 12. Con 10, dos meses gratis (también en los extras).</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button className="rounded-full" disabled={!valid || pending} onClick={save}>
            {pending && <Loader2 className="animate-spin" />}
            {plan ? "Guardar" : "Crear plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

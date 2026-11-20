import type { BillingCycle, ClinicFeature, Plan, PriceTier } from "@/adapters/api";
import { clinicFeatures } from "@/lib/features";

// Labels and texts for plans and contracts (superadmin)

export const featureLabel = (key: ClinicFeature) => clinicFeatures.find((f) => f.key === key)?.label ?? key;

// Each tier as "1 profesional", "2–3", "4–6"…
export function tierLabels(tiers: PriceTier[]) {
  const sorted = [...tiers].sort((a, b) => a.upTo - b.upTo);
  return sorted.map((t, i) => {
    const from = i === 0 ? 1 : sorted[i - 1]!.upTo + 1;
    const range = from === t.upTo ? `${t.upTo}` : `${from}–${t.upTo}`;
    return { ...t, label: `${range} ${t.upTo === 1 ? "profesional" : "profesionales"}` };
  });
}

export const cycleLabel = { monthly: "Mensual", annual: "Anual" } as const;

// ---------- The price while editing a contract ----------
// Same rules as back/src/lib/plans.ts (quote): the server's answer is what's
// saved; this is only the live preview


export function tierPrice(plan: Pick<Plan, "priceTiers" | "extraProfessionalCents">, professionals: number) {
  const tiers = [...plan.priceTiers].sort((a, b) => a.upTo - b.upTo);
  const tier = tiers.find((t) => professionals <= t.upTo);
  if (tier) return tier.cents;
  const top = tiers[tiers.length - 1]!;
  return top.cents + (professionals - top.upTo) * plan.extraProfessionalCents;
}

export function previewQuote(input: {
  plan: Plan | null;
  cycle: BillingCycle;
  professionals: number;
  discountPercent: number;
  priceOverrideCents: number | null;
  addons: { feature: ClinicFeature; priceCents: number | null }[];
  prices: Map<ClinicFeature, number | null>;
}) {
  const planCents = input.priceOverrideCents ?? (input.plan ? tierPrice(input.plan, input.professionals) : 0);
  const addons = input.addons
    .filter((a) => !input.plan?.features.includes(a.feature))
    .map((a) => {
      const listed = input.prices.get(a.feature) ?? null;
      return { feature: a.feature, cents: a.priceCents ?? listed ?? 0, missingPrice: a.priceCents === null && listed === null };
    });
  const subtotalCents = planCents + addons.reduce((n, a) => n + a.cents, 0);
  const discountCents = Math.round((subtotalCents * input.discountPercent) / 100);
  const monthly = subtotalCents - discountCents;
  const annualMonths = input.plan?.annualMonths ?? 12;
  const periodCents = input.cycle === "annual" ? monthly * annualMonths : monthly;
  return { planCents, addons, subtotalCents, discountCents, periodCents, annualMonths, monthlyCents: input.cycle === "annual" ? Math.round(periodCents / 12) : monthly };
}

import { useRef, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { cn } from "@/lib/utils";
import BillingTab from "../Billing/BillingPage";
import ContractsTab from "../Contracts/ContractsPage";
import PlansTab from "../Plans/PlansPage";

// Superadmin only: everything about what clinics pay, in one place.
//   Contratos: what each clinic has contracted, has active and pays (default)
//   Pagos: which months each clinic has paid
//   Planes: the plans and prices themselves
// The tab is in the address (?tab=pagos), so it can be linked and Back works.
// Protected in the router (superadminAccess) and in the backend
const TABS = [
  { key: "contratos", label: "Contratos", description: "Qué tiene contratado cada clínica, qué tiene activo y lo que paga. Precios sin IVA." },
  { key: "pagos", label: "Pagos", description: "Marca qué clínicas han pagado cada mes." },
  { key: "planes", label: "Planes", description: "Lo que incluye cada plan y lo que cuesta. Precios al mes y sin IVA." },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const current: TabKey = TABS.some((t) => t.key === requested) ? (requested as TabKey) : "contratos";
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = TABS.find((t) => t.key === current)!;

  const select = (key: TabKey) => setParams(key === "contratos" ? {} : { tab: key });

  // Arrow keys move between tabs (the WAI-ARIA tabs pattern)
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const next = e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const i = (next + TABS.length) % TABS.length;
    select(TABS[i]!.key);
    tabRefs.current[i]?.focus();
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-coral">Plataforma</span>
          <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Suscripciones</h1>
          <p className="text-muted-foreground">{active.description}</p>
        </div>
        <div role="tablist" aria-label="Suscripciones" className="flex w-fit gap-1 rounded-full border bg-card p-1">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={t.key === current}
              aria-controls={`panel-${t.key}`}
              tabIndex={t.key === current ? 0 : -1}
              onClick={() => select(t.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                t.key === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div role="tabpanel" id={`panel-${current}`} aria-labelledby={`tab-${current}`} className="flex flex-col gap-8">
        {current === "contratos" && <ContractsTab />}
        {current === "pagos" && <BillingTab />}
        {current === "planes" && <PlansTab />}
      </div>
    </div>
  );
}

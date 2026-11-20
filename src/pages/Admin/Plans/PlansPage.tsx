import { useState } from "react";
import { Archive, ArchiveRestore, CircleAlert, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Plan } from "@/adapters/api";
import { useDeletePlan, usePlans, useUpdatePlan } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatPrice } from "../Settings/Services/serviceFormat";
import FeaturePrices from "./components/FeaturePrices";
import PlanDialog from "./components/PlanDialog";
import { featureLabel, tierLabels } from "./planUtils";

// Suscripciones → Planes (superadmin only): the plans Kineflow offers, what
// each includes and what it costs, and the price of each feature as an extra.
// Each clinic's plan is set in its page (Clínicas → a clinic → Plan y precio).
// Shown inside SubscriptionsPage; protected in the router (superadminAccess)
// and in the backend (requireSuperAdmin)
export default function PlansTab() {
  const { data, isPending, error } = usePlans();
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const plans = data?.plans ?? [];
  const active = plans.filter((p) => !p.archived);
  const archived = plans.filter((p) => p.archived);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">El plan de cada clínica se elige en su ficha (Plan y precio).</p>
        <Button className="rounded-full" onClick={() => setEditing("new")}>
          <Plus /> Nuevo plan
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error.message}
        </div>
      ) : (
        <>
          {active.length === 0 ? (
            <p className="rounded-[1.75rem] border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Todavía no hay planes. Crea el primero o carga los de partida con <code>npm run db:seed-plans</code>.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((p) => (
                <PlanCard key={p.id} plan={p} clinics={data.clinicsByPlan[p.id] ?? 0} onEdit={() => setEditing(p)} />
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">Archivados</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {archived.map((p) => (
                  <PlanCard key={p.id} plan={p} clinics={data.clinicsByPlan[p.id] ?? 0} onEdit={() => setEditing(p)} />
                ))}
              </div>
            </section>
          )}

          <FeaturePrices prices={data.featurePrices} plans={active} />
        </>
      )}

      {editing && <PlanDialog plan={editing === "new" ? null : editing} nextPosition={plans.length + 1} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PlanCard({ plan, clinics, onEdit }: { plan: Plan; clinics: number; onEdit: () => void }) {
  const update = useUpdatePlan();
  const remove = useDeletePlan();
  const tiers = tierLabels(plan.priceTiers);
  const top = tiers[tiers.length - 1];
  const { id: _id, ...input } = plan;

  const setArchived = (archived: boolean) =>
    update.mutate(
      { id: plan.id, data: { ...input, archived } },
      {
        onSuccess: () => toast.success(archived ? `${plan.name} archivado` : `${plan.name} vuelve a estar disponible`),
        onError: (e) => toast.error("No se pudo guardar", { description: e.message }),
      },
    );

  return (
    <section className={cn("flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5", plan.archived && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            {plan.name}
            {plan.archived && <Badge variant="outline">Archivado</Badge>}
          </h2>
          {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-full" aria-label={`Opciones de ${plan.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Editar
            </DropdownMenuItem>
            {plan.archived ? (
              <DropdownMenuItem onSelect={() => setArchived(false)}>
                <ArchiveRestore /> Volver a ofrecerlo
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setArchived(true)}>
                <Archive /> Archivar
              </DropdownMenuItem>
            )}
            {clinics === 0 && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() =>
                  remove.mutate(plan.id, {
                    onSuccess: () => toast.success(`${plan.name} borrado`),
                    onError: (e) => toast.error("No se pudo borrar", { description: e.message }),
                  })
                }
              >
                <Trash2 /> Borrar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {plan.features.length === 0 ? (
          <li className="text-xs text-muted-foreground">Sin funcionalidades extra: solo lo básico (agenda, clases, equipo, informes).</li>
        ) : (
          plan.features.map((f) => (
            <li key={f}>
              <Badge variant="secondary">{featureLabel(f)}</Badge>
            </li>
          ))
        )}
      </ul>

      <table className="w-full text-sm">
        <tbody className="divide-y">
          {tiers.map((t) => (
            <tr key={t.upTo}>
              <td className="py-1.5 text-muted-foreground">{t.label}</td>
              <td className="py-1.5 text-right font-medium tabular-nums">{formatPrice(t.cents)}/mes</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">
        {top && plan.extraProfessionalCents > 0 ? `Más de ${top.upTo}: +${formatPrice(plan.extraProfessionalCents)} por profesional. ` : ""}
        Pago anual: {plan.annualMonths === 12 ? "sin descuento" : `${plan.annualMonths} meses por 12`}.
      </p>
      <p className="mt-auto text-xs font-medium">
        {clinics === 0 ? "Ninguna clínica lo tiene" : `${clinics} ${clinics === 1 ? "clínica" : "clínicas"} con este plan`}
      </p>
    </section>
  );
}

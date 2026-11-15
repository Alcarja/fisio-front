import type { Me } from "@/adapters/api";
import ClinicAvatar from "@/components/ClinicAvatar";
import { clinicRoleLabels, clinicRoleOrder } from "@/lib/roles";

// The clinics the user belongs to and their role in each. Read only: roles are
// changed by each clinic's owner or admins (Equipo)
export default function ClinicsList({ me }: { me: Me }) {
  const activeId = me.activeClinic?.clinicId;
  const memberships = [...me.memberships].sort(
    (a, b) =>
      Number(b.clinicId === activeId) - Number(a.clinicId === activeId) ||
      clinicRoleOrder.indexOf(a.role) - clinicRoleOrder.indexOf(b.role) ||
      a.clinicName.localeCompare(b.clinicName, "es"),
  );

  if (memberships.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {me.user.role === "superadmin"
          ? "Como superadmin gestionas las clínicas desde Plataforma."
          : "No perteneces a ninguna clínica."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y">
      {memberships.map((m) => (
        <li key={m.clinicId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <ClinicAvatar clinicId={m.clinicId} name={m.clinicName} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{m.clinicName}</span>
            <span className="text-xs text-muted-foreground">{clinicRoleLabels[m.role]}</span>
          </div>
          {m.clinicId === activeId && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-coral" /> Activa
            </span>
          )}
          {m.clinicStatus === "inactive" && (
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              Inactiva
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

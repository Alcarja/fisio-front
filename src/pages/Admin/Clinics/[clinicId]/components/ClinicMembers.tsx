import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import type {
  ClinicInvitation,
  ClinicMember,
  ClinicRole,
  MemberRoleChange,
} from "@/adapters/api";
import { useUpdateMemberRoles } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import InviteOwnerDialog from "./InviteOwnerDialog";
import PendingInvitations from "./PendingInvitations";
import MemberAvatar from "@/components/MemberAvatar";
import { assignableRoles, roleLabels, roleOrder } from "./memberRoles";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

const rolesById = (members: ClinicMember[]) =>
  Object.fromEntries(members.map((m) => [m.memberId, m.role])) as Record<
    string,
    ClinicRole
  >;

type Props = {
  clinicId: string;
  members: ClinicMember[];
  invitations: ClinicInvitation[];
};

// The clinic's team: change staff roles (saved together with "Guardar equipo"),
// change the owner (by invitation) and manage pending invitations.
// Render with key={clinic.id}
export default function ClinicMembers({ clinicId, members, invitations }: Props) {
  const initialRoles = rolesById(members);
  const [roles, setRoles] = useState(initialRoles);

  const owner = members.find((m) => m.role === "owner");
  const hasStaff = members.some((m) => m.role !== "owner");
  const pendingOwnerInvitation = invitations.find((i) => i.role === "owner");

  const updateRoles = useUpdateMemberRoles();

  // Only the members whose role actually changed, ready to send.
  // The owner has no dropdown, so their role never changes here
  const changes: MemberRoleChange[] = members
    .filter((m) => m.role !== "owner" && roles[m.memberId] !== initialRoles[m.memberId])
    .map((m) => ({
      memberId: m.memberId,
      role: roles[m.memberId] as MemberRoleChange["role"],
    }));
  const isDirty = changes.length > 0;

  // Order by the role as loaded, so rows don't jump around while editing
  const sorted = [...members].sort(
    (a, b) =>
      roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) ||
      a.name.localeCompare(b.name),
  );

  const setRole = (memberId: string, role: ClinicRole) =>
    setRoles((r) => ({ ...r, [memberId]: role }));

  const save = () =>
    updateRoles.mutate(
      { clinicId, changes },
      {
        onSuccess: (saved) => {
          // Start again from what the server saved
          setRoles(rolesById(saved));
          toast.success("Equipo actualizado", {
            description:
              changes.length === 1
                ? "Se ha cambiado el rol de 1 persona."
                : `Se ha cambiado el rol de ${changes.length} personas.`,
          });
        },
        // The draft is kept, so the changes can be retried
        onError: (error) =>
          toast.error("No se pudieron guardar los roles", {
            description: error.message,
          }),
      },
    );

  return (
    <section className="grid gap-6 rounded-[1.75rem] border bg-card p-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col items-start gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Equipo</h2>
          <p className="text-sm text-muted-foreground">
            {members.length === 1 ? "1 persona" : `${members.length} personas`} con
            acceso a esta clínica.
          </p>
        </div>
        {/* The owner is always set by invitation. While one is pending it's
            managed (resend / cancel) in "Invitaciones pendientes" */}
        {pendingOwnerInvitation ? (
          owner && (
            <p className="text-xs text-muted-foreground">
              Cambio de propietario pendiente: {pendingOwnerInvitation.email}
            </p>
          )
        ) : (
          <InviteOwnerDialog clinicId={clinicId} currentOwner={owner} />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Users className="size-5" />
            {pendingOwnerInvitation ? (
              <span>
                Nadie se ha unido todavía. La clínica tendrá propietario cuando{" "}
                <strong className="font-medium text-foreground">
                  {pendingOwnerInvitation.email}
                </strong>{" "}
                acepte la invitación.
              </span>
            ) : (
              "Esta clínica no tiene miembros. Invita a un propietario para empezar."
            )}
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {sorted.map((member) => {
              const role = roles[member.memberId]!;
              const changed = role !== initialRoles[member.memberId];
              const selectId = `role-${member.memberId}`;

              return (
                <li
                  key={member.memberId}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
                >
                  <MemberAvatar member={member} />
                  <div className="flex min-w-0 flex-1 basis-[calc(100%-3rem)] flex-col sm:basis-0">
                    <span className="flex items-center gap-2 truncate text-sm font-medium">
                      {member.name}
                      {changed && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-coral"
                          title="Cambio sin guardar"
                        />
                      )}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {member.email}
                    </span>
                    <span className="text-xs text-muted-foreground lg:hidden">
                      Desde {dateFormat.format(new Date(member.joinedAt))}
                    </span>
                  </div>
                  <span className="hidden text-sm text-muted-foreground lg:block">
                    Desde {dateFormat.format(new Date(member.joinedAt))}
                  </span>

                  {/* Owner is changed with "Cambiar propietario", not here */}
                  {role === "owner" ? (
                    <Badge variant="secondary" className="ml-12 h-8 w-40 justify-center sm:ml-0">
                      {roleLabels.owner}
                    </Badge>
                  ) : (
                    <>
                      <label htmlFor={selectId} className="sr-only">
                        Rol de {member.name}
                      </label>
                      <NativeSelect
                        id={selectId}
                        value={role}
                        disabled={updateRoles.isPending}
                        onChange={(e) =>
                          setRole(member.memberId, e.target.value as ClinicRole)
                        }
                        // className goes on the wrapper, so target the <select> inside
                        className={cn("ml-12 w-40 sm:ml-0", changed && "[&>select]:border-coral")}
                      >
                        {assignableRoles.map((r) => (
                          <NativeSelectOption key={r} value={r}>
                            {roleLabels[r]}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Save bar, same as the details form. Only staff roles can change */}
        {hasStaff && (
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
            {isDirty && (
              <span className="text-sm text-muted-foreground sm:mr-auto">
                {changes.length === 1
                  ? "1 cambio sin guardar."
                  : `${changes.length} cambios sin guardar.`}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!isDirty || updateRoles.isPending}
              onClick={() => setRoles(initialRoles)}
            >
              Descartar
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!isDirty || updateRoles.isPending}
              onClick={save}
            >
              {updateRoles.isPending && <Loader2 className="animate-spin" />}
              Guardar equipo
            </Button>
          </div>
        )}

        <PendingInvitations clinicId={clinicId} invitations={invitations} />
      </div>
    </section>
  );
}

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicMember } from "@/adapters/api";
import { useUpdateTeamMemberRole } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  assignableClinicRoles,
  clinicRoleLabels,
  type AssignableClinicRole,
} from "@/lib/roles";

type Props = {
  member: ClinicMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Change a staff member's role (never to or from owner)
export default function ChangeRoleDialog({ member, open, onOpenChange }: Props) {
  const current = member.role as AssignableClinicRole;
  const [role, setRole] = useState<AssignableClinicRole>(current);
  const update = useUpdateTeamMemberRole();

  const close = (next: boolean) => {
    if (!next && update.isPending) return;
    onOpenChange(next);
    if (!next) setRole(current);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update.mutate(
      { memberId: member.memberId, role },
      {
        onSuccess: () => {
          toast.success("Rol actualizado", {
            description: `${member.name} ahora es ${clinicRoleLabels[role].toLowerCase()}.`,
          });
          close(false);
        },
        onError: (error) =>
          toast.error("No se pudo cambiar el rol", { description: error.message }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>
              Elige qué puede hacer <strong className="font-medium text-foreground">{member.name}</strong>{" "}
              en tu clínica.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="change-role">Rol</Label>
            <NativeSelect
              id="change-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AssignableClinicRole)}
              className="w-full"
            >
              {assignableClinicRoles.map((r) => (
                <NativeSelectOption key={r} value={r}>
                  {clinicRoleLabels[r]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={update.isPending}
              onClick={() => close(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={role === current || update.isPending}
            >
              {update.isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

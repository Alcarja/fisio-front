import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { NewMember } from "@/adapters/api";
import { useAddMember } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  assignableClinicRoles,
  clinicRoleLabels,
  type AssignableClinicRole,
} from "@/lib/roles";

// What each role is for, shown under the role picker
const roleHints: Record<AssignableClinicRole, string> = {
  admin: "Gestiona la clínica y su equipo, igual que el propietario.",
  receptionist: "Gestiona la agenda y los datos de los pacientes.",
  physio: "Atiende a sus pacientes y gestiona su propia agenda.",
};

const empty = { email: "", name: "", role: "physio" as AssignableClinicRole };

// "Añadir miembro" button + popup. Adds someone to the ACTIVE clinic's team:
// a new email gets an account right away; an existing account gets an invitation
export default function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const addMember = useAddMember();

  const handleOpenChange = (next: boolean) => {
    if (!next && addMember.isPending) return;
    setOpen(next);
    if (!next) {
      setForm(empty);
      addMember.reset();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const member: NewMember = {
      email: form.email.trim().toLowerCase(),
      ...(form.name.trim() && { name: form.name.trim() }),
      role: form.role,
    };
    addMember.mutate(member, {
      onSuccess: (result) => {
        toast.success(
          result.invited
            ? `${member.email} ya tenía cuenta: le hemos enviado una invitación`
            : `${member.email} añadido al equipo`,
        );
        handleOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <UserPlus /> Añadir miembro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Añadir miembro</DialogTitle>
            <DialogDescription>Añade a una persona al equipo de tu clínica.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                required
                autoFocus
                autoComplete="off"
                placeholder="nombre@clinica.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Si ya tiene cuenta en Kineflow, le enviaremos una invitación para que la acepte.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="member-name">
                Nombre <span className="font-normal text-muted-foreground">(si es nuevo)</span>
              </Label>
              <Input
                id="member-name"
                autoComplete="off"
                placeholder="Nombre y apellidos"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Solo se usa si todavía no tiene cuenta.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="member-role">Rol</Label>
              <NativeSelect
                id="member-role"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as AssignableClinicRole }))
                }
                className="w-full"
              >
                {assignableClinicRoles.map((role) => (
                  <NativeSelectOption key={role} value={role}>
                    {clinicRoleLabels[role]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">{roleHints[form.role]}</p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={addMember.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="rounded-full" disabled={addMember.isPending}>
              {addMember.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Añadiendo…
                </>
              ) : (
                "Añadir"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

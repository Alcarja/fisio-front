import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicMember } from "@/adapters/api";
import { useRemoveTeamMember } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  member: ClinicMember;
  clinicName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// "Are you sure?" before taking someone out of the clinic
export default function RemoveMemberDialog({ member, clinicName, open, onOpenChange }: Props) {
  const remove = useRemoveTeamMember();

  const close = (next: boolean) => {
    if (!next && remove.isPending) return;
    onOpenChange(next);
  };

  const confirm = () =>
    remove.mutate(member.memberId, {
      onSuccess: () => {
        toast.success("Miembro eliminado", {
          description: `${member.name} ya no forma parte de ${clinicName}.`,
        });
        close(false);
      },
      onError: (error) =>
        toast.error("No se pudo eliminar al miembro", { description: error.message }),
    });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar a {member.name} del equipo?</DialogTitle>
          <DialogDescription>
            Dejará de tener acceso a {clinicName}. Su cuenta se mantiene, y también su
            acceso a otras clínicas.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={remove.isPending}
            onClick={() => close(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={remove.isPending}
            onClick={confirm}
          >
            {remove.isPending && <Loader2 className="animate-spin" />}
            Eliminar del equipo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicMember } from "@/adapters/api";
import { useSetTeamMemberPassword } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Same minimum as the backend (Better Auth emailAndPassword.minPasswordLength)
const MIN_PASSWORD_LENGTH = 10;

type Props = {
  member: ClinicMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Set a new password for a staff member
export default function ChangePasswordDialog({ member, open, onOpenChange }: Props) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [show, setShow] = useState(false);
  const setMemberPassword = useSetTeamMemberPassword();

  const mismatch = repeat.length > 0 && password !== repeat;

  const close = (next: boolean) => {
    if (!next && setMemberPassword.isPending) return;
    onOpenChange(next);
    if (!next) {
      setPassword("");
      setRepeat("");
      setShow(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== repeat) return;
    setMemberPassword.mutate(
      { memberId: member.memberId, newPassword: password },
      {
        onSuccess: () => {
          toast.success("Contraseña actualizada", {
            description: `Se ha cerrado su sesión. Comunícale la nueva contraseña a ${member.name}.`,
          });
          close(false);
        },
        onError: (error) =>
          toast.error("No se pudo cambiar la contraseña", { description: error.message }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para{" "}
              <strong className="font-medium text-foreground">{member.name}</strong> (
              {member.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  required
                  autoFocus
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo {MIN_PASSWORD_LENGTH} caracteres.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="repeat-password">Repite la contraseña</Label>
              <Input
                id="repeat-password"
                type={show ? "text" : "password"}
                required
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                aria-invalid={mismatch}
              />
              {mismatch && (
                <p role="alert" className="text-xs text-destructive">
                  Las contraseñas no coinciden.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={setMemberPassword.isPending}
              onClick={() => close(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={mismatch || setMemberPassword.isPending}
            >
              {setMemberPassword.isPending && <Loader2 className="animate-spin" />}
              Guardar contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, type FormEvent } from "react";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicMember } from "@/adapters/api";
import { useCreateInvitation } from "@/adapters/hook";
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

type Props = {
  clinicId: string;
  // The owner being replaced, if the clinic has one
  currentOwner?: ClinicMember;
};

// Sends an owner invitation. With a current owner it's "Cambiar propietario":
// the change happens when the invited person accepts.
// Without one it's "Invitar propietario" (e.g. the first invitation was cancelled)
export default function InviteOwnerDialog({ clinicId, currentOwner }: Props) {
  const title = currentOwner ? "Cambiar propietario" : "Invitar propietario";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const invite = useCreateInvitation();

  const handleOpenChange = (next: boolean) => {
    if (!next && invite.isPending) return;
    setOpen(next);
    if (!next) {
      setEmail("");
      invite.reset();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    invite.mutate(
      { clinicId, email: trimmed, role: "owner" },
      {
        onSuccess: () => {
          handleOpenChange(false);
          toast.success("Invitación enviada", {
            description: `${trimmed} será el ${currentOwner ? "nuevo " : ""}propietario cuando la acepte.`,
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={currentOwner ? "outline" : "default"}
          className="rounded-full"
        >
          <Crown /> {title}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {currentOwner ? (
                <>
                  Le enviaremos una invitación al nuevo propietario. Cuando la acepte,{" "}
                  <strong className="font-medium text-foreground">
                    {currentOwner.name}
                  </strong>{" "}
                  dejará de ser propietario. Hasta entonces, nada cambia.
                </>
              ) : (
                "Le enviaremos una invitación. Será el propietario cuando la acepte."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="owner-email">Email</Label>
            <Input
              id="owner-email"
              type="email"
              required
              autoFocus
              autoComplete="off"
              placeholder="propietario@clinica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {/* Errors stay in the dialog so the email can be fixed */}
            {invite.error && (
              <p role="alert" className="text-sm text-destructive">
                {invite.error.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={invite.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="rounded-full" disabled={invite.isPending}>
              {invite.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Enviando…
                </>
              ) : (
                "Enviar invitación"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

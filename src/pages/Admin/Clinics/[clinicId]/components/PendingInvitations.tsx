import { useState } from "react";
import { Loader2, Mail, RotateCw, X } from "lucide-react";
import { toast } from "sonner";
import type { ClinicInvitation } from "@/adapters/api";
import { useCancelInvitation, useResendInvitation } from "@/adapters/hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { roleLabels } from "./memberRoles";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

type Props = {
  clinicId: string;
  invitations: ClinicInvitation[];
};

// Invitations sent but not accepted yet, with resend and cancel
export default function PendingInvitations({ clinicId, invitations }: Props) {
  const resend = useResendInvitation();
  const cancel = useCancelInvitation();
  // Invitation waiting for the "are you sure?" confirmation
  const [toCancel, setToCancel] = useState<ClinicInvitation | null>(null);
  // "Now" read once, not on every render
  const [now] = useState(() => Date.now());

  if (invitations.length === 0) return null;

  const handleResend = (invitation: ClinicInvitation) =>
    resend.mutate(
      { clinicId, invitationId: invitation.id },
      {
        onSuccess: () =>
          toast.success("Invitación reenviada", {
            description: `Se ha enviado de nuevo a ${invitation.email}.`,
          }),
        onError: (error) =>
          toast.error("No se pudo reenviar la invitación", {
            description: error.message,
          }),
      },
    );

  const confirmCancel = () => {
    if (!toCancel) return;
    const invitation = toCancel;
    cancel.mutate(
      { clinicId, invitationId: invitation.id },
      {
        onSuccess: () => {
          setToCancel(null);
          toast.success("Invitación cancelada", {
            description: `El enlace enviado a ${invitation.email} ya no funciona.`,
          });
        },
        onError: (error) =>
          toast.error("No se pudo cancelar la invitación", {
            description: error.message,
          }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Invitaciones pendientes
      </h3>

      <ul className="flex flex-col gap-2">
        {invitations.map((invitation) => {
          const expired = new Date(invitation.expiresAt).getTime() < now;
          const isResending =
            resend.isPending && resend.variables?.invitationId === invitation.id;

          return (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-dashed px-3 py-2.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </span>
              <div className="flex min-w-0 flex-1 basis-[calc(100%-3rem)] flex-col sm:basis-0">
                <span className="truncate text-sm font-medium">{invitation.email}</span>
                <span
                  className={
                    expired ? "text-xs text-destructive" : "text-xs text-muted-foreground"
                  }
                >
                  {expired
                    ? `Caducó el ${dateFormat.format(new Date(invitation.expiresAt))}`
                    : `Caduca el ${dateFormat.format(new Date(invitation.expiresAt))}`}
                </span>
              </div>

              {/* Phones: role and actions on a second line under the email.
                  From sm the wrapper disappears and they sit in the row */}
              <div className="ml-12 flex flex-wrap items-center gap-x-3 gap-y-1 sm:contents">
              {invitation.role && (
                <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
              )}

              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={expired ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  disabled={isResending}
                  onClick={() => handleResend(invitation)}
                >
                  {isResending ? <Loader2 className="animate-spin" /> : <RotateCw />}
                  Reenviar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setToCancel(invitation)}
                >
                  <X /> Cancelar
                </Button>
              </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Cancelling can't be undone, so ask first */}
      <Dialog
        open={toCancel !== null}
        onOpenChange={(open) => {
          if (!open && !cancel.isPending) setToCancel(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cancelar la invitación?</DialogTitle>
            <DialogDescription>
              El enlace enviado a{" "}
              <strong className="font-medium text-foreground">{toCancel?.email}</strong>{" "}
              dejará de funcionar.
              {toCancel?.role === "owner" &&
                " La clínica se quedará sin propietario hasta que invites a otra persona."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={cancel.isPending}
              >
                Volver
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={cancel.isPending}
              onClick={confirmCancel}
            >
              {cancel.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Cancelando…
                </>
              ) : (
                "Cancelar invitación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

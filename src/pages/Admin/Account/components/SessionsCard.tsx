import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useSignOutOtherDevices } from "@/adapters/hook";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";

// Logs the user out everywhere except here (a lost phone, a shared computer…)
export default function SessionsCard() {
  const signOutOthers = useSignOutOtherDevices();
  const [confirming, setConfirming] = useState(false);

  const confirm = () =>
    signOutOthers.mutate(undefined, {
      onSuccess: () => {
        setConfirming(false);
        toast.success("Sesión cerrada en los demás dispositivos");
      },
      onError: (error) =>
        toast.error("No se pudo cerrar la sesión", { description: error.message }),
    });

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">
        Si has entrado desde un ordenador compartido o has perdido el móvil, cierra la sesión en
        todos los dispositivos menos en este.
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-full px-5"
        onClick={() => setConfirming(true)}
      >
        <LogOut /> Cerrar sesión en los demás
      </Button>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="¿Cerrar sesión en los demás dispositivos?"
        description="Tendrás que volver a entrar en ellos. En este dispositivo sigues conectado."
        confirmLabel="Cerrar sesiones"
        onConfirm={confirm}
        pending={signOutOthers.isPending}
      />
    </div>
  );
}
